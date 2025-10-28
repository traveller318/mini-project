const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectDatabase, setupConnectionEvents, getConnectionStatus } = require('./config/database');
const { initializeScheduledTasks } = require('./utils/scheduledTasks');

// Import Custom Middleware
const {
  // Security Middleware
  addSecurityHeaders,
  sanitizeInput,
  preventParameterPollution,
  detectSuspiciousActivity,
  
  // Logging Middleware
  requestLogger,
  errorLogger,
  performanceLogger,
  
  // Error Handling Middleware
  notFound,
  errorHandler
} = require('./middleware');

// Initialize Express App
const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security Headers (Helmet + Custom)
app.use(helmet());
app.use(addSecurityHeaders);

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

// Custom Request Logger (Replaces Morgan for better control)
app.use(requestLogger);

// Performance Monitoring (Log requests slower than 3 seconds)
app.use(performanceLogger(3000));

// Security Middleware
app.use(sanitizeInput);
app.use(preventParameterPollution);
app.use(detectSuspiciousActivity);

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

// API Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/transactions', require('./routes/transaction.routes'));
app.use('/api/v1/goals', require('./routes/goal.routes'));
app.use('/api/v1/budgets', require('./routes/budget.routes'));
app.use('/api/v1/subscriptions', require('./routes/subscription.routes'));
app.use('/api/v1/insights', require('./routes/insights.routes'));
app.use('/api/v1/investments', require('./routes/investment.routes'));
app.use('/api/v1/voice', require('./routes/voice.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler - Route Not Found
app.use(notFound);

// Error Logger
app.use(errorLogger);

// Global Error Handler
app.use(errorHandler);

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

    // Initialize scheduled tasks for notifications and auto-renewal
    initializeScheduledTasks();

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
      console.log('✅ Middleware Status:');
      console.log('   🔒 Security: Enabled');
      console.log('   📝 Request Logging: Enabled');
      console.log('   ⚡ Performance Monitoring: Enabled (3s threshold)');
      console.log('   🛡️  Input Sanitization: Enabled');
      console.log('   ❌ Error Handling: Enabled');
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
