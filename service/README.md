# Veridian Service

A unified backend service that combines content management, payment processing, and API endpoints for the Veridian decentralized content platform.

## Overview

This service merges the functionality of the previous Resource Server and Service Agent into a single, cohesive backend:

- **Content Management**: Upload, store, and retrieve markdown content
- **Payment Processing**: Handle x402 payment verification and settlement
- **Database**: SQLite database with Prisma ORM
- **File Uploads**: Multer-based file handling with validation
- **API Endpoints**: RESTful APIs for content operations

## Architecture

The service provides:

### Core Endpoints
- `GET /healthz` - Service health check
- `GET /health` - Legacy health endpoint
- `POST /api/upload` - Upload new content with file
- `GET /api/content` - List all content
- `GET /api/content-hashes-keywords` - Get content for discovery (used by Evaluator Agent)
- `GET /api/content/:hash` - Get specific content (paywalled)
- `GET /a2a/content/:hash` - Legacy A2A endpoint for demo compatibility

### Payment Integration
- **x402 Protocol**: HTTP 402 responses with payment requirements
- **Payment Verification**: Validates X-PAYMENT headers
- **Payment Settlement**: Processes successful payments

### Database Schema
- **Content Table**: Stores markdown files, metadata, and pricing
- **Prisma ORM**: Type-safe database operations
- **SQLite**: File-based database (can be changed to PostgreSQL)

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Set Up Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Create database and tables
```

### 4. Start the Service
```bash
# Development
npm run dev

# Production
npm start
```

The service will run on `http://localhost:5402`

## Environment Variables

```bash
# Server Configuration
PORT=5402
NODE_ENV=development

# Database Configuration
DATABASE_URL="file:./dev.db"

# Blockchain Configuration
ADDRESS=0xA7635CdB2B835737FdcE78Ea22F06Fb78101110f
FACILITATOR_URL=http://localhost:5401
AMOY_USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582
```

## Integration

The service integrates with:

- **Evaluator Agent** (`localhost:8000`) - AI content analysis
- **Frontend** (`localhost:5173`) - Upload interface
- **Demo Script** - Automated content discovery and purchase
- **x402 Facilitator** (`localhost:5401`) - Payment verification

## Migration from Previous Architecture

This service replaces:
- **Resource Server** (`client/ai-lens-labs/server/`) - Now integrated
- **Service Agent** (`service/src/`) - Enhanced and expanded

### Benefits of Migration:
- **Simplified Architecture**: One service instead of two
- **Reduced Network Hops**: Direct database access
- **Better Maintainability**: Single codebase
- **Improved Performance**: No proxy overhead

## API Usage Examples

### Upload Content
```bash
curl -X POST http://localhost:5402/api/upload \
  -F "file=@article.md" \
  -F "title=My Article" \
  -F "keywords=[\"ai\",\"blockchain\"]" \
  -F "userAddress=0x123..." \
  -F "price=2.50"
```

### Get Content (Paywalled)
```bash
# First request - get payment requirements
curl http://localhost:5402/api/content/abc123
# Returns: 402 + payment requirements

# Second request - with payment
curl -H "X-PAYMENT: <base64-payment>" \
  http://localhost:5402/api/content/abc123
# Returns: Content if payment valid
```

### Health Check
```bash
curl http://localhost:5402/healthz
# Returns: {"status": "ok", "service": "veridian-service"}
```
