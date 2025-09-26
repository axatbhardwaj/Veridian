const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { keccak256 } = require('js-sha3');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/markdown' || file.originalname.endsWith('.md')) {
      cb(null, true);
    } else {
      cb(new Error('Only markdown files are allowed'), false);
    }
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Upload content endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? { name: req.file.originalname, size: req.file.size } : 'No file');
    
    const { title, keywords, userAddress } = req.body;
    const file = req.file;

    // Validate required fields
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!userAddress || !userAddress.trim()) {
      return res.status(400).json({ error: 'User address is required' });
    }

    // Parse keywords
    let keywordsArray = [];
    if (keywords) {
      try {
        keywordsArray = JSON.parse(keywords);
      } catch (e) {
        keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      }
    }

    if (keywordsArray.length === 0) {
      return res.status(400).json({ error: 'At least one keyword is required' });
    }

    // Get file content
    const content = file.buffer.toString('utf-8');
    
    // Calculate Keccak-256 hash
    const contentHash = keccak256(content);

    // Check if content with this hash already exists
    const existingContent = await prisma.content.findUnique({
      where: { contentHash }
    });

    if (existingContent) {
      return res.status(409).json({ 
        error: 'Content with this hash already exists',
        existingContent: {
          id: existingContent.id,
          title: existingContent.title,
          userAddress: existingContent.userAddress
        }
      });
    }

    // Save to database
    const newContent = await prisma.content.create({
      data: {
        title: title.trim(),
        content,
        contentHash,
        userAddress: userAddress.trim(),
        keywords: keywordsArray,
        fileName: file.originalname,
        fileSize: file.size,
      }
    });

    res.status(201).json({
      message: 'Content uploaded successfully',
      content: {
        id: newContent.id,
        title: newContent.title,
        contentHash: newContent.contentHash,
        userAddress: newContent.userAddress,
        keywords: newContent.keywords,
        fileName: newContent.fileName,
        fileSize: newContent.fileSize,
        createdAt: newContent.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Content with this hash already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all content endpoint
app.get('/api/content', async (req, res) => {
  try {
    const contents = await prisma.content.findMany({
      select: {
        id: true,
        title: true,
        contentHash: true,
        userAddress: true,
        keywords: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ contents });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get content by hash endpoint
app.get('/api/content/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    const content = await prisma.content.findUnique({
      where: { contentHash: hash }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ content });
  } catch (error) {
    console.error('Get content by hash error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});
