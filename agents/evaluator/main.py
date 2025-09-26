import os
import json
import re
from typing import List, Optional, Dict
from dataclasses import dataclass
import logging

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


# -----------------------------
# Models
# -----------------------------
class EvaluateRequest(BaseModel):
    title: str = Field(min_length=1)
    markdown: str = Field(min_length=1)


class EvaluateResponse(BaseModel):
    price_usdc_cents: int
    keywords: List[str]


# -----------------------------
# App
# -----------------------------
app = FastAPI(title="Verdian Evaluator Agent", version="0.1.0")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


# -----------------------------
# Constants & Config
# -----------------------------
MAX_MARKDOWN_BYTES = 256 * 1024  # 256 KB
MIN_PRICE_CENTS = 100  # $1.00
MAX_PRICE_CENTS = 500  # $5.00

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-pro")

STOPWORDS = {
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "if",
    "then",
    "else",
    "for",
    "to",
    "of",
    "in",
    "on",
    "at",
    "by",
    "with",
    "about",
    "as",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "it",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "they",
    "we",
    "my",
    "your",
    "their",
    "our",
    "from",
}


# -----------------------------
# Helpers (Heuristic)
# -----------------------------
def _tokenize_words(text: str) -> List[str]:
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


def _extract_heuristic_keywords(markdown: str, max_keywords: int = 10) -> List[str]:
    words = [w for w in _tokenize_words(markdown) if w not in STOPWORDS and len(w) > 2]
    if not words:
        return []
    counts: Dict[str, int] = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    keywords = [w for w, _ in ranked[:max_keywords]]
    return keywords


def _clamp_price(cents: int) -> int:
    return max(MIN_PRICE_CENTS, min(MAX_PRICE_CENTS, cents))


def _estimate_heuristic_price(markdown: str) -> int:
    words = _tokenize_words(markdown)
    if not words:
        return MIN_PRICE_CENTS
    unique_ratio = len(set(words)) / max(1, len(words))
    # Base on length; bump for uniqueness; clamp to [$1, $5]
    base = 100 + (len(words) // 250) * 100  # +$1 per 250 words
    bump = 100 if unique_ratio > 0.6 else 0
    return _clamp_price(base + bump)


# -----------------------------
# Gemini
# -----------------------------
@dataclass(frozen=True)
class GeminiEvaluateSchema:
    price_usdc_cents: int
    keywords: List[str]


def _sanitize_keywords(keywords: List[str], max_keywords: int = 10) -> List[str]:
    seen = set()
    result: List[str] = []
    for kw in keywords:
        if not isinstance(kw, str):
            continue
        norm = kw.strip().lower()
        if not norm or norm in seen:
            continue
        seen.add(norm)
        result.append(norm)
        if len(result) >= max_keywords:
            break
    return result


def _call_gemini(title: str, markdown: str) -> Optional[EvaluateResponse]:
    if not GEMINI_API_KEY:
        logging.warning("GEMINI_API_KEY not set; using heuristic fallback")
        return None
    try:
        import google.generativeai as genai

        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = (
            "Evaluate the markdown article and return JSON with price_usdc_cents (int) and keywords (up to 10 short lowercase strings).\n\n"
            f"Title: {title}\n\n"
            "Markdown (truncated if very long):\n" + markdown[:8000]
        )
        resp = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                response_schema=GeminiEvaluateSchema,
            ),
        )
        text = getattr(resp, "text", "").strip()
        logging.info("Gemini response received (%d chars)", len(text))
        if not text:
            return None
        data = json.loads(text)
        price = _clamp_price(int(data.get("price_usdc_cents", 0)))
        keywords = _sanitize_keywords(list(data.get("keywords", [])))
        if price and keywords:
            return EvaluateResponse(price_usdc_cents=price, keywords=keywords)
        return None
    except Exception:
        logging.exception("Gemini call failed in Evaluator Agent")
        return None


# -----------------------------
# Route
# -----------------------------
@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest) -> EvaluateResponse:
    md_bytes = req.markdown.encode("utf-8")
    if len(md_bytes) > MAX_MARKDOWN_BYTES:
        raise HTTPException(status_code=400, detail="markdown too large (max 256KB)")

    # Heuristic baseline
    heuristic_price = _estimate_heuristic_price(req.markdown)
    heuristic_keywords = _extract_heuristic_keywords(req.markdown)
    baseline = EvaluateResponse(
        price_usdc_cents=heuristic_price, keywords=heuristic_keywords
    )

    # Gemini refinement
    gemini_result = _call_gemini(req.title, req.markdown)
    return gemini_result or baseline


# Health
@app.get("/healthz")
def health() -> dict:
    return {"status": "ok", "gemini": bool(GEMINI_API_KEY)}


if __name__ == "__main__":
    # For local debugging: python agents/evaluator/main.py
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8081")))
