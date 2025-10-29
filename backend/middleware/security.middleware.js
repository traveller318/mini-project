/**
 * Security Middleware
 * Additional security measures for the application
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  // Helper function to sanitize strings
  const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove potential XSS patterns
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
      .trim();
  };

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitize(req.body[key]);
      }
    });
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitize(req.query[key]);
      }
    });
  }

  next();
};

/**
 * Prevent Parameter Pollution
 */
const preventParameterPollution = (req, res, next) => {
  // Convert array parameters to single values
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (Array.isArray(req.query[key])) {
        // Keep only the last value
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    });
  }

  next();
};

/**
 * Check for suspicious patterns
 */
const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /(\$where|\$ne|\$gt|\$lt)/i, // MongoDB injection
    /\b(union\s+select|insert\s+into|update\s+set|delete\s+from|drop\s+table|create\s+table|alter\s+table)\b/i, // SQL injection (with word boundaries)
    /(<script|javascript:|onerror=|onload=)/i, // XSS
    /(\.\.\/|\.\.\\)/g, // Path traversal
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  // Check body
  if (req.body) {
    const bodyString = JSON.stringify(req.body);
    if (suspiciousPatterns.some(pattern => pattern.test(bodyString))) {
      return res.status(400).json({
        success: false,
        message: 'Suspicious activity detected'
      });
    }
  }

  // Check query parameters
  if (req.query) {
    for (const key in req.query) {
      if (checkValue(req.query[key])) {
        return res.status(400).json({
          success: false,
          message: 'Suspicious activity detected in query parameters'
        });
      }
    }
  }

  next();
};

/**
 * Add security headers
 */
const addSecurityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  next();
};

/**
 * Validate request origin (CSRF protection)
 */
const validateOrigin = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.get('origin');
  const referer = req.get('referer');
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:8081'];

  // Check if origin or referer is allowed
  if (origin || referer) {
    const requestOrigin = origin || new URL(referer).origin;
    
    if (!allowedOrigins.includes(requestOrigin) && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Request origin not allowed'
      });
    }
  }

  next();
};

/**
 * IP Whitelist/Blacklist
 */
const ipFilter = (options = {}) => {
  const { whitelist = [], blacklist = [] } = options;

  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;

    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIp)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }

    // Check whitelist if configured
    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
      return res.status(403).json({
        success: false,
        message: 'Access allowed only from whitelisted IPs'
      });
    }

    next();
  };
};

/**
 * Request logging for security audit
 */
const securityLogger = (req, res, next) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?._id || 'anonymous'
  };

  // Log sensitive operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    console.log('🔒 Security Log:', JSON.stringify(logData));
  }

  next();
};

/**
 * Prevent brute force attacks on specific routes
 */
const bruteForceProtection = () => {
  const attempts = new Map();

  // Clean up old entries every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of attempts.entries()) {
      if (now - value.firstAttempt > 15 * 60 * 1000) {
        attempts.delete(key);
      }
    }
  }, 10 * 60 * 1000);

  return (req, res, next) => {
    const identifier = req.body.email || req.ip || req.connection.remoteAddress;
    const now = Date.now();

    let record = attempts.get(identifier);

    if (!record) {
      record = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now
      };
      attempts.set(identifier, record);
    }

    // Reset if window expired
    if (now - record.firstAttempt > 15 * 60 * 1000) {
      record.count = 0;
      record.firstAttempt = now;
    }

    record.count++;
    record.lastAttempt = now;

    // Block if too many attempts
    if (record.count > 5) {
      const timeLeft = Math.ceil((15 * 60 * 1000 - (now - record.firstAttempt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Please try again in ${Math.ceil(timeLeft / 60)} minutes.`,
        retryAfter: timeLeft
      });
    }

    next();
  };
};

module.exports = {
  sanitizeInput,
  preventParameterPollution,
  detectSuspiciousActivity,
  addSecurityHeaders,
  validateOrigin,
  ipFilter,
  securityLogger,
  bruteForceProtection
};
