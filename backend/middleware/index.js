/**
 * Middleware Index
 * Central export for all middleware modules
 */

const auth = require('./auth.middleware');
const validation = require('./validation.middleware');
const errorHandler = require('./errorHandler.middleware');
const rateLimiter = require('./rateLimiter.middleware');
const upload = require('./upload.middleware');
const security = require('./security.middleware');
const logger = require('./logger.middleware');

module.exports = {
  // Authentication Middleware
  ...auth,
  
  // Validation Middleware
  ...validation,
  
  // Error Handler Middleware
  ...errorHandler,
  
  // Rate Limiter Middleware
  ...rateLimiter,
  
  // Upload Middleware
  ...upload,
  
  // Security Middleware
  ...security,
  
  // Logger Middleware
  ...logger
};
