const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { keccak256 } = require('js-sha3');
const { buildPaymentRequirements, verifyPayment, settlePayment } =  require('./x402');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

const ADDRESS = process.env.ADDRESS || '0xA7635CdB2B835737FdcE78Ea22F06Fb78101110f';
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'http://localhost:5401';
const AMOY_USDC_ADDRESS = process.env.AMOY_USDC_ADDRESS || '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';


// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/markdown' || file.originalname.endsWith('.md') || file.originalname.endsWith('.mdx')) {
      cb(null, true);
    } else {
      cb(new Error('Only markdown files are allowed'), false);
    }
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Upload content endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? { name: req.file.originalname, size: req.file.size } : 'No file');

    const { title, keywords, userAddress } = req.body;
    const file = req.file;

    // Validate required fields
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!userAddress || !userAddress.trim()) return res.status(400).json({ error: 'User address is required' });

    // Parse user-provided keywords first
    let keywordsArray = [];
    if (keywords) {
      try {
        keywordsArray = JSON.parse(keywords);
      } catch (e) {
        keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      }
    }

    // Generate keywords from external service
    const content = file.buffer.toString('utf-8');
    let price = 1; // default price

    try {
      const response = await fetch('http://127.0.0.1:8000/generate_keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      const data = await response.json();

      if (data.keywords && Array.isArray(data.keywords)) {
        // Flatten and clean the returned keywords
        const generatedKeywords = data.keywords
          .flatMap(k => k.split('\n'))
          .map(k => k.replace(/^\d+\.\s*/, '').trim())
          .filter(k => k);

        keywordsArray.push(...generatedKeywords);
      }

      if (data.price_per_call) price = data.price_per_call;
    } catch (err) {
      console.error('Keyword generation error:', err);
    }

    // Remove duplicates and empty strings
    keywordsArray = Array.from(new Set(keywordsArray)).filter(k => k);

    if (keywordsArray.length === 0) return res.status(400).json({ error: 'At least one keyword is required' });

    const contentHash = keccak256(content);
    const existingContent = await prisma.content.findUnique({ where: { contentHash } });

    if (existingContent) {
      return res.status(409).json({
        error: 'Content with this hash already exists',
        existingContent: {
          id: existingContent.id,
          title: existingContent.title,
          userAddress: existingContent.userAddress
        }
      });
    }

    // Save to database
    const newContent = await prisma.content.create({
      data: {
        title: title.trim(),
        content,
        contentHash,
        userAddress: userAddress.trim(),
        keywords: keywordsArray,
        fileName: file.originalname,
        fileSize: file.size,
        price
      }
    });

    res.status(201).json({
      message: 'Content uploaded successfully',
      content: {
        id: newContent.id,
        title: newContent.title,
        contentHash: newContent.contentHash,
        userAddress: newContent.userAddress,
        keywords: newContent.keywords,
        fileName: newContent.fileName,
        fileSize: newContent.fileSize,
        price: newContent.price,
        createdAt: newContent.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/api/content-hashes', async (req, res) => {
  try {
    const contents = await prisma.content.findMany({
      select: {
        contentHash: true,
        keywords: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ contents });
  } catch (error) {
    console.error('Get content hashes error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.get('/api/content/:hash', async (req, res) => {
  const paymentHeader = req.headers['x-payment'] ;

  if (!paymentHeader) {
    const resourceUrl = `http://localhost:${PORT}/api/content/${req.params.hash}`;
    const accepts = [buildPaymentRequirements(resourceUrl, ADDRESS, AMOY_USDC_ADDRESS)];
    return res.status(402).json({ accepts });
  }

  try {
    const verify = await verifyPayment(paymentHeader);
    if (!verify || !verify.success) {
      return res.status(402).json({ error: 'payment_verification_failed', details: verify });
    }
  } catch (e) {
    return res.status(502).json({ error: 'facilitator_unreachable', details: String(e) });
  }

  try {
    const { hash } = req.params;
    const content = await prisma.content.findUnique({ where: { contentHash: hash } });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    try {
      const settle = await settlePayment(paymentHeader);
      const resp = settle.data || {};
      const responsePayload = { 
        success: !!resp.success, 
        transaction: resp.transaction || null, 
        network: 'polygon-amoy', 
        payer: resp.payer || null 
      };
      const b64 = Buffer.from(JSON.stringify(responsePayload)).toString('base64');
      res.setHeader('X-PAYMENT-RESPONSE', b64);
    } catch (e) {
      const errPayload = { success: false, error: String(e) };
      const b64 = Buffer.from(JSON.stringify(errPayload)).toString('base64');
      res.setHeader('X-PAYMENT-RESPONSE', b64);
    }

    res.json({ content });
  } catch (error) {
    console.error('Get content by hash error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.get('/api/content-hashes-keywords', async (req, res) => {
  try {
    const contents = await prisma.content.findMany({
      select: {
        contentHash: true,
        keywords: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const result = contents.map(c => ({
      hash: c.contentHash,
      keywords: c.keywords
    }));

    res.json(result);
  } catch (error) {
    console.error('Get content hashes and keywords error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});
