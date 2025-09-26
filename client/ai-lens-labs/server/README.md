# AI Lens Labs Server

Express server with PostgreSQL and Prisma for handling content uploads.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
```

3. Update the `.env` file with your PostgreSQL connection string:
```
DATABASE_URL="postgresql://username:password@localhost:5432/ai_lens_labs?schema=public"
PORT=3001
```

4. Set up the database:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### POST /api/upload
Upload markdown content with metadata.

**Request:**
- `file`: Markdown file (multipart/form-data)
- `title`: Content title (string)
- `keywords`: JSON array of keywords (string)
- `userAddress`: Ethereum wallet address (string)

**Response:**
```json
{
  "message": "Content uploaded successfully",
  "content": {
    "id": "clx...",
    "title": "My Article",
    "contentHash": "0x...",
    "userAddress": "0x...",
    "keywords": ["AI", "blockchain"],
    "fileName": "article.md",
    "fileSize": 1024,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/content
Get all uploaded content.

**Response:**
```json
{
  "contents": [
    {
      "id": "clx...",
      "title": "My Article",
      "contentHash": "0x...",
      "userAddress": "0x...",
      "keywords": ["AI", "blockchain"],
      "fileName": "article.md",
      "fileSize": 1024,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/content/:hash
Get content by Keccak-256 hash.

**Response:**
```json
{
  "content": {
    "id": "clx...",
    "title": "My Article",
    "content": "# My Article\n\nContent here...",
    "contentHash": "0x...",
    "userAddress": "0x...",
    "keywords": ["AI", "blockchain"],
    "fileName": "article.md",
    "fileSize": 1024,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

## Database Schema

The `Content` model includes:
- `id`: Unique identifier
- `title`: Content title
- `content`: Markdown content
- `contentHash`: Keccak-256 hash (unique)
- `userAddress`: Ethereum wallet address
- `keywords`: Array of keywords
- `fileName`: Original file name
- `fileSize`: File size in bytes
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
