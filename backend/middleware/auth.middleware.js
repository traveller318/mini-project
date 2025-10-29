const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT Token
 * Adds user object to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔍 Decoded token:', decoded);

      // Get user from token (exclude password)
      const user = await User.findById(decoded.userId).select('-password');
      console.log('👤 User found:', user ? user._id : 'NOT FOUND');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Invalid token.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Optional Auth - Adds user if token is valid but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Invalid token - just continue without user
        console.log('Optional auth: Invalid token');
      }
    }

    next();
  } catch (error) {
    console.error('Optional Auth Middleware Error:', error);
    next();
  }
};

/**
 * Check if user is verified
 */
const requireVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email to access this feature',
        verified: false
      });
    }

    next();
  } catch (error) {
    console.error('Verification Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification check failed'
    });
  }
};

/**
 * Check subscription plan access
 */
const requireSubscription = (...allowedPlans) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userPlan = req.user.subscriptionPlan || 'free';

      // Check if user's plan is in allowed plans
      if (!allowedPlans.includes(userPlan)) {
        return res.status(403).json({
          success: false,
          message: `This feature requires a ${allowedPlans.join(' or ')} subscription`,
          currentPlan: userPlan,
          requiredPlans: allowedPlans
        });
      }

      // Check if subscription is active (not expired)
      if (req.user.subscriptionExpiresAt && new Date() > req.user.subscriptionExpiresAt) {
        return res.status(403).json({
          success: false,
          message: 'Your subscription has expired. Please renew to continue.',
          expired: true
        });
      }

      next();
    } catch (error) {
      console.error('Subscription Middleware Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Subscription check failed'
      });
    }
  };
};

module.exports = {
  protect,
  optionalAuth,
  requireVerification,
  requireSubscription
};
