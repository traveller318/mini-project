/**
 * Custom Error Handler Middleware
 * Handles all types of errors in the application
 */

/**
 * Not Found Error Handler
 * Handles 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler
 * Handles all errors passed to next(error)
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (cleaned up logging handled by errorLogger middleware)
  // Don't duplicate logging here if errorLogger is being used

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errors = [];

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    errors = [{
      field,
      message: `This ${field} is already registered`
    }];
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    errors = [{
      field: err.path,
      message: `Invalid ${err.path} format`
    }];
  }

  // JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errors = [{
      field: 'token',
      message: 'Please login with valid credentials'
    }];
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    errors = [{
      field: 'token',
      message: 'Please login again'
    }];
  }

  // Multer File Upload Errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size is too large';
      errors = [{
        field: 'file',
        message: 'Maximum file size is 5MB'
      }];
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
      errors = [{
        field: 'file',
        message: 'Invalid file upload field'
      }];
    } else {
      message = 'File upload error';
      errors = [{
        field: 'file',
        message: err.message
      }];
    }
  }

  // Database Connection Errors
  if (err.name === 'MongooseServerSelectionError') {
    statusCode = 503;
    message = 'Database connection error';
    errors = [{
      field: 'database',
      message: 'Unable to connect to database. Please try again later.'
    }];
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom Error Class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  AppError
};
