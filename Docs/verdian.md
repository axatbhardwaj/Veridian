### **Project Summary: "Verdian"**

**Verdian** is a decentralized, paywalled blog platform where creators can tokenize, price, and sell their written content as on-chain assets. The platform uses a standalone AI **Evaluator Agent** to fairly price articles and a **Client Agent** to autonomously discover and purchase content. Transactions are handled via a payment protocol on the Polygon network, creating a dynamic, machine-to-machine content economy.

---

### **Core Architecture & Components**

The system is composed of several microservices, a frontend, and a smart contract, all working in concert.

*   **1. Frontend Application:**
    *   A web interface for creators to connect wallets, upload articles, and for consumers to browse the marketplace. Located in `client/ai-lens-labs`.
*   **2. Smart Contract (Polygon Amoy):**
    *   An ERC-721 (Soul-Bound Token) contract that creates an on-chain, non-transferable representation of each piece of content.
    *   **Docs**: See `Docs/VerdianContentSBT.md` for a detailed breakdown of the contract.
*   **3. Veridian Service (Node.js/Express Backend):**
    *   The unified backend responsible for content ingestion, storage, listing, and payment processing.
    *   Manages the database of articles, enforces the payment wall by issuing `HTTP 402` responses, and verifies payments.
    *   **Implementation**: `service/`
    *   **Docs**: See technical implementation details below
*   **4. Evaluator Agent (Node.js/Express):**
    *   A dedicated AI microservice that handles content analysis, price suggestions, and discovery.
    *   **Implementation**: `agents/evaluator/`
    *   **Docs**: `Docs/evaluator-agent.md`
*   **5. Client Agent (Demo Script):**
    *   An autonomous script that demonstrates the consumer-side workflow.
    *   It orchestrates the process of discovering content (via the Evaluator Agent) and then purchasing it (via the Veridian Service).
    *   **Implementation**: `demo/`
*   **6. x402 Facilitator:**
    *   An external service that can monitor the Polygon network, verify payments, and issue payment receipts or tokens.

---

### **Key System Flows**

#### **Flow 1: The Content Creator's Journey**

1.  **Upload:** A creator uses the frontend to upload a markdown file.
2.  **AI Evaluation:** The frontend calls the **Evaluator Agent** to get a suggested price and keywords.
3.  **Submission:** The creator submits the file, title, price, and keywords to the **Veridian Service's** `/api/upload` endpoint.
4.  **Listing for Sale:** The Veridian Service saves the content and its metadata, making it available for purchase.

#### **Flow 2: The Client Agent's Automated Purchase**

1.  **Discovery:** The **Client Agent**, given a topic, calls the **Evaluator Agent's** `/match_topic` endpoint to find the hash of the most relevant article.
2.  **Selection & Payment Request:** The Client Agent makes a request for the content via the **Veridian Service**.
3.  **Invoice:** The **Veridian Service** responds with an **HTTP 402 Payment Required** error, including invoice details in the response.
4.  **Payment and Verification:**
    *   The Client Agent arranges payment (e.g., via the **Facilitator** or by creating a signed payload).
    *   The Facilitator, after on-chain confirmation, can return a receipt or signed token.
5.  **Content Access:** The Client Agent retries the *same request* to the **Veridian Service**, but this time includes the payment receipt in an `X-PAYMENT` header.
6.  **Delivery:** The **Veridian Service** verifies the payment payload and, upon success, delivers the full markdown content.