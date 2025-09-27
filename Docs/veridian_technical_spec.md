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
- Enforce payment using HTTP 402; unlock content on valid payment.
- Basic frontend for creator upload + marketplace browse.
- Simple Client Agent script to auto-discover and purchase.

Out of scope
- Complex royalties/secondary markets; moderation; advanced search; production security hardening.

---

### High-Level Architecture
The system is composed of several decoupled services that communicate over HTTP:

- **Frontend (React/Vite)**: UI for wallet connection, content upload, and marketplace browsing. Found in `client/ai-lens-labs`.
- **Veridian Service (Node/Express)**: The unified backend responsible for content storage, listing, payment processing, and enforcing the 402 paywall. Combines Resource Server and Service Agent functionality. Found in `service/`.
- **Evaluator Agent (Node/Express)**: A standalone microservice that uses AI (Gemini) to assign a fair price and relevant keywords to markdown content.
- **Client Agent (Demo Script)**: A script that orchestrates the discovery and purchase flow by calling the Evaluator Agent and then the Veridian Service.
- **Smart Contract (Solidity, Polygon Amoy)**: Non-transferable ERC-721-like content token storing `keccak256(content)` in metadata.
- **x402 Facilitator**: External service that verifies payments and can issue payment receipts/tokens.

Data flow
1) **Discovery**: Client Agent calls Evaluator Agent's `/match_topic` endpoint to find the hash of relevant content.
2) **First Request**: Client Agent requests content from the Veridian Service (`/a2a/content/:hash`).
3) **Invoice**: The Veridian Service responds with a `402 Payment Required` and invoice details with the actual content price.
4) **Payment**: Client Agent pays the invoice (e.g., via a facilitator) and receives a payment payload.
5) **Authorized Request**: Client Agent retries the request to the Veridian Service, this time including an `X-PAYMENT` header with the payment payload.
6) **Verification & Delivery**: The Veridian Service verifies the payment and, if valid, returns the full content directly.

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

### Core Services

#### Veridian Service (Unified Backend)
- **Implementation**: `service/`
- **Stack**: Node.js, Express, Prisma, SQLite
- **Responsibilities**:
  - Content ingestion, validation, and storage.
  - Providing a public discovery API (`/api/content-hashes-keywords`).
  - Enforcing the 402 paywall on protected content endpoints.
  - Verifying payment payloads received in the `X-PAYMENT` header.
  - Payment processing and settlement.
  - Database management with Prisma ORM.
- **Documentation**: See `service/README.md` for detailed setup and API specifications.

#### Evaluator Agent (AI Service)
- **Implementation**: `agents/evaluator/`
- **Stack**: Node.js, Express
- **Responsibilities**:
  - Expose an `/evaluate` endpoint to price content and extract keywords.
  - Expose a `/match_topic` endpoint to find the best content hash for a given topic.
  - Use Gemini for AI evaluation with a heuristic fallback.

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

### Payment Integration (X-PAYMENT Header)
- When content access is requested, the **Veridian Service** returns HTTP 402.
- After payment, the client retries with an `X-PAYMENT` header containing a base64-encoded payment payload.
- The Veridian Service is responsible for decoding and verifying this payload.

Example 402 (from Veridian Service)
```http
HTTP/1.1 402 Payment Required
WWW-Authenticate: X-402 realm="Verdian", chain="Polygon-Amoy", recipient="0xRecipient", amount="2.00", currency="USDC", memo="content:123", invoice_id="abc123"
Content-Type: application/json

{"error":"payment_required","content_id":123}
```

Example authorized request (to Veridian Service)
```http
GET /a2a/content/<hash>
X-PAYMENT: eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9....
```

---

### Data Model (SQLite)
This data model resides within the **Veridian Service**.
- `articles`
  - `id` (int, pk)
  - `title` (text)
  - `filename` (text) — path under STORAGE_DIR
  - `content_hash` (text, hex keccak256)
  - `price_usdc_cents` (int)
  - `keywords` (text, JSON array of strings)
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

### API Specification

The primary APIs are exposed by the **Veridian Service** at endpoints like `/api/content/:hash` and `/a2a/content/:hash`.

See `service/README.md` for a complete API specification.

---

### Evaluator Agent (Service)
- Purpose: Assign price ($0.10–$0.50 USD) and 2–3 keywords for uploaded markdown.
- Deployment: Separate Node.js/Express microservice.
- Interface:
  - POST `/evaluate`
    - Request JSON: `{ "title": string, "markdown": string }`
    - Response JSON: `{ "price_usdc_cents": number, "keywords": string[], "gemini": boolean }`
- Behavior:
  - Primary model: Gemini (via `GEMINI_API_KEY`, default `gemini-2.5-pro`). Deterministic prompt to return JSON.
  - Response includes `gemini: boolean` field indicating whether AI analysis was used.
  - Fallback heuristic: price by word count and unique word ratio (clamp $1–$5), keywords by frequency after stopword removal (top up to 10).
- Error handling:
  - 400 on invalid input; 500 on internal errors.
- **Integration**:
  - Called directly by the Client Agent for content discovery (`/match_topic`).
  - Can also be called by the Veridian Service during content ingestion (`/evaluate`).

---

### Creator Agent (Service) - Conceptual
> **Note**: This agent is a planned feature and is not implemented in the current codebase.
- Purpose: Help creators improve metadata and pricing.
- Deployment: FastAPI microservice (can be same process as Evaluator).
- Interface:
  - POST `/assist`
    - Request JSON: `{ "title": string, "markdown": string }`
    - Response JSON: `{ "title": string, "summary": string, "keywords": string[], "suggested_price_usdc_cents": number }`
- Behavior:
  - Uses Gemini (via `GEMINI_API_KEY`) with a concise system prompt to extract summary, keywords, and price suggestion.
  - Constrain output with JSON schema; reject if missing fields.

### Client Agent (MVP)
- **Implementation**: `demo/` script
- **Flow**:
  - Calls `MATCH_TOPIC_URL` (Evaluator) to get a content hash from the `/match_topic` endpoint.
  - The Evaluator in turn calls the Veridian Service's `/api/content-hashes-keywords` endpoint.
  - The Client Agent then calls the `SERVICE_AGENT_URL` to fetch the content.
  - Handles the 402 response by creating and sending a demo payment payload in the `X-PAYMENT` header on the retry.

---

### Security & Validation
- Compute and persist `keccak256` of exact uploaded bytes; re-check before mint to ensure integrity.
- Enforce non-transferability at contract level (SBT semantics).
- Verify payment payloads on the Veridian Service; never trust client claims.
- Validate filenames, size limits (e.g., 256 KB) and content type.
- Do not store private keys in repo; load from env; use minimal signer.

---

### Local Dev & Run
See the individual `README.md` or documentation in `Docs/` for each component. A typical setup involves running:
1.  The **Veridian Service** on port 5402.
2.  The **Evaluator Agent** on port 8000.
3.  The **Client Agent** script to orchestrate the flow.

---

### Testing Plan (Happy Path First)
- Unit: price/keyword heuristics; keccak computation; 402 response builder.
- Integration: `/upload` → `/mint/{id}` → `/content` list → `/content/{id}` 402 flow → verify + unlock.
- Contract: duplicate hash prevented; transfers revert; mint emits event.
- Manual: end-to-end with Consumer Agent script.

---

### Build Steps
- The primary components (**Veridian Service**, **Evaluator Agent**, **Client Agent**) are already implemented.
- Setup and run each service according to its documentation.
- The **Creator Agent** is a conceptual feature to be implemented.
- A **Frontend** exists but may need wiring to the backend services.

Deliverables
- Running services (Evaluator Agent, Veridian Service)
- Client Agent script
- Documentation for all components

---

### Demo Script (Show in 3–4 minutes)
1) Client agent is run with a "topic".
2) Client agent calls Evaluator to find the best matching content hash.
3) Client agent calls Veridian Service to fetch content, gets a 402.
4) Client agent creates a demo payment and retries with an `X-PAYMENT` header.
5) Veridian Service verifies the payment and returns the content.

---

### Risks & Mitigations
- RPC reliability: use a stable Amoy provider; implement simple retry.
- Facilitator availability: cache invoice details and allow manual token input.
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
