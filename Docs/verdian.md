### **Project Summary: "Verdian"**

**Verdian** is a decentralized, paywalled blog platform where creators can tokenize, price, and sell their written content as on-chain assets. The platform uses an AI **Evaluator Agent** to fairly price user-submitted articles and a **Consumer Agent** to autonomously discover and purchase this content for generating new insights. All transactions are handled seamlessly through the **x402 agentic payment protocol** on the Polygon network, creating a dynamic, machine-to-machine content economy.  
---

### **Core Architecture & Components**

The system is composed of four primary components: a user-facing frontend, a smart contract for content tokenization, a backend that houses the agent logic, and the x402 facilitator for payments.

* **1\. Frontend Application:**  
  * A simple web interface where creators can connect their wallets, upload their .md articles, and view their tokenized content. It will also serve as a browseable marketplace for consumers.  
* **2\. Smart Contract (Polygon Amoy):**  
  * An ERC-721 (or Soul-Bound Token) contract.  
  * The mint function will be called by the backend to create a new token for each article.  
  * The token's metadata (tokenURI) will store a keccak256 hash of the markdown file's content, ensuring on-chain proof of the original work.  
* **3\. Backend Service (Agent Hub \- FastAPI/Python):**  
  * **Creator Agent (Agent A) Logic:**  
    * **Content Ingestion:** Exposes an API endpoint for users to upload .md files.  
    * **AI Evaluation:**  
      * Analyzes the content using an LLM to assess quality, originality, and subject matter complexity.  
      * Sets a fair price (e.g., between $1-$5 in USDC).  
      * Generates up to 10 relevant keywords for discoverability.  
    * **Tokenization:** Interacts with the smart contract to mint the content NFT.  
    * **Listing:** Stores the article, its price, NFT ID, and keywords in a database, making it available for purchase.  
    * **API for Discovery:** Provides a public /content endpoint that other agents can query to find available articles based on keywords.  
  * **Consumer Agent (Agent B) Logic:**  
    * **Autonomous Discovery:** Can be triggered to find relevant content by querying Agent A's /content endpoint with specific keywords.  
    * **Decision Making:**  
      * It evaluates the list of available articles (name, keywords, price).  
      * Based on its programmed goal (e.g., "write a report on Solana"), it decides which articles it needs to purchase.  
    * **Automated Payment:** It initiates the x402 payment flow to purchase the content.  
* **4\. x402 Facilitator:**  
  * A dedicated service (can be run from the Polygon team's demo) that monitors the Polygon Amoy testnet.  
  * It verifies payments from the Consumer Agent and issues the cryptographic x402 token (the "receipt") required to unlock the content.

### **Key System Flows**

Here are the two primary user journeys in the system:

#### **Flow 1: The Content Creator's Journey**

1. **Upload:** A creator connects their wallet to the frontend and uploads a markdown file.  
2. **AI Evaluation:** The backend's **Creator Agent** receives the file. It sends the content to the **Evaluator Agent** logic, which returns a price (e.g., $2.00) and new keywords.  
3. **Tokenization:** The creator confirms the transaction to pay a small gas fee. The backend then calls the smart contract to mint a soul-bound NFT, embedding the keccak256 hash of the content in the token's metadata.  
4. **Listing for Sale:** The backend saves the content, its price, NFT ID, and keywords to its database. The article is now live on the marketplace, ready to be purchased.

#### **Flow 2: The Consumer Agent's Automated Purchase**

1. **Discovery:** The **Consumer Agent** needs to generate a report. It sends a request to the Creator Agent's public API (/content?keywords=solana,defi) to find relevant articles.  
2. **Selection & Payment Request:** The Creator Agent returns a list of matching articles and their prices. The Consumer Agent decides to purchase one and requests access.  
3. **x402 Invoice:** The Creator Agent responds with an **HTTP 402 Payment Required** error, including the WWW-Authenticate header with the precise payment details for the Polygon network.  
4. **Payment and Verification:**  
   * The Consumer Agent sends the payment details to the **x402 Facilitator**.  
   * The Facilitator executes the payment on **Polygon Amoy**.  
   * After on-chain confirmation, the Facilitator returns a signed **x402 Token** (the receipt) to the Consumer Agent.  
5. **Content Access:** The Consumer Agent makes the *same request* again, but this time includes the x402 Token in the Authorization header.  
6. **Delivery:** The Creator Agent verifies the token's validity with the Facilitator and, upon success, delivers the full markdown content of the purchased article. The Consumer Agent can now use this content for its report.