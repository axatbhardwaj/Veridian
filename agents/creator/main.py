import os
import json
import re
import logging
from typing import List, Optional, Dict
from dataclasses import dataclass

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


class AssistRequest(BaseModel):
    title: str = Field(min_length=1)
    markdown: str = Field(min_length=1)


class AssistResponse(BaseModel):
    title: str
    summary: str
    keywords: List[str]
    suggested_price_usdc_cents: int


app = FastAPI(title="Verdian Creator Agent", version="0.1.0")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

MAX_MARKDOWN_BYTES = 256 * 1024
MIN_PRICE_CENTS = 100
MAX_PRICE_CENTS = 500

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


def _tokenize_words(text: str) -> List[str]:
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


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


def _extract_heuristic_keywords(markdown: str, max_keywords: int = 10) -> List[str]:
    words = [w for w in _tokenize_words(markdown) if w not in STOPWORDS and len(w) > 2]
    if not words:
        return []
    counts: Dict[str, int] = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return [w for w, _ in ranked[:max_keywords]]


def _clamp_price(cents: int) -> int:
    if cents < MIN_PRICE_CENTS:
        return MIN_PRICE_CENTS
    if cents > MAX_PRICE_CENTS:
        return MAX_PRICE_CENTS
    return cents


def _estimate_heuristic_price(markdown: str) -> int:
    words = _tokenize_words(markdown)
    if not words:
        return MIN_PRICE_CENTS
    unique_ratio = len(set(words)) / max(1, len(words))
    base = 100 + (len(words) // 250) * 100
    if unique_ratio > 0.6:
        base += 100
    return _clamp_price(base)


def _first_sentences(text: str, max_chars: int = 400) -> str:
    text = text.strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0]


@dataclass(frozen=True)
class GeminiAssistSchema:
    title: str
    summary: str
    keywords: List[str]
    suggested_price_usdc_cents: int


def _call_gemini(title: str, markdown: str) -> Optional[AssistResponse]:
    if not GEMINI_API_KEY:
        logging.warning("GEMINI_API_KEY not set; using heuristic fallback")
        return None
    try:
        import google.generativeai as genai

        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = (
            "Assist the content creator. Return JSON with fields: title (string), summary (string), "
            "keywords (up to 10 short lowercase strings), and suggested_price_usdc_cents (int 100..500).\n\n"
            f"Original Title: {title}\n\n"
            "Markdown (truncated if very long):\n" + markdown[:8000]
        )
        resp = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                response_schema=GeminiAssistSchema,
            ),
        )
        text = getattr(resp, "text", "").strip()
        logging.info("Gemini response received (%d chars)", len(text))
        if not text:
            return None
        data = json.loads(text)
        suggested_price = _clamp_price(int(data.get("suggested_price_usdc_cents", 0)))
        keywords = _sanitize_keywords(list(data.get("keywords", [])))
        out_title = data.get("title") or title
        summary = data.get("summary") or _first_sentences(markdown)
        if suggested_price and keywords and out_title and summary:
            return AssistResponse(
                title=out_title,
                summary=summary,
                keywords=keywords,
                suggested_price_usdc_cents=suggested_price,
            )
        return None
    except json.JSONDecodeError:
        return None
    except Exception:
        logging.exception("Gemini call failed in Creator Agent")
        return None


@app.post("/assist", response_model=AssistResponse)
def assist(req: AssistRequest) -> AssistResponse:
    md_bytes = req.markdown.encode("utf-8")
    if len(md_bytes) > MAX_MARKDOWN_BYTES:
        raise HTTPException(status_code=400, detail="markdown too large (max 256KB)")

    gemini_result = _call_gemini(req.title, req.markdown)
    if gemini_result is not None:
        return gemini_result

    # Fallback
    keywords = _extract_heuristic_keywords(req.markdown)
    price = _estimate_heuristic_price(req.markdown)
    summary = _first_sentences(req.markdown)
    return AssistResponse(
        title=req.title,
        summary=summary,
        keywords=keywords,
        suggested_price_usdc_cents=price,
    )


@app.get("/healthz")
def health() -> dict:
    return {"status": "ok", "gemini": bool(GEMINI_API_KEY)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8082")))
