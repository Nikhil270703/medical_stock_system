const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    "http://localhost:3009",
    "http://localhost:5173",
    "https://medical-stock-system.vercel.app"
  ],
  credentials: true
}));

// Security & Middleware
app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('tiny'));

// Health Check Route
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'result-analysis'
  });
});

// API Routes
app.use('/result-analysis', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found'
  });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('[result-analysis]', err.message);

  res.status(err.status || 500).json({
    error: err.message || 'Server error'
  });
});

module.exports = app;