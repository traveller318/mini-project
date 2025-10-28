const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectDatabase, setupConnectionEvents, getConnectionStatus } = require('./config/database');

// Initialize Express App
const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security Headers
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static Files
app.use('/uploads', express.static('uploads'));

// ============================================
// API ROUTES
// ============================================

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: getConnectionStatus(),
    uptime: process.uptime()
  });
});

// API Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Finance Tracker API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1'
    }
  });
});

// API Routes - Will be added later
// app.use('/api/v1/auth', require('./routes/auth.routes'));
// app.use('/api/v1/users', require('./routes/user.routes'));
// app.use('/api/v1/transactions', require('./routes/transaction.routes'));
// app.use('/api/v1/budgets', require('./routes/budget.routes'));
// app.use('/api/v1/goals', require('./routes/goal.routes'));
// app.use('/api/v1/subscriptions', require('./routes/subscription.routes'));
// app.use('/api/v1/notifications', require('./routes/notification.routes'));
// app.use('/api/v1/investments', require('./routes/investment.routes'));
// app.use('/api/v1/voice', require('./routes/voice.routes'));

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler - Route Not Found
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      field
    });
  }

  // Mongoose Cast Error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      field: err.path
    });
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default Error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Setup database connection events
    setupConnectionEvents();

    // Connect to MongoDB
    await connectDatabase();

    // Start Express Server
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 =============================================');
      console.log(`🌐 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Local: http://localhost:${PORT}`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log('🚀 =============================================');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing
module.exports = app;
