const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investment.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Get investment recommendations
router.get('/recommendations', investmentController.getRecommendations);
router.get('/insights', investmentController.getPersonalizedInsights);

// Update risk profile
router.put('/risk-profile', investmentController.updateRiskProfile);

module.exports = router;
