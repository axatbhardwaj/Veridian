import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- App Setup ---
const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Constants & Config ---
const PORT = process.env.PORT || 8000;
const MAX_MARKDOWN_BYTES = 256 * 1024; // 256 KB
const MIN_PRICE_CENTS = 100; // $1.00
const MAX_PRICE_CENTS = 500; // $5.00
const RESOURCE_SERVER_URL = process.env.RESOURCE_SERVER_URL || 'http://localhost:3001';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "else", "for", "to", "of",
  "in", "on", "at", "by", "with", "about", "as", "is", "are", "was", "were",
  "be", "been", "being", "it", "this", "that", "these", "those", "i", "you",
  "he", "she", "they", "we", "my", "your", "their", "our", "from",
]);

// --- Heuristic Helpers ---

const tokenizeWords = (text) => {
  return (text || '').toLowerCase().match(/[a-z0-9]+/g) || [];
};

const extractHeuristicKeywords = (markdown, maxKeywords = 10) => {
  const words = tokenizeWords(markdown).filter(w => !STOPWORDS.has(w) && w.length > 2);
  if (!words.length) return [];
  
  const counts = words.reduce((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
};

const clampPrice = (cents) => {
  return Math.max(MIN_PRICE_CENTS, Math.min(MAX_PRICE_CENTS, cents));
};

const estimateHeuristicPrice = (markdown) => {
  const words = tokenizeWords(markdown);
  if (!words.length) return MIN_PRICE_CENTS;

  const uniqueRatio = (new Set(words)).size / words.length;
  const base = 100 + Math.floor(words.length / 250) * 100; // +$1 per 250 words
  const bump = uniqueRatio > 0.6 ? 100 : 0;
  return clampPrice(base + bump);
};


// --- Gemini Helpers ---

const sanitizeKeywords = (keywords, maxKeywords = 10) => {
    if (!Array.isArray(keywords)) return [];
    const seen = new Set();
    const result = [];
    for (const kw of keywords) {
        if (typeof kw !== 'string') continue;
        const norm = kw.trim().toLowerCase();
        if (!norm || seen.has(norm)) continue;
        seen.add(norm);
        result.push(norm);
        if (result.length >= maxKeywords) break;
    }
    return result;
};

const callGemini = async (title, markdown) => {
    if (!genAI) {
        console.warn("GEMINI_API_KEY not set; using heuristic fallback");
        return null;
    }
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `Evaluate the markdown article and return JSON with price_usdc_cents (int, 100-500) and keywords (up to 10 short lowercase strings).\n\nTitle: ${title}\n\nMarkdown (truncated):\n${markdown.slice(0, 8000)}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        console.info(`Gemini response received (${text.length} chars)`);
        
        // Clean the text to extract JSON
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : text;

        const data = JSON.parse(jsonString);
        
        const price = clampPrice(parseInt(data.price_usdc_cents || 0, 10));
        const keywords = sanitizeKeywords(data.keywords || []);

        if (price && keywords.length > 0) {
            return { price_usdc_cents: price, keywords };
        }
        return null;
    } catch (e) {
        console.error("Gemini call failed in Evaluator Agent", e);
        return null;
    }
};


// --- Routes ---

app.post('/evaluate', async (req, res) => {
  const { title, markdown } = req.body;

  if (!title || !markdown) {
    return res.status(400).json({ error: 'title and markdown are required' });
  }

  if (Buffer.byteLength(markdown, 'utf8') > MAX_MARKDOWN_BYTES) {
    return res.status(400).json({ error: 'markdown too large (max 256KB)' });
  }

  const baseline = {
    price_usdc_cents: estimateHeuristicPrice(markdown),
    keywords: extractHeuristicKeywords(markdown),
  };

  const geminiResult = await callGemini(title, markdown);

  const result = geminiResult || baseline;
  result.gemini = !!geminiResult; // true if Gemini was used, false if heuristics

  return res.json(result);
});

app.post('/match_topic', async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
        return res.status(400).json({ error: 'topic is required' });
    }

    const topicKeywords = new Set(extractHeuristicKeywords(topic));

    try {
        const response = await axios.get(`${RESOURCE_SERVER_URL}/api/content-hashes-keywords`);
        const items = response.data; // Expects an array of [{ hash, keywords }]

        if (!Array.isArray(items)) {
            throw new Error('Invalid data structure from resource server');
        }

        let bestScore = -1;
        let bestHash = null;

        for (const item of items) {
            const itemKeywords = new Set(item.keywords.map(k => k.toLowerCase()));
            const intersection = new Set([...topicKeywords].filter(x => itemKeywords.has(x)));
            const score = intersection.size;
            
            if (score > bestScore) {
                bestScore = score;
                bestHash = item.hash;
            }
        }

        if (bestHash === null) {
            return res.status(404).json({ error: 'No matching content found' });
        }

        return res.json({ best_match_hash: bestHash });

    } catch (e) {
        console.error('Failed to fetch or process content hashes:', e.message);
        return res.status(500).json({ error: 'Failed to fetch content data from resource server' });
    }
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', gemini: !!GEMINI_API_KEY });
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`Evaluator Agent listening on port ${PORT}`);
  console.log(`Gemini enabled: ${!!GEMINI_API_KEY}`);
});
