### Verdian Evaluator Agent

---

### Overview
- Minimal Node.js/Express service that evaluates markdown articles and returns a price and keywords.
- Uses Gemini first (if `GEMINI_API_KEY` is set), with a heuristic fallback.
- Default Gemini model: `gemini-2.5-pro` (override via `GEMINI_MODEL`).

---

### Quickstart (Bun)

This service is part of the Bun monorepo. To run it, first install dependencies from the project root.

1.  **Install dependencies from root**:
    ```bash
    cd /path/to/veridian
    bun install
    ```

2.  **Run the agent directly**:
    ```bash
    # Set GEMINI_API_KEY to enable Gemini features
    export GEMINI_API_KEY=YOUR_KEY

    # Run the service (defaults to port 8000)
    bun run dev:evaluator
    ```

Health check:
```bash
curl -s http://localhost:8000/healthz | jq
```

---

### API
- POST `/evaluate`
  - Request JSON
```json
{
  "title": "My Article",
  "markdown": "# content..."
}
```
  - Response JSON
```json
{
  "price_usdc_cents": 300,
  "keywords": ["zk", "rollups", "polygon"]
}
```

- GET `/healthz`
```json
{ "status": "ok", "gemini": true }
```

---

### Behavior
- Gemini-first, expecting a JSON response.
- Fallback (if Gemini not configured/unavailable):
  - keywords: frequency-based (stopwords removed), up to 10, normalized to lowercase
  - price: based on word count and uniqueness ratio, clamped 100–500 cents

---

### Logging
- Warns when `GEMINI_API_KEY` is missing (uses heuristic fallback).
- Logs a single line when a Gemini response is received (length only).
- Logs exceptions around Gemini calls with stack traces.
- Does not log full prompt or full response.

---

### Configuration
- Environment variables
  - `GEMINI_API_KEY` (optional; enable Gemini path)
  - `GEMINI_MODEL` (default: `gemini-2.5-pro`)
  - `PORT` (optional; default 8000)

---

### Integration
- The Evaluator Agent is a standalone service.
- In the current architecture, it is called directly by the **Client Agent** (`demo/` script) for content discovery before the purchase flow is initiated.
- It can also be called by a content ingestion service (like the conceptual **Resource Server**) to price articles upon upload.

---

### Notes
- Max markdown size is 256 KB.
- Price is clamped to $1–$5 (100–500 cents).
- Keywords are normalized to lowercase and limited to up to 10.

---

### Example: cURL
```bash
jq -n --arg title 'My Article' --rawfile markdown /path/to/article.md '{title:$title, markdown:$markdown}' \
| curl -sS http://localhost:8000/evaluate -H 'Content-Type: application/json' --data-binary @- \
| jq
```

### Example: JavaScript (Node)
```javascript
import axios from 'axios';
import fs from 'fs/promises';

async function evaluateArticle(filePath) {
  const markdown = await fs.readFile(filePath, 'utf-8');
  const response = await axios.post('http://localhost:8000/evaluate', {
    title: 'My Article',
    markdown: markdown,
  });
  console.log(JSON.stringify(response.data, null, 2));
}

evaluateArticle('/path/to/article.md');
``` 