# Verdian Evaluator Agent

Minimal FastAPI service that evaluates markdown articles and returns a price and keywords. Uses Gemini first (if `GEMINI_API_KEY` is set), with a heuristic fallback.

## Quickstart

```bash
cd agents/evaluator
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export GEMINI_API_KEY=YOUR_KEY   # optional; enables Gemini
uvicorn main:app --host 0.0.0.0 --port 8081
```

## API
- POST `/evaluate`
  - Request JSON: `{ "title": string, "markdown": string }`
  - Response JSON: `{ "price_usdc_cents": number, "keywords": string[] }`

- GET `/healthz`
  - Response JSON: `{ "status": "ok", "gemini": boolean }`

## Notes
- Max markdown size is 256 KB.
- Price is clamped to $1–$5 (100–500 cents).
- Keywords are normalized to lowercase and limited to 3. 