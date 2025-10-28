const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insights.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Analytics endpoints
router.get('/expense-distribution', insightsController.getExpenseDistribution);
router.get('/income-progression', insightsController.getIncomeProgression);
router.get('/spending-over-time', insightsController.getSpendingOverTime);
router.get('/category-trends', insightsController.getCategoryTrends);
router.get('/financial-health', insightsController.getFinancialHealthScore);
router.get('/recommendations', insightsController.getInsights);

module.exports = router;
