### Verdian Evaluator Agent

---

### Overview
- Minimal FastAPI service that evaluates markdown articles and returns a price and keywords.
- Uses Gemini first (if `GEMINI_API_KEY` is set), with a heuristic fallback.
- Default Gemini model: `gemini-2.5-pro` (override via `GEMINI_MODEL`).

---

### Quickstart
```bash
cd agents/evaluator
python -m venv .venv && source .venv/bin/activate
python -m pip install -r requirements.txt
export GEMINI_API_KEY=YOUR_KEY   # optional; enables Gemini
python -m uvicorn main:app --host 0.0.0.0 --port 8081
```

Health check:
```bash
curl -s http://localhost:8081/healthz | jq
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
- Gemini-first with response schema; returns strict JSON.
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
  - `PORT` (optional; default 8081)

---

### Notes
- Max markdown size is 256 KB.
- Price is clamped to $1–$5 (100–500 cents).
- Keywords are normalized to lowercase and limited to up to 10.

---

### Example: cURL (fish-safe)
```bash
jq -n --arg title 'My Article' --rawfile markdown /absolute/path/to/article.md '{title:$title, markdown:$markdown}' \
| curl -sS http://localhost:8081/evaluate -H 'Content-Type: application/json' --data-binary @- \
| jq
```

### Example: Python
```python
import requests, json, pathlib
md = pathlib.Path('/absolute/path/to/article.md').read_text(encoding='utf-8')
r = requests.post('http://localhost:8081/evaluate', json={'title':'My Article','markdown':md})
print(json.dumps(r.json(), indent=2))
``` 