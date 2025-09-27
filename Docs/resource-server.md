### Verdian Resource Server

---

### Overview
- **DEPRECATED**: The Resource Server functionality has been merged into the unified **Veridian Service**.
- The Veridian Service now handles content management, persistence, payment processing, and the payment paywall.
- See `service/README.md` for the current unified backend implementation.

---

### Tech Stack
- **Framework**: Express.js
- **Database**: SQLite (via Prisma)
- **File Uploads**: Multer
- **Crypto**: `js-sha3` for `keccak256` hashing

---

### Setup & Run

**⚠️ DEPRECATED**: Use the unified **Veridian Service** instead.

**Migration**: The Resource Server functionality has been merged into the Veridian Service located at `service/`.

**To run the current backend**:
```bash
cd service
npm install
npm run db:generate
npm run db:push
npm run dev
```

The unified service runs on `http://localhost:5402` and includes all Resource Server functionality.

---

### API Endpoints

#### `GET /healthz` (Updated Endpoint)
- **Description**: A simple health check endpoint.
- **Available at**: `http://localhost:5402/healthz`
- **Response**:
    ```json
    { "status": "ok", "service": "veridian-service" }
    ```

#### `POST /api/upload`
- **Description**: Uploads a new markdown file, calculates its hash, and saves its metadata to the database. It expects a multipart/form-data request.
- **Available at**: `http://localhost:5402/api/upload`
- **Form Fields**:
    - `file`: The `.md` markdown file.
    - `title`: `string` - The title of the article.
    - `userAddress`: `string` - The Ethereum address of the creator.
    - `keywords`: `string` - A JSON array of keywords (e.g., `["ai", "blockchain"]`).
    - `price`: `number` - The price of the content in dollars (e.g., `2.50`).
- **Success Response (`201 Created`)**:
    ```json
    {
      "message": "Content uploaded successfully",
      "content": {
        "id": 1,
        "title": "My Article",
        "contentHash": "...",
        "userAddress": "0x...",
        "keywords": ["ai"],
        "price": 2.5,
        "createdAt": "..."
      }
    }
    ```
- **Error Responses**:
    - `400 Bad Request`: If required fields are missing or the file is not markdown.
    - `409 Conflict`: If content with the same hash already exists.

#### `GET /api/content-hashes-keywords`
- **Description**: Returns a list of all content with just their hash and keywords. This is used by the **Evaluator Agent** for discovery.
- **Available at**: `http://localhost:5402/api/content-hashes-keywords`
- **Success Response (`200 OK`)**:
    ```json
    [
      { "hash": "...", "keywords": ["ai"] },
      { "hash": "...", "keywords": ["blockchain"] }
    ]
    ```

#### `GET /api/content/:hash`
- **Description**: The main paywalled endpoint for retrieving full content.
- **Available at**: `http://localhost:5402/api/content/:hash`
- **Behavior**:
    1.  **If `X-PAYMENT` header is NOT present**:
        - Returns `HTTP 402 Payment Required`.
        - The body contains the payment invoice:
          ```json
          {
            "accepts": [{ "resourceUrl": "...", "payTo": "...", "asset": "..." }]
          }
          ```
    2.  **If `X-PAYMENT` header IS present**:
        - It verifies the payment via the Facilitator.
        - On success, it settles the payment and returns the full content in the response body. It also includes an `X-PAYMENT-RESPONSE` header with the settlement details.
        - On failure, it returns `402` or `502`.
- **Success Response (`200 OK`)**:
    ```json
    {
      "content": {
        "id": 1,
        "title": "My Article",
        "content": "# My full article content...",
        "contentHash": "...",
        "userAddress": "0x...",
        "keywords": ["ai"],
        "price": 100, // Note: price is in cents in the DB
        "createdAt": "..."
      }
    }
    ``` 