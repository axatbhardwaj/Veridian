# Veridian

**A decentralized, AI-powered content platform with cryptographic payments**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Overview

Veridian is a revolutionary decentralized content platform that combines AI-powered content analysis with cryptographic payment processing. Creators can upload markdown articles, get them automatically priced by AI, and sell access through blockchain-based payments using the x402 protocol.

### ✨ Key Features

- 🤖 **AI-Powered Pricing**: Gemini AI analyzes content and suggests fair prices
- 🔍 **Smart Discovery**: Find relevant content using topic-based matching
- 💰 **Cryptographic Payments**: x402 protocol with USDC on Polygon Amoy
- 🔒 **Paywalled Content**: HTTP 402 responses with payment requirements
- 🗄️ **Database Storage**: SQLite with Prisma ORM
- ⚡ **Real-time Processing**: Live content analysis and pricing

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Evaluator AI   │    │  Veridian       │
│  (React/Vite)   │◄──►│  (Node/Express) │◄──►│  Service        │
│                 │    │                 │    │  (Backend)      │
│ localhost:8080  │    │ localhost:8000  │    │ localhost:5402  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                     │
         └────────────────────────┼─────────────────────┘
                                  │
                         ┌─────────────────┐
                         │   Demo Client   │
                         │  (TypeScript)   │
                         └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Veridian
npm install
```

### 2. Configure Environment

Copy environment templates and configure:

```bash
# Service configuration
cp service/.env.example service/.env

# Demo configuration
cp demo/.env.example demo/.env
```

### 3. Start Services

```bash
# Start all services
npm run dev

# Or start individually:
npm run dev:evaluator    # AI service (port 8000)
npm run dev:service      # Backend (port 5402)
npm run dev:client       # Frontend (port 8080)
```

### 4. Setup Database

```bash
cd service
npm run db:generate
npm run db:push
```

### 5. Test the System

```bash
# Run the demo
cd demo && npm run dev

# Or test APIs directly
curl http://localhost:8000/healthz
curl http://localhost:5402/healthz
```

## 📁 Project Structure

```
Veridian/
├── agents/evaluator/          # AI content analysis service
├── client/ai-lens-labs/       # React frontend application
├── service/                   # Unified backend service
├── demo/                      # Demo client for testing
├── contracts/                 # Smart contracts
├── Docs/                      # Documentation
└── test_article.md           # Sample content
```

## 🔧 Components

### 🤖 Evaluator Agent (`agents/evaluator/`)
- **AI-powered content analysis** using Gemini AI
- **Automatic pricing** based on content quality and length
- **Keyword extraction** for content discovery
- **Heuristic fallback** when AI is unavailable

**Endpoints:**
- `POST /evaluate` - Analyze content and suggest price/keywords
- `POST /match_topic` - Find content matching a topic
- `GET /healthz` - Health check

### ⚙️ Veridian Service (`service/`)
- **Unified backend** combining content management and payments
- **Database storage** with Prisma ORM and SQLite
- **Payment processing** with x402 protocol
- **File upload handling** with validation

**Endpoints:**
- `POST /api/upload` - Upload content
- `GET /api/content/:hash` - Access paywalled content
- `GET /api/content-hashes-keywords` - Discovery API
- `GET /a2a/content/:hash` - Legacy A2A endpoint

### 🎨 Frontend (`client/ai-lens-labs/`)
- **React/Vite** application for content creators
- **Wallet integration** for blockchain interactions
- **Upload interface** with real-time AI analysis
- **Modern UI** with responsive design

### 🧪 Demo Client (`demo/`)
- **End-to-end testing** of the complete workflow
- **Automated content discovery** and purchasing
- **Payment simulation** for development

## 💰 Payment System

### x402 Protocol Integration
- **HTTP 402 responses** with payment requirements
- **EIP-712 signatures** for cryptographic security
- **USDC on Polygon Amoy** for payments
- **Demo mode** for testing without real blockchain

### Pricing Model
- **AI-determined pricing**: $0.10 - $0.50 per article
- **Content-based valuation**: Considers length, uniqueness, quality
- **Transparent pricing**: Clear payment requirements

## 🔒 Security Features

- **Content integrity**: Keccak-256 hashing
- **Payment verification**: Cryptographic signature validation
- **Access control**: Paywall enforcement
- **Input validation**: File type and size restrictions

## 📊 API Examples

### Content Analysis
```bash
curl -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{"title": "My Article", "markdown": "# Content..."}'
```

### Content Upload
```bash
curl -X POST http://localhost:5402/api/upload \
  -F "file=@article.md" \
  -F "title=My Article" \
  -F "userAddress=0x123..."
```

### Content Access (Paywalled)
```bash
# First request - get payment requirements
curl http://localhost:5402/api/content/abc123
# Returns: 402 + payment requirements

# Second request - with payment
curl -H "X-PAYMENT: <base64-payment>" \
  http://localhost:5402/api/content/abc123
```

## 🛠️ Development

### Environment Variables

**Service** (`.env`):
```bash
PORT=5402
DATABASE_URL="file:./dev.db"
FACILITATOR_URL=http://localhost:5401
AMOY_USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582
GEMINI_API_KEY=your_api_key
```

**Demo** (`.env`):
```bash
SERVICE_AGENT_URL=http://localhost:5402
MATCH_TOPIC_URL=http://localhost:8000/match_topic
PRIVATE_KEY=your_private_key
```

### Database Management

```bash
cd service
npm run db:generate  # Generate Prisma client
npm run db:push      # Create/update database
```

## 🎯 Use Cases

1. **Content Creators**: Upload articles and earn from AI-determined pricing
2. **Researchers**: Access high-quality, verified content
3. **Developers**: Study AI-blockchain integration patterns
4. **Educators**: Demonstrate decentralized content economies

## 📚 Documentation

- [Technical Specification](Docs/veridian_technical_spec.md)
- [Evaluator Agent Guide](Docs/evaluator-agent.md)
- [Smart Contract Details](Docs/VerdianContentSBT.md)
- [Environment Setup](ENVIRONMENT.md)

## 🏆 Achievements

- ✅ **AI-powered content valuation**
- ✅ **Cryptographic payment processing**
- ✅ **Decentralized content marketplace**
- ✅ **Real-time content analysis**
- ✅ **Production-ready architecture**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built for ETHGlobal New Delhi 2025 Hackathon** 🚀 
