### **Project Summary: "Verdian"**

**Verdian** is a decentralized, paywalled blog platform where creators can tokenize, price, and sell their written content as on-chain assets. The platform uses a standalone AI **Evaluator Agent** to fairly price articles and a **Client Agent** to autonomously discover and purchase content. Transactions are handled via a payment protocol on the Polygon network, creating a dynamic, machine-to-machine content economy.

---

### **Core Architecture & Components**

The system is composed of several microservices, a frontend, and a smart contract, all working in concert.

*   **1. Frontend Application:**
    *   A web interface for creators to connect wallets, upload articles, and for consumers to browse the marketplace. Located in `client/ai-lens-labs`.
*   **2. Smart Contract (Polygon Amoy):**
    *   An ERC-721 (or Soul-Bound Token) contract that creates an on-chain, non-transferable representation of each piece of content, linking to a `keccak256` hash of the original work.
*   **3. Resource Server (Node.js/Express Backend):**
    *   The primary backend responsible for content ingestion, storage, and listing.
    *   It manages the database of articles, enforces the payment wall by issuing `HTTP 402` responses, and verifies payments.
    *   **Implementation**: `client/ai-lens-labs/server/`
    *   **Docs**: `Docs/resource-server.md`
*   **4. Evaluator Agent (FastAPI/Python):**
    *   A dedicated AI microservice that handles content analysis, price suggestions, and discovery.
    *   **Implementation**: `agents/evaluator/`
    *   **Docs**: `Docs/evaluator-agent.md`
*   **5. Service Agent (Node.js/Express):**
    *   A lightweight, stateless A2A (Application-to-Application) proxy.
    *   Its sole responsibility is to forward payment headers (like `X-PAYMENT`) from the Client Agent to the Resource Server.
    *   **Implementation**: `service/`
*   **6. Client Agent (Demo Script):**
    *   An autonomous script that demonstrates the consumer-side workflow.
    *   It orchestrates the process of discovering content (via the Evaluator Agent) and then purchasing it (via the Service Agent).
    *   **Implementation**: `demo/`
*   **7. x402 Facilitator:**
    *   An external service that can monitor the Polygon network, verify payments, and issue payment receipts or tokens.

---

### **Key System Flows**

#### **Flow 1: The Content Creator's Journey**
> **Note**: The frontend for this flow is implemented, but the API calls to the Resource Server's `/api/upload` endpoint may need to be wired.

1.  **Upload:** A creator uses the frontend to upload a markdown file.
2.  **AI Evaluation:** The frontend can call the **Evaluator Agent** to get a suggested price and keywords.
3.  **Submission:** The creator submits the file, title, price, and keywords to the **Resource Server's** `/api/upload` endpoint.
4.  **Listing for Sale:** The Resource Server saves the content and its metadata, making it available for purchase.

#### **Flow 2: The Client Agent's Automated Purchase**

1.  **Discovery:** The **Client Agent**, given a topic, calls the **Evaluator Agent's** `/match_topic` endpoint to find the hash of the most relevant article.
2.  **Selection & Payment Request:** The Client Agent makes a request for the content via the **Service Agent**, which proxies it to the **Resource Server**.
3.  **Invoice:** The **Resource Server** responds with an **HTTP 402 Payment Required** error, including invoice details in the response. The Service Agent forwards this back to the Client Agent.
4.  **Payment and Verification:**
    *   The Client Agent arranges payment (e.g., via the **Facilitator** or by creating a signed payload).
    *   The Facilitator, after on-chain confirmation, can return a receipt or signed token.
5.  **Content Access:** The Client Agent retries the *same request* to the **Service Agent**, but this time includes the payment receipt in an `X-PAYMENT` header.
6.  **Delivery:** The Service Agent forwards the request. The **Resource Server** verifies the payment payload and, upon success, delivers the full markdown content.