/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting the number of requests
 */

// Simple in-memory rate limiter
const rateLimitStore = new Map();

/**
 * Clean up old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Generic Rate Limiter
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let record = rateLimitStore.get(key);

    // Initialize or reset if window expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    next();
  };
};

/**
 * General API Rate Limiter
 * Limit: 100 requests per 15 minutes
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});

/**
 * Auth Rate Limiter (Login/Register)
 * Limit: 5 requests per 15 minutes
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  keyGenerator: (req) => {
    // Use email if provided, otherwise IP
    return req.body.email || req.ip || req.connection.remoteAddress;
  }
});

/**
 * Password Reset Rate Limiter
 * Limit: 3 requests per hour
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  message: 'Too many password reset attempts, please try again after an hour.',
  keyGenerator: (req) => {
    return req.body.email || req.ip || req.connection.remoteAddress;
  }
});

/**
 * File Upload Rate Limiter
 * Limit: 20 uploads per hour
 */
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many file uploads, please try again after an hour.'
});

/**
 * Voice Interaction Rate Limiter
 * Limit: 50 requests per hour
 */
const voiceLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 50,
  message: 'Too many voice interactions, please try again after an hour.',
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?._id.toString() || req.ip || req.connection.remoteAddress;
  }
});

/**
 * Investment Recommendation Rate Limiter
 * Limit: 10 requests per hour
 */
const investmentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many investment recommendation requests, please try again after an hour.',
  keyGenerator: (req) => {
    return req.user?._id.toString() || req.ip || req.connection.remoteAddress;
  }
});

/**
 * Notification Rate Limiter
 * Limit: 30 requests per hour
 */
const notificationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many notification requests, please try again after an hour.',
  keyGenerator: (req) => {
    return req.user?._id.toString() || req.ip || req.connection.remoteAddress;
  }
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  voiceLimiter,
  investmentLimiter,
  notificationLimiter
};
