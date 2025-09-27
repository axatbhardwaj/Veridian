// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VerdianContentSBT
/// @notice Soul-bound style token for Verdian content with on-chain metadata
/// @dev Minimal ERC-721-like surface with transfers/approvals disabled
contract VerdianContentSBT {
    // ------------------------
    // Errors
    // ------------------------
    error TransferNotAllowed();
    error ApprovalNotAllowed();
    error ZeroAddress();
    error TokenDoesNotExist();
    error DuplicateContentHash();
    error NotOwner();

    // ------------------------
    // Events
    // ------------------------
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event ContentMinted(
        address indexed to,
        uint256 indexed tokenId,
        bytes32 indexed contentHash,
        uint256 priceUsdcCents
    );

    // ------------------------
    // Storage
    // ------------------------
    address public immutable contractOwner;
    string private _name;
    string private _symbol;

    uint256 private _tokenCount; // token IDs start at 1

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;

    // Metadata per tokenId
    mapping(uint256 => string) private _titleOf;
    mapping(uint256 => string) private _keywordsCsvOf; // up to 10, comma-separated
    mapping(uint256 => uint256) private _priceCentsOf; // 100..500
    mapping(uint256 => string) private _tokenUriOf; // should include hash representation
    mapping(uint256 => bytes32) private _contentHashOf;

    // Uniqueness guard
    mapping(bytes32 => uint256) public contentHashToTokenId; // 0 if none

    // ------------------------
    // Constructor
    // ------------------------
    constructor(string memory name_, string memory symbol_) {
        contractOwner = msg.sender;
        _name = name_;
        _symbol = symbol_;
    }

    // ------------------------
    // Modifiers
    // ------------------------
    modifier onlyOwner() {
        if (msg.sender != contractOwner) revert NotOwner();
        _;
    }

    // ------------------------
    // Mint
    // ------------------------
    function mint(
        address to,
        string memory title,
        string memory keywordsCsv,
        string memory tokenUri,
        bytes32 contentHash,
        uint256 priceUsdcCents
    ) external onlyOwner returns (uint256 tokenId) {
        if (to == address(0)) revert ZeroAddress();
        if (contentHashToTokenId[contentHash] != 0) revert DuplicateContentHash();

        tokenId = _nextTokenId();

        _ownerOf[tokenId] = to;
        _balanceOf[to] += 1;
        _titleOf[tokenId] = title;
        _keywordsCsvOf[tokenId] = keywordsCsv;
        _tokenUriOf[tokenId] = tokenUri;
        _contentHashOf[tokenId] = contentHash;
        _priceCentsOf[tokenId] = priceUsdcCents;
        contentHashToTokenId[contentHash] = tokenId;

        emit Transfer(address(0), to, tokenId);
        emit ContentMinted(to, tokenId, contentHash, priceUsdcCents);
    }

    function _nextTokenId() internal returns (uint256) {
        unchecked {
            _tokenCount += 1;
            return _tokenCount;
        }
    }

    // ------------------------
    // Views (ERC-721-like)
    // ------------------------
    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenCount;
    }

    function balanceOf(address owner) external view returns (uint256) {
        if (owner == address(0)) revert ZeroAddress();
        return _balanceOf[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _ownerOf[tokenId];
        if (owner == address(0)) revert TokenDoesNotExist();
        return owner;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        _requireExists(tokenId);
        return _tokenUriOf[tokenId];
    }

    // ------------------------
    // Metadata getters
    // ------------------------
    function titleOf(uint256 tokenId) external view returns (string memory) {
        _requireExists(tokenId);
        return _titleOf[tokenId];
    }

    function keywordsCsvOf(uint256 tokenId) external view returns (string memory) {
        _requireExists(tokenId);
        return _keywordsCsvOf[tokenId];
    }

    function priceUsdcCentsOf(uint256 tokenId) external view returns (uint256) {
        _requireExists(tokenId);
        return _priceCentsOf[tokenId];
    }

    function contentHashOf(uint256 tokenId) external view returns (bytes32) {
        _requireExists(tokenId);
        return _contentHashOf[tokenId];
    }

    // ------------------------
    // Disabled transfers/approvals (SBT semantics)
    // ------------------------
    function transferFrom(address, address, uint256) external pure {
        revert TransferNotAllowed();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert TransferNotAllowed();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert TransferNotAllowed();
    }

    function approve(address, uint256) external pure {
        revert ApprovalNotAllowed();
    }

    function setApprovalForAll(address, bool) external pure {
        revert ApprovalNotAllowed();
    }

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    // ------------------------
    // Internals
    // ------------------------
    function _requireExists(uint256 tokenId) internal view {
        if (_ownerOf[tokenId] == address(0)) revert TokenDoesNotExist();
    }
} 