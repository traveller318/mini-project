/**
 * Validation Middleware
 * Validates request body, params, and query parameters
 */

/**
 * Validate User Registration Data
 */
const validateUserRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  // Email validation
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please provide a valid email address');
    }
  }

  // Password validation
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  } else if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate User Login Data
 */
const validateUserLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate Transaction Data
 */
const validateTransaction = (req, res, next) => {
  const { type, amount, category, description } = req.body;
  const errors = [];

  // Type validation
  if (!type) {
    errors.push('Transaction type is required');
  } else if (!['Income', 'Expense'].includes(type)) {
    errors.push('Transaction type must be either Income or Expense');
  }

  // Amount validation
  if (amount === undefined || amount === null) {
    errors.push('Amount is required');
  } else if (isNaN(amount) || amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  // Category validation
  if (!category || category.trim().length === 0) {
    errors.push('Category is required');
  }

  // Description validation (optional but if provided, check length)
  if (description && description.length > 500) {
    errors.push('Description cannot exceed 500 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate Budget Data
 */
const validateBudget = (req, res, next) => {
  const { category, limit, period } = req.body;
  const errors = [];

  if (!category || category.trim().length === 0) {
    errors.push('Category is required');
  }

  if (limit === undefined || limit === null) {
    errors.push('Budget limit is required');
  } else if (isNaN(limit) || limit <= 0) {
    errors.push('Budget limit must be a positive number');
  }

  if (period && !['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
    errors.push('Period must be daily, weekly, monthly, or yearly');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate Saving Goal Data
 */
const validateSavingGoal = (req, res, next) => {
  const { name, targetAmount, deadline } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Goal name is required');
  } else if (name.length > 100) {
    errors.push('Goal name cannot exceed 100 characters');
  }

  if (targetAmount === undefined || targetAmount === null) {
    errors.push('Target amount is required');
  } else if (isNaN(targetAmount) || targetAmount <= 0) {
    errors.push('Target amount must be a positive number');
  }

  if (deadline) {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.push('Invalid deadline date');
    } else if (deadlineDate < new Date()) {
      errors.push('Deadline must be in the future');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate Subscription Data
 */
const validateSubscription = (req, res, next) => {
  const { name, amount, category, billingCycle, nextBillingDate } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Subscription name is required');
  }

  if (amount === undefined || amount === null) {
    errors.push('Amount is required');
  } else if (isNaN(amount) || amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (!category || category.trim().length === 0) {
    errors.push('Category is required');
  }

  if (billingCycle && !['daily', 'weekly', 'monthly', 'yearly'].includes(billingCycle)) {
    errors.push('Billing cycle must be daily, weekly, monthly, or yearly');
  }

  if (nextBillingDate) {
    const billingDate = new Date(nextBillingDate);
    if (isNaN(billingDate.getTime())) {
      errors.push('Invalid next billing date');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

/**
 * Validate Email Format
 */
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  next();
};

/**
 * Validate Password Reset Token
 */
const validatePasswordReset = (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const errors = [];

  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!confirmPassword) {
    errors.push('Please confirm your password');
  }

  if (password && confirmPassword && password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateTransaction,
  validateBudget,
  validateSavingGoal,
  validateSubscription,
  validateObjectId,
  validateEmail,
  validatePasswordReset
};
