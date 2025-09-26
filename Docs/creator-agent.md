### Verdian Creator Agent

---

### Overview
- The Creator Agent helps authors improve article metadata and pricing.
- It accepts a title and markdown, then returns:
  - title (possibly refined)
  - summary (concise)
  - keywords (up to 10 short lowercase terms)
  - suggested_price_usdc_cents (100–500)
- Gemini-first with heuristic fallback if no API key or errors.

---

### API
- POST `/assist`
  - Request JSON
```json
{
  "title": "Draft title",
  "markdown": "# My article..."
}
```
  - Response JSON
```json
{
  "title": "Refined title",
  "summary": "Short summary...",
  "keywords": ["zk", "rollups", "polygon"],
  "suggested_price_usdc_cents": 300
}
```

- GET `/healthz`
```json
{ "status": "ok", "gemini": true }
```

---

### Behavior
- Uses Gemini with a response schema to return strict JSON.
- Defaults to model `gemini-2.5-pro` (override via `GEMINI_MODEL`).
- Fallback (if Gemini not configured/unavailable):
  - keywords: simple frequency-based extraction (stopwords removed), up to 10
  - price: based on word count and uniqueness ratio, clamped 100–500

---

### Logging
- Logs when `GEMINI_API_KEY` is missing: uses heuristic fallback.
- Logs a single line when a Gemini response is received (length only).
- Logs exceptions around Gemini calls with stack traces.
- Does not log the full prompt or response content.

---

### Configuration
- Environment variables
  - `GEMINI_API_KEY` (required for Gemini; omit to use fallback)
  - `GEMINI_MODEL` (default: `gemini-2.5-pro`)
  - `PORT` (optional; default 8082)

---

### Run (local)
```bash
cd agents/creator
python -m venv .venv && source .venv/bin/activate
python -m pip install -r ../requirements.txt
export GEMINI_API_KEY=YOUR_KEY   # optional
python -m uvicorn main:app --host 0.0.0.0 --port 8082
```

Health check:
```bash
curl -s http://localhost:8082/healthz | jq
```

---

### Example: cURL (fish-safe)
```bash
jq -n --arg title 'Draft title' --rawfile markdown /absolute/path/to/article.md '{title:$title, markdown:$markdown}' \
| curl -sS http://localhost:8082/assist -H 'Content-Type: application/json' --data-binary @- \
| jq
```

### Example: Python
```python
import requests, json, pathlib
md = pathlib.Path("/absolute/path/to/article.md").read_text(encoding="utf-8")
r = requests.post("http://localhost:8082/assist", json={"title": "Draft title", "markdown": md})
print(json.dumps(r.json(), indent=2))
```

---

### Integration Notes
- Frontend Upload flow
  - Optional "Creator Assist" step calls `/assist` and allows the creator to accept/edit results.
- Backend Upload
  - Use `/assist` to prefill metadata, then call the Evaluator Agent for final pricing if desired.
- Saved Data
  - Persist `keywords` as a JSON array and `price_usdc_cents` in `articles`.

---

### Error Handling
- `400` for large markdown (>256 KB) or invalid input.
- On Gemini failures, falls back to heuristic; still returns a valid response.

---

### Related
- Evaluator Agent: determines final price and keywords for listing.
- See `Docs/veridian_technical_spec.md` for the full system architecture and data model.
