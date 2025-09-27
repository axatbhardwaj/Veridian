### Verdian Resource Server

---

### Overview
- The Resource Server is the primary backend for the Verdian platform, responsible for content management, persistence, and enforcing the payment paywall.
- It is a Node.js application built with Express, using Prisma as an ORM for database interaction.
- This server is the ultimate destination for requests proxied by the **Service Agent**.

---

### Tech Stack
- **Framework**: Express.js
- **Database**: SQLite (via Prisma)
- **File Uploads**: Multer
- **Crypto**: `js-sha3` for `keccak256` hashing

---

### Setup & Run

1.  **Navigate to the server directory**:
    ```bash
    cd client/ai-lens-labs/server
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup the database**:
    This command will create the SQLite database file and the necessary tables based on the schema in `prisma/schema.prisma`.
    ```bash
    npx prisma db push
    ```

4.  **Set environment variables**:
    Create a `.env` file in the `server` directory or export these variables:
    ```
    # The port for the server to run on
    PORT=3001

    # The payment address for invoices
    ADDRESS=0xA7635CdB2B835737FdcE78Ea22F06Fb78101110f

    # The URL for the x402 Facilitator service
    FACILITATOR_URL=http://localhost:5401

    # The smart contract address for the asset being traded (e.g., USDC on Amoy)
    AMOY_USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582
    ```

5.  **Run the server**:
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:3001`.

---

### API Endpoints

#### `GET /health`
- **Description**: A simple health check endpoint.
- **Response**:
    ```json
    { "status": "OK", "message": "Server is running" }
    ```

#### `POST /api/upload`
- **Description**: Uploads a new markdown file, calculates its hash, and saves its metadata to the database. It expects a multipart/form-data request.
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
- **Success Response (`200 OK`)**:
    ```json
    [
      { "hash": "...", "keywords": ["ai"] },
      { "hash": "...", "keywords": ["blockchain"] }
    ]
    ```

#### `GET /api/content/:hash`
- **Description**: The main paywalled endpoint for retrieving full content.
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