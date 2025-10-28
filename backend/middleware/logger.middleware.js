/**
 * Custom Logger Middleware
 * Provides detailed logging for API requests and responses
 */

const fs = require('fs');
const path = require('path');

/**
 * Ensure logs directory exists
 */
const ensureLogsDir = () => {
  const logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
};

/**
 * Write log to file
 */
const writeLogToFile = (filename, data) => {
  try {
    const logsDir = ensureLogsDir();
    const filePath = path.join(logsDir, filename);
    const logEntry = `${JSON.stringify(data)}\n`;
    
    fs.appendFileSync(filePath, logEntry);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
};

/**
 * Get log filename for current date
 */
const getLogFilename = (type = 'access') => {
  const date = new Date().toISOString().split('T')[0];
  return `${type}-${date}.log`;
};

/**
 * Request Logger
 * Logs all incoming requests
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Skip logging for static files and health checks
  if (req.path.startsWith('/uploads') || req.path === '/health') {
    return next();
  }

  // Log request (simple format for console)
  const timestamp = new Date().toLocaleTimeString();
  console.log(`📥 [${timestamp}] ${req.method} ${req.path}`);

  // Store original end function
  const originalEnd = res.end;

  // Override res.end to log response
  res.end = function (chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    const duration = Date.now() - startTime;

    // Console log with color based on status
    const statusColor = res.statusCode >= 500 ? '❌' 
      : res.statusCode >= 400 ? '⚠️' 
      : res.statusCode >= 300 ? '↪️' 
      : '✅';
    
    console.log(`${statusColor} [${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);

    // Write detailed logs to file in production
    if (process.env.NODE_ENV === 'production') {
      const requestLog = {
        timestamp: new Date().toISOString(),
        type: 'REQUEST',
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        query: req.query,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?._id || null,
        body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined
      };

      const responseLog = {
        timestamp: new Date().toISOString(),
        type: 'RESPONSE',
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?._id || null
      };

      writeLogToFile(getLogFilename('access'), { ...requestLog, response: responseLog });
    }
  };

  next();
};

/**
 * Error Logger
 * Logs all errors
 */
const errorLogger = (err, req, res, next) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    type: 'ERROR',
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: sanitizeBody(req.body),
    userId: req.user?._id || null,
    ip: req.ip || req.connection.remoteAddress
  };

  // Simple console error
  console.error(`❌ [${new Date().toLocaleTimeString()}] Error: ${err.message}`);
  
  // Detailed stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  // Write to error log file
  if (process.env.NODE_ENV === 'production') {
    writeLogToFile(getLogFilename('error'), errorLog);
  }

  next(err);
};

/**
 * Database Query Logger
 * Can be used to log database operations
 */
const dbLogger = (operation, collection, query = {}) => {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'DATABASE',
    operation,
    collection,
    query: JSON.stringify(query)
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(`🗄️  DB ${operation.toUpperCase()} on ${collection}`);
  }

  if (process.env.NODE_ENV === 'production') {
    writeLogToFile(getLogFilename('database'), log);
  }
};

/**
 * Authentication Logger
 * Logs authentication events
 */
const authLogger = (event, userId, details = {}) => {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'AUTH',
    event,
    userId,
    ...details
  };

  console.log(`🔐 Auth Event: ${event} - User: ${userId}`);

  writeLogToFile(getLogFilename('auth'), log);
};

/**
 * Performance Logger
 * Logs slow requests
 */
const performanceLogger = (threshold = 1000) => {
  return (req, res, next) => {
    // Skip for static files
    if (req.path.startsWith('/uploads')) {
      return next();
    }

    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > threshold) {
        const log = {
          timestamp: new Date().toISOString(),
          type: 'PERFORMANCE',
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          warning: 'Slow request detected'
        };

        console.warn(`⚠️  [${new Date().toLocaleTimeString()}] SLOW: ${req.method} ${req.path} - ${duration}ms (threshold: ${threshold}ms)`);

        if (process.env.NODE_ENV === 'production') {
          writeLogToFile(getLogFilename('performance'), log);
        }
      }
    });

    next();
  };
};

/**
 * Sanitize sensitive data from body
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
};

/**
 * API Analytics Logger
 * Tracks API usage statistics
 */
const analyticsLogger = (req, res, next) => {
  res.on('finish', () => {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'ANALYTICS',
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      userId: req.user?._id || 'anonymous',
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress
    };

    if (process.env.ENABLE_ANALYTICS === 'true') {
      writeLogToFile(getLogFilename('analytics'), log);
    }
  });

  next();
};

module.exports = {
  requestLogger,
  errorLogger,
  dbLogger,
  authLogger,
  performanceLogger,
  analyticsLogger
};
