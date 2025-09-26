### Verdian — Technical Specification (16-hour Hackathon)

---

### Overview
- Verdian is a decentralized, paywalled blog platform where creators upload markdown articles that are tokenized on Polygon Amoy. An AI Evaluator assigns a fair price and keywords. A Consumer Agent discovers and purchases content via the x402 agentic payment protocol. After payment, the buyer gains access to the full content.
- This spec defines the MVP scope, architecture, interfaces, contract design, data model, non-functionals, and execution steps.

---

### MVP Goals (Hackathon Scope)
- Upload .md article, get price and keywords via AI Evaluator.
- Mint a non-transferable content NFT (SBT-like) with on-chain keccak256(content) proof.
- List content with price and keywords; public discovery API.
- Enforce payment using HTTP 402 + x402; unlock content on valid x402 token.
- Basic frontend for creator upload + marketplace browse.
- Simple Consumer Agent script to auto-discover and purchase.

Out of scope
- Complex royalties/secondary markets; moderation; advanced search; production security hardening.

---

### High-Level Architecture
- Frontend (React/Next or Vite + React): wallet connect, upload, browse, detail/payflow UI.
- Backend (FastAPI/Python): content ingestion, AI evaluation, tokenization (web3), listing, x402 enforcement, verification.
- Smart Contract (Solidity, Polygon Amoy): non-transferable ERC-721-like content token storing keccak256(content) in metadata.
- x402 Facilitator: external service that verifies payments and issues x402 tokens (receipt).
- Storage: SQLite for speed; local FS for article markdown; optional IPFS pin later.

Data flow
1) Creator uploads .md → Backend computes keccak256, runs AI Evaluator → returns price + keywords.
2) Creator confirms mint → Backend mints SBT with content hash.
3) Content listed in DB; discoverable via /content.
4) Consumer requests content → 402 with WWW-Authenticate (x402 invoice).
5) Consumer pays via Facilitator → retries with Authorization: X402 <token> → Backend verifies → returns full content.

---

### Smart Contract (Solidity, Polygon Amoy)
- Contract: `VerdianContentSBT`
- Standard: ERC-721 with transfer disabled (SBT behavior).
- Network: Polygon Amoy testnet.

Key storage
- `mapping(bytes32 => uint256) public contentHashToTokenId;`
- `mapping(uint256 => bytes32) public tokenIdToContentHash;`

Key functions
- `function mint(address to, bytes32 contentHash, string memory tokenURI) external returns (uint256 tokenId);`
  - Require `contentHashToTokenId[contentHash] == 0` to prevent duplicates.
  - Emits `event ContentMinted(address indexed to, uint256 indexed tokenId, bytes32 contentHash);`
- Disable transfers: override `_update` or transfer hooks to revert on non-mint/non-burn.
- Optional: `tokenURI` may contain minimal metadata or IPFS pointer (MVP may leave empty).

Non-goals
- Pausable/role systems beyond minimal owner/operator.

---

### Backend Service (FastAPI)
- Language: Python 3.11+
- Framework: FastAPI + Uvicorn
- DB: SQLite (SQLModel or SQLAlchemy)
- Web3: `web3.py`
- Crypto: `eth_utils` for keccak256
- Evaluator Agent: external FastAPI service (HTTP) returning price and keywords; prefers Gemini (`GEMINI_API_KEY`) with fallback to local heuristic if unavailable
- Creator Agent: external FastAPI service (HTTP) that assists creators with title, summary, keywords, and price suggestions via Gemini

Responsibilities
- Content ingestion, validation, hashing
- AI price & keyword generation
- Mint via Web3 to `VerdianContentSBT`
- Public discovery API
- 402/x402 paywall and verification
- Secure content delivery on valid x402 token

Environment variables
- `WEB3_PROVIDER_URL` (e.g., Alchemy/Infura Amoy)
- `CONTRACT_ADDRESS`
- `CONTRACT_OWNER_PRIVATE_KEY`
- `X402_FACILITATOR_URL` (verify endpoint)
- `EVALUATOR_AGENT_URL` (base URL for Evaluator Agent)
- `BACKEND_BASE_URL`
- `STORAGE_DIR` (e.g., ./storage)
- `GEMINI_API_KEY` (preferred; free tier)
- `OPENAI_API_KEY` (optional)

---

### Frontend (MVP)
- Stack: Vite + React + Wagmi/viem for wallet connect (or simple EOA display if only backend mints)
- Pages
  - Upload: connect wallet, upload .md, preview AI-evaluated price/keywords, confirm mint
  - Creator Assist: optional step that calls Creator Agent for title/summary/keywords/price suggestions
  - Marketplace: list items (title, price, keywords)
  - Detail: view limited preview; trigger purchase; show post-purchase content
- Calls backend APIs; no direct contract calls needed (backend signs mint)

---

### x402 Integration
- When content access is requested without valid payment, backend returns HTTP 402 with `WWW-Authenticate` describing invoice.
- After payment, client retries with `Authorization: X402 <token>`.
- Backend verifies token with facilitator before serving content.

Example 402
```http
HTTP/1.1 402 Payment Required
WWW-Authenticate: X-402 realm="Verdian", chain="Polygon-Amoy", recipient="0xRecipient", amount="2.00", currency="USDC", memo="content:123", invoice_id="abc123"
Content-Type: application/json

{"error":"payment_required","content_id":123}
```

Example authorized request
```http
GET /content/123
Authorization: X402 eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9....
```

Verification (backend → facilitator)
- `POST {X402_FACILITATOR_URL}/verify` with JSON `{ token: string, amount, currency, recipient, invoice_id }`
- Expect `{ valid: true, txHash: string }` on success

---

### Data Model (SQLite)
- `articles`
  - `id` (int, pk)
  - `title` (text)
  - `filename` (text) — path under STORAGE_DIR
  - `content_hash` (text, hex keccak256)
  - `price_usdc_cents` (int)
  - `keywords` (text, csv or json)
  - `nft_token_id` (int, nullable until minted)
  - `creator_address` (text)
  - `created_at` (datetime)
- `purchases`
  - `id` (int, pk)
  - `article_id` (int, fk)
  - `buyer_address` (text)
  - `invoice_id` (text, unique)
  - `amount_usdc_cents` (int)
  - `status` (text: pending, paid)
  - `tx_hash` (text, nullable)
  - `created_at` (datetime)

Storage
- Markdown files saved under `STORAGE_DIR/{article_id}.md`

---

### API Specification (FastAPI)
- POST `/upload`
  - Form/multipart: `file` (.md), `title` (string), `creator_address` (0x...)
  - Flow: validate → read bytes → keccak256 → evaluate price/keywords → create DB record (nft_token_id null) → return evaluated data
  - Response 200
```json
{
  "id": 123,
  "title": "Intro to zk",
  "content_hash": "0xabc...",
  "price_usdc_cents": 200,
  "keywords": ["zk", "rollups"],
  "nft_token_id": null
}
```

- POST `/mint/{id}`
  - Body: `{ "creator_address": "0x..." }`
  - Flow: ensure article exists and not minted → call contract.mint(to=creator_address, contentHash, tokenURI="") → store `nft_token_id`
  - Response 200 `{ id, nft_token_id, tx_hash }`

- GET `/content`
  - Query: `keywords` (comma-separated, optional), `limit`, `offset`
  - Response 200: list of articles (no full content)

- GET `/content/{id}`
  - Without Authorization: return HTTP 402 with invoice in `WWW-Authenticate` and JSON body; create `purchases` row with `invoice_id`
  - With `Authorization: X402 <token>`: verify via facilitator; if valid, return full markdown content
  - Response 200
```json
{ "id": 123, "title": "...", "markdown": "# full content..." }
```

- POST `/x402/verify` (internal proxy, optional)
  - Body: `{ token, invoice_id }`
  - Backend contacts facilitator; returns `{ valid, txHash }`

Error model
- 400 bad request on validation errors
- 404 not found for missing resources
- 402 payment required for gated content

---

### Evaluator Agent (Service)
- Purpose: Assign price ($1–$5 USD) and 2–3 keywords for uploaded markdown.
- Deployment: Separate FastAPI microservice (can run in-process for hackathon).
- Interface:
  - POST `/evaluate`
    - Request JSON: `{ "title": string, "markdown": string }`
    - Response JSON: `{ "price_usdc_cents": number, "keywords": string[] }`
- Behavior:
  - Primary model: Gemini (via `GEMINI_API_KEY`). Deterministic prompt to return JSON.
  - Fallback heuristic: price by word count and unique word ratio (clamp $1–$5), keywords by frequency after stopword removal (top 2–3).
- Error handling:
  - 400 on invalid input; 500 on internal errors.
- Integration:
  - Backend calls `EVALUATOR_AGENT_URL` `/evaluate`; if unavailable, fallback to local heuristic.

---

### Creator Agent (Service)
- Purpose: Help creators improve metadata and pricing.
- Deployment: FastAPI microservice (can be same process as Evaluator).
- Interface:
  - POST `/assist`
    - Request JSON: `{ "title": string, "markdown": string }`
    - Response JSON: `{ "title": string, "summary": string, "keywords": string[], "suggested_price_usdc_cents": number }`
- Behavior:
  - Uses Gemini (via `GEMINI_API_KEY`) with a concise system prompt to extract summary, keywords, and price suggestion.
  - Constrain output with JSON schema; reject if missing fields.

### Consumer Agent (MVP)
- Python script/service:
  - Query `/content?keywords=...`
  - Choose article within budget
  - Request `/content/{id}` → 402
  - Send invoice to facilitator → receive token
  - Retry `/content/{id}` with `Authorization: X402 <token>` → save markdown

---

### Security & Validation
- Compute and persist `keccak256` of exact uploaded bytes; re-check before mint to ensure integrity.
- Enforce non-transferability at contract level (SBT semantics).
- Verify x402 token server-side every time; never trust client claims.
- Validate filenames, size limits (e.g., 256 KB) and content type.
- Do not store private keys in repo; load from env; use minimal signer.

---

### Local Dev & Run
- Prereqs: Python 3.11, Node 18+, PNPM/Yarn, Foundry or Hardhat, Polygon Amoy RPC.

Backend
```bash
python -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn[standard] sqlmodel web3 eth-utils python-multipart pydantic google-generativeai
export WEB3_PROVIDER_URL=...
export CONTRACT_ADDRESS=...
export CONTRACT_OWNER_PRIVATE_KEY=...
export X402_FACILITATOR_URL=...
export EVALUATOR_AGENT_URL=http://localhost:8081
export GEMINI_API_KEY=...
export STORAGE_DIR=./storage
uvicorn app.main:app --reload
```

Contract (example Hardhat)
```bash
npm create hardhat@latest --yes
# add VerdianContentSBT.sol, deploy to Amoy
```

Frontend
```bash
npm create vite@latest verdian-web -- --template react
cd verdian-web && npm i && npm run dev
```

---

### Testing Plan (Happy Path First)
- Unit: price/keyword heuristics; keccak computation; 402 response builder.
- Integration: `/upload` → `/mint/{id}` → `/content` list → `/content/{id}` 402 flow → verify + unlock.
- Contract: duplicate hash prevented; transfers revert; mint emits event.
- Manual: end-to-end with Consumer Agent script.

---

### Build Steps
- Initialize repos (backend, contract, frontend); env wiring; SQLite schema; storage dir.
- Stand up Evaluator Agent (Gemini-first with heuristic fallback) and Creator Agent; expose `/evaluate` and `/assist`.
- Implement upload + keccak; call Evaluator Agent; show evaluated price/keywords; optional Creator Assist step.
- Deploy contract to Amoy; implement mint endpoint and integrate Web3.
- Implement discovery `/content` and gated `/content/{id}` (402 + x402 verify).
- Build frontend: upload, creator assist, list, detail, purchase; integrate paywall flow.
- Integrate x402 facilitator and verification proxy.
- Implement Consumer Agent script (discover → 402 → pay → retry).
- Add basic tests and prepare demo runbook.

Deliverables
- Contract address + ABI
- Running FastAPI server
- Frontend demo
- Consumer Agent script
- Demo script and this spec

---

### Demo Script (Show in 3–4 minutes)
1) Upload markdown, show evaluated price/keywords
2) Mint SBT; show token ID and tx link
3) Browse marketplace; open article detail
4) Trigger purchase (402) → pay via facilitator → retry with token → content unlocked
5) Consumer Agent auto-buys and saves content

---

### Risks & Mitigations
- RPC reliability: use a stable Amoy provider; implement simple retry.
- x402 facilitator availability: cache invoice details and allow manual token input.
- Time constraint: prioritize happy path; defer IPFS and advanced UI.

---

### Appendix — Sample Types
- Article JSON
```json
{
  "id": 1,
  "title": "Layer 2 Deep Dive",
  "content_hash": "0x...",
  "price_usdc_cents": 300,
  "keywords": ["l2", "rollups"],
  "nft_token_id": 101
}
```

- Purchase JSON
```json
{
  "id": 1,
  "article_id": 1,
  "buyer_address": "0x...",
  "invoice_id": "abc123",
  "amount_usdc_cents": 300,
  "status": "paid",
  "tx_hash": "0x..."
}
```
