# MongoDB Database Schema - Dependencies

## Required npm packages for backend

```json
{
  "name": "finance-app-backend",
  "version": "1.0.0",
  "description": "Personal Finance Management Backend API",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest --coverage"
  },
  "dependencies": {
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

## Installation Commands

### Install all dependencies
```bash
cd backend
npm install
```

### Or install individually
```bash
# Core dependencies
npm install mongoose bcryptjs

# Express and middleware
npm install express cors helmet morgan compression

# Validation and security
npm install express-validator jsonwebtoken dotenv

# Development tools
npm install -D nodemon jest supertest
```

## Environment Variables (.env file)

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/finance-app
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance-app?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8081

# File Upload Configuration
MAX_FILE_SIZE=5000000
FILE_UPLOAD_PATH=./uploads

# API Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Third-party API keys
SPEECH_TO_TEXT_API_KEY=your-api-key
OCR_API_KEY=your-api-key
```

## Database Connection Setup

Create `backend/config/database.js`:

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Connection events
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## Basic Server Setup

Create `backend/index.js`:

```javascript
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Load env vars
dotenv.config();

// Database connection
const connectDB = require('./config/database');

// Import models
const {
  User,
  Transaction,
  SavingGoal,
  Subscription,
  Budget,
  Notification,
  VoiceInteraction,
  InvestmentRecommendation
} = require('./models');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(helmet());
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Test route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    models: {
      User: User.modelName,
      Transaction: Transaction.modelName,
      SavingGoal: SavingGoal.modelName,
      Subscription: Subscription.modelName,
      Budget: Budget.modelName,
      Notification: Notification.modelName,
      VoiceInteraction: VoiceInteraction.modelName,
      InvestmentRecommendation: InvestmentRecommendation.modelName
    }
  });
});

// Routes (to be created)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/transactions', require('./routes/transactions'));
// app.use('/api/goals', require('./routes/goals'));
// app.use('/api/subscriptions', require('./routes/subscriptions'));
// app.use('/api/budgets', require('./routes/budgets'));
// app.use('/api/notifications', require('./routes/notifications'));
// app.use('/api/voice', require('./routes/voice'));
// app.use('/api/recommendations', require('./routes/recommendations'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
```

## Testing the Setup

### 1. Start MongoDB (Local)
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 2. Start the Server
```bash
npm run dev
```

### 3. Test the Health Endpoint
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "models": {
    "User": "User",
    "Transaction": "Transaction",
    "SavingGoal": "SavingGoal",
    "Subscription": "Subscription",
    "Budget": "Budget",
    "Notification": "Notification",
    "VoiceInteraction": "VoiceInteraction",
    "InvestmentRecommendation": "InvestmentRecommendation"
  }
}
```

## Optional Dependencies

### For Advanced Features

```bash
# Rate limiting
npm install express-rate-limit

# File uploads (for receipts)
npm install multer

# Image processing
npm install sharp

# Email sending
npm install nodemailer

# Redis caching
npm install redis ioredis

# Push notifications
npm install firebase-admin

# Scheduler for recurring tasks
npm install node-cron

# Logging
npm install winston

# API documentation
npm install swagger-ui-express swagger-jsdoc

# Testing
npm install -D @faker-js/faker mongodb-memory-server
```

## Recommended VS Code Extensions

- **MongoDB for VS Code**: Database management
- **Thunder Client**: API testing
- **REST Client**: API testing in VS Code
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up environment variables
3. ✅ Test database connection
4. ⬜ Create controllers
5. ⬜ Create routes
6. ⬜ Add authentication middleware
7. ⬜ Add validation middleware
8. ⬜ Implement error handling
9. ⬜ Add API documentation
10. ⬜ Write tests

---

**Setup Guide Version**: 1.0.0  
**Last Updated**: October 28, 2025
