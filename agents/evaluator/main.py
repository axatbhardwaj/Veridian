# app.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import hashlib
import os
import httpx

import google.generativeai as genai

# ----------------------------
# Configuration
# ----------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAzkcJl4VhIF0Xv9JYzFsoijY2jf1bjs-8")
GEMINI_MODEL = "gemini-2.5-pro"

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(GEMINI_MODEL)

# Initialize FastAPI
app = FastAPI(title="Gemini Keyword API")

# ----------------------------
# Pydantic models
# ----------------------------
class ContentRequest(BaseModel):
    title: str
    content: str

class ContentResponse(BaseModel):
    keywords: List[str]
    price_per_call: float

class TopicRequest(BaseModel):
    topic: str

class TopicResponse(BaseModel):
    best_match_hash: str

# ----------------------------
# Helper functions
# ----------------------------
def generate_keywords(text: str, n: int = 7) -> List[str]:
    prompt = f"Extract {n} relevant keywords from the following text:\n{text}"
    response = model.generate_content(prompt)
    keywords = response.text.strip().split(",")
    return [k.strip() for k in keywords if k.strip()][:n]

def calculate_price(keywords: List[str], content: str) -> float:
    score = len(keywords) + len(content.split()) / 100
    price = min(max(score / 20, 0.01), 0.50)
    return round(price, 2)

def keyword_match_score(keywords: List[str], topic_keywords: List[str]) -> float:
    return len(set(k.lower() for k in keywords) & set(k.lower() for k in topic_keywords))

# ----------------------------
# Endpoints
# ----------------------------
@app.post("/generate_keywords", response_model=ContentResponse)
async def generate_keywords_endpoint(req: ContentRequest):
    keywords = generate_keywords(f"{req.title}\n{req.content}")
    price = calculate_price(keywords, req.content)
    return ContentResponse(keywords=keywords, price_per_call=price)

@app.post("/match_topic", response_model=TopicResponse)
async def match_topic_endpoint(req: TopicRequest):
    topic_keywords = generate_keywords(req.topic)

    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:3001/api/content-hashes-keywords")
        response.raise_for_status()
        items = response.json()  # expects [{ "hash": "...", "keywords": [...] }, ...]

    best_score = -1
    best_hash = None
    for item in items:
        score = keyword_match_score(item["keywords"], topic_keywords)
        if score > best_score:
            best_score = score
            best_hash = item["hash"]

    return TopicResponse(best_match_hash=best_hash)

# ----------------------------
# Run: uvicorn app:app --reload
# ----------------------------
