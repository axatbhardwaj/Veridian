# Environment Variables Setup

This document describes how to set up environment variables for the Veridian project.

## Overview

The Veridian project consists of multiple services, each requiring their own environment configuration:

- **Evaluator Agent** (`/agents/evaluator/`) - AI evaluation service
- **Veridian Service** (`/service/`) - Unified backend service
- **Demo Client** (`/demo/`) - Demo application for testing
- **x402 Facilitator** (`/facilitator-amoy/`) - Payment facilitation service
- **Frontend** (`/client/ai-lens-labs/`) - React frontend application

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

### Evaluator Agent (`/agents/evaluator/.env`)

Required for the AI evaluation service:

```bash
# Gemini API Configuration (required for AI evaluation)
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-pro

# Server Configuration
PORT=8000

# Service Integration
RESOURCE_SERVER_URL=http://localhost:5402
```

### Veridian Service (`/service/.env`)

Required for the unified backend service:

```bash
# Server Configuration
PORT=5402
NODE_ENV=development

# Database Configuration (SQLite by default)
DATABASE_URL="file:./dev.db"

# Blockchain Configuration
ADDRESS=0xA7635CdB2B835737FdcE78Ea22F06Fb78101110f
FACILITATOR_URL=http://localhost:5401
AMOY_USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582

# Gemini AI Configuration (for evaluator agent)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-pro
```

### Demo Client (`/demo/.env`)

Required for demo functionality:

```bash
# Service URLs
SERVICE_AGENT_URL=http://localhost:5402
MATCH_TOPIC_URL=http://127.0.0.1:8000/match_topic

# Demo Payment Configuration
PRIVATE_KEY=0x95a79e8336434ff65801b2dd78d4f0d921c06d9d648a2e4e462174a58d5ebe0a
PRIVATE_KEY_ADDRESS=0xA7635CdB2B835737FdcE78Ea22F06Fb78101110f
PAYMENT_AMOUNT=10000
```

### x402 Facilitator (`/facilitator-amoy/.env`)

Required for payment processing:

```bash
# Facilitator Configuration
FACILITATOR_PRIVATE_KEY=0x95a79e8336434ff65801b2dd78d4f0d921c06d9d648a2e4e462174a58d5ebe0a
PRIVATE_KEY=0x95a79e8336434ff65801b2dd78d4f0d921c06d9d648a2e4e462174a58d5ebe0a

# Network Configuration
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
AMOY_USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582

# Server Configuration
PORT=5401
```

### Frontend (`/client/ai-lens-labs/.env`)

Required for the React frontend application:

```bash
# API Endpoints
VITE_API_URL=http://localhost:5402
VITE_EVALUATOR_URL=http://localhost:8000

# Additional frontend configuration can be added here
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