### VerdianContentSBT (Smart Contract)

---

### Overview
- Soul-bound style token (non-transferable) for Verdian content on Polygon Amoy.
- Mints one token per article and stores:
  - `title` (string)
  - `keywordsCsv` (comma-separated; up to 10 keywords)
  - `priceUsdcCents` (10–50)
  - `tokenURI` (string; should include or point to the content hash)
  - `contentHash` (bytes32; keccak256 of the original markdown bytes)
- Enforces uniqueness by `contentHashToTokenId` (one token per unique content hash).

---

### Constructor
- `constructor(string name_, string symbol_)`
  - Sets `contractOwner = msg.sender`.
  - Example: `VerdianContentSBT("Verdian Content", "VCSBT")`.

---

### Minting
- `mint(address to, string title, string keywordsCsv, string tokenUri, bytes32 contentHash, uint256 priceUsdcCents) external onlyOwner returns (uint256 tokenId)`
  - Requirements:
    - `to != address(0)`
    - `contentHashToTokenId[contentHash] == 0` (no duplicates)
  - Side effects:
    - Assigns a new `tokenId` (starts at 1)
    - Persists metadata and maps `contentHash → tokenId`
    - Emits `Transfer(address(0), to, tokenId)` and `ContentMinted(to, tokenId, contentHash, priceUsdcCents)`
  - Notes:
    - `onlyOwner`: minting is restricted to the backend signer (deployer or owner).

---

### Read Functions
- `name() → string`
- `symbol() → string`
- `totalSupply() → uint256`
- `balanceOf(address owner) → uint256`
- `ownerOf(uint256 tokenId) → address`
- `tokenURI(uint256 tokenId) → string`
- `titleOf(uint256 tokenId) → string`
- `keywordsCsvOf(uint256 tokenId) → string`
- `priceUsdcCentsOf(uint256 tokenId) → uint256`
- `contentHashOf(uint256 tokenId) → bytes32`
- `contentHashToTokenId(bytes32 contentHash) → uint256` (public mapping)

---

### SBT Semantics (Non-transferable)
All transfer/approval methods revert:
- `transferFrom`, `safeTransferFrom` (both overloads), `approve`, `setApprovalForAll`
- `getApproved` returns `address(0)`, `isApprovedForAll` returns `false`

---

### Events
- `event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)`
- `event ContentMinted(address indexed to, uint256 indexed tokenId, bytes32 indexed contentHash, uint256 priceUsdcCents)`

---

### Errors
- `TransferNotAllowed()`, `ApprovalNotAllowed()`
- `ZeroAddress()`, `TokenDoesNotExist()`
- `DuplicateContentHash()`, `NotOwner()`

---

### Metadata Conventions
- `keywordsCsv`: comma-separated, lowercased; max ~10 entries.
- `priceUsdcCents`: integer cents, 10–50.
- `tokenURI`: should include or point to JSON with the `contentHash` and optionally article metadata; minimum viable approach is to embed a content-addressed URL (e.g., IPFS) or a backend URL that includes the keccak256.
- `contentHash`: exactly `keccak256(uploaded_markdown_bytes)` computed server-side before minting.

---

### Backend Integration (Example)
Python `web3.py` mint call outline:
```python
from web3 import Web3
from eth_account import Account

w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER_URL))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

kwargs = dict(
    to=creator_address,
    title=title,
    keywordsCsv=",".join(keywords[:10]),
    tokenUri=token_uri,            # includes/points to content hash
    contentHash=content_hash,      # bytes32 (0x...)
    priceUsdcCents=price_cents,
)
nonce = w3.eth.get_transaction_count(signer_address)
tx = contract.functions.mint(**kwargs).build_transaction({
    "from": signer_address,
    "nonce": nonce,
    "gas": 300000,
})
signed = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
receipt = w3.eth.send_raw_transaction(signed.rawTransaction)
```

---

### Deployment Notes
- Deploy with constructor name/symbol; record `CONTRACT_ADDRESS` and ABI for the backend.
- Owner-only mint fits a centralized minting backend; if transfer of ownership is needed later, add an owner transfer function.
- Network: Polygon Amoy (testnet) recommended for demos.

---

### Rationale
- On-chain `contentHash` ensures provenance and deduplication.
- Storing minimal metadata on-chain (title, keywordsCsv, price, tokenURI) balances cost and discoverability; full content stays off-chain. 