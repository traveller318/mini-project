const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadProfilePicture } = require('../middleware/upload.middleware');

// All routes are protected
router.use(protect);

// Dashboard
router.get('/dashboard', userController.getDashboard);

// Profile Management
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/profile/image', uploadProfilePicture, userController.updateProfileImage);

// Financial Summary
router.get('/financial-summary', userController.getFinancialSummary);

// Risk Profile
router.put('/risk-profile', userController.updateRiskProfile);

module.exports = router;
