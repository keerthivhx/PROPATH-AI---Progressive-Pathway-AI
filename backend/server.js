
require('dotenv').config();

const dns = require('dns');

// Fix MongoDB Atlas SRV DNS resolution on this system
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');

const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessment');
const roadmapRoutes = require('./routes/roadmap');
const interviewRoutes = require('./routes/interview');
const projectRoutes = require('./routes/projects');
const jdRoutes = require('./routes/jd');
const profileRoutes = require('./routes/profile');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/jd', jdRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);

// ─────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    time: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────

async function startServer() {
  const PORT = process.env.PORT || 5000;
  const MONGO_URI = process.env.MONGODB_URI;

  let connected = false;

  // ───────────────────────────────────────────────────────────
  // 1. Connect to MongoDB Atlas
  // ───────────────────────────────────────────────────────────

  if (MONGO_URI) {
    try {
      console.log('🔌 Connecting to MongoDB Atlas...');

      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4
      });

      console.log('✅ MongoDB Atlas connected!');
      connected = true;

    } catch (err) {
      console.warn(`⚠️  Atlas unreachable: ${err.message}`);
      console.log('   → Falling back to in-memory MongoDB...\n');
    }
  } else {
    console.warn('⚠️  MONGODB_URI is missing from .env');
  }

  // ───────────────────────────────────────────────────────────
  // 2. Fallback to In-Memory MongoDB
  // ───────────────────────────────────────────────────────────

  if (!connected) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');

      const mongod = await MongoMemoryServer.create();

      await mongoose.connect(mongod.getUri());

      console.log(
        '✅ In-memory MongoDB running (data resets on restart)'
      );

      console.log(
        '   ⚠️  For persistence, fix the Atlas connection and reconnect.\n'
      );

      connected = true;

    } catch (err2) {
      console.error(
        '❌ Could not start MongoDB:',
        err2.message
      );

      process.exit(1);
    }
  }

  // ───────────────────────────────────────────────────────────
  // Start Express Server
  // ───────────────────────────────────────────────────────────

  server.listen(PORT, () => {
    console.log(`🚀 ProPath AI  →  http://localhost:${PORT}`);

    console.log(
      `🤖 AI Model   →  ${
        process.env.OLLAMA_MODEL || 'qwen2.5:1.5b'
      } via Ollama\n`
    );
  });

  // ───────────────────────────────────────────────────────────
  // Port Error Handling
  // ───────────────────────────────────────────────────────────

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} already in use!`);

      console.log(
        '   Fix: Stop-Process -Name "node" -Force\n'
      );

      process.exit(1);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────

startServer();

module.exports = {
  app,
  server
};
