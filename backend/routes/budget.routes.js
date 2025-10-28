const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { validateBudget, validateObjectId } = require('../middleware/validation.middleware');
const budgetController = require('../controllers/budget.controller');

// ============================================
// BUDGET ROUTES
// ============================================

// @route   POST /api/v1/budgets
// @desc    Create a new budget
// @access  Private
router.post(
  '/',
  protect,
  validateBudget,
  budgetController.createBudget
);

// @route   GET /api/v1/budgets
// @desc    Get all budgets for authenticated user
// @access  Private
router.get(
  '/',
  protect,
  budgetController.getAllBudgets
);

// @route   GET /api/v1/budgets/overview
// @desc    Get budget overview
// @access  Private
router.get(
  '/overview',
  protect,
  budgetController.getBudgetOverview
);

// @route   GET /api/v1/budgets/alerts
// @desc    Check and trigger budget alerts
// @access  Private
router.get(
  '/alerts',
  protect,
  budgetController.checkBudgetAlerts
);

// @route   POST /api/v1/budgets/renew
// @desc    Renew recurring budgets
// @access  Private
router.post(
  '/renew',
  protect,
  budgetController.renewBudgets
);

// @route   GET /api/v1/budgets/category/:category
// @desc    Get budgets by category
// @access  Private
router.get(
  '/category/:category',
  protect,
  budgetController.getBudgetsByCategory
);

// @route   GET /api/v1/budgets/:id
// @desc    Get budget by ID
// @access  Private
router.get(
  '/:id',
  protect,
  validateObjectId('id'),
  budgetController.getBudgetById
);

// @route   PUT /api/v1/budgets/:id
// @desc    Update budget
// @access  Private
router.put(
  '/:id',
  protect,
  validateObjectId('id'),
  budgetController.updateBudget
);

// @route   DELETE /api/v1/budgets/:id
// @desc    Delete budget (soft delete)
// @access  Private
router.delete(
  '/:id',
  protect,
  validateObjectId('id'),
  budgetController.deleteBudget
);

module.exports = router;
