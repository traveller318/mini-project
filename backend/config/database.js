const mongoose = require('mongoose');

/**
 * Database Connection Configuration
 * Handles MongoDB connection with retry logic and event listeners
 */

const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URL;

    if (!mongoURI) {
      throw new Error('MongoDB connection string (MONGODB_URL) is not defined in environment variables');
    }

    // Connection options
    const options = {
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    console.log(`⚡ Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);

    return conn;

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Handle MongoDB Connection Events
 */
const setupConnectionEvents = () => {
  // Connection successful
  mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
  });

  // Connection error
  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err.message);
  });

  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected from MongoDB');
  });

  // App termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 Mongoose connection closed due to app termination');
    process.exit(0);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    console.error('Stack:', err.stack);
  });
};

/**
 * Get current connection status
 */
const getConnectionStatus = () => {
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  return states[mongoose.connection.readyState] || 'Unknown';
};

/**
 * Disconnect from database
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB Disconnected Successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
  }
};

module.exports = {
  connectDatabase,
  setupConnectionEvents,
  getConnectionStatus,
  disconnectDatabase
};
