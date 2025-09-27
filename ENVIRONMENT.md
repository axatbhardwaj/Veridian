# Environment Variables Setup

This document describes how to set up environment variables for the Veridian project.

## Overview

The Veridian project consists of multiple services, each requiring their own environment configuration:

- **Agents** (`/agents/`) - AI evaluation service
- **Facilitator** (`/facilitator-amoy/`) - Payment facilitation service  
- **Demo** (`/demo/`) - Demo application
- **Service** (`/service/`) - Main service layer
- **Client Server** (`/client/ai-lens-labs/server/`) - Client-side server

## Setup Instructions

1. **Copy environment templates**: Each service directory contains a `.env.example` file. Copy these to `.env` files:

```bash
# In each service directory, run:
cp .env.example .env
```

2. **Fill in the actual values**: Edit each `.env` file with your actual credentials and configuration.

## Security Notice

⚠️ **IMPORTANT**: Never commit `.env` files to version control. They contain sensitive credentials.

✅ **Safe to commit**: `.env.example` files (these contain only templates)
❌ **Never commit**: `.env` files (these contain actual secrets)

## Service-Specific Configuration

### Agents (`/agents/.env`)

Required for the AI evaluation service:

```bash
# Gemini API Configuration (required for AI evaluation)
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-pro

# Server Configuration
PORT=8000
```

### Facilitator (`/facilitator-amoy/.env`)

Required for payment processing:

```bash
# Private Key (required for blockchain transactions)
FACILITATOR_PRIVATE_KEY=your_actual_private_key_here
PRIVATE_KEY=your_actual_private_key_here

# Network Configuration
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
AMOY_USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582

# Server Configuration
PORT=5401
```

### Demo (`/demo/.env`)

Required for demo functionality:

```bash
# Private Key (required for demo transactions)
PRIVATE_KEY=your_actual_private_key_here

# Service URLs
SERVICE_AGENT_URL=http://localhost:5402
MATCH_TOPIC_URL=http://127.0.0.1:8000/match_topic
AGENT_CARD_PATH=

# Payment Configuration
PAYMENT_AMOUNT=10000
PRIVATE_KEY_ADDRESS=your_wallet_address_here
```

### Service (`/service/.env`)

```bash
# Service Configuration
RESOURCE_SERVER_URL=your_resource_server_url
ENDPOINT_PATH=/premium/summarize

# Server Configuration
PORT=5402
```

### Client Server (`/client/ai-lens-labs/server/.env`)

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Contract Configuration
ADDRESS=0xA7635CdB2B835737FdcE78Ea22F06Fb78101110f
FACILITATOR_URL=http://localhost:5401
AMOY_USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582
```

## Security Best Practices

1. **Use different keys for different environments** (development, staging, production)
2. **Rotate keys regularly** 
3. **Use environment-specific key restrictions** when possible
4. **Monitor key usage** through your service provider dashboards
5. **Never log or expose environment variables** in application output

## Troubleshooting

If you encounter errors like:
- `GEMINI_API_KEY environment variable is required`
- `FACILITATOR_PRIVATE_KEY or PRIVATE_KEY environment variable is required`

Make sure you've:
1. Created the `.env` file in the correct directory
2. Added the required environment variable with an actual value
3. Restarted the service after adding the environment variable

## Getting API Keys

### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

### Private Keys
⚠️ **Use test/development keys only** - never use mainnet private keys in development.

For Polygon Amoy testnet:
1. Create a test wallet
2. Get test MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
3. Use the private key from your test wallet