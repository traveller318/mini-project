const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Get subscriptions
router.get('/', subscriptionController.getAllSubscriptions);
router.get('/upcoming', subscriptionController.getUpcomingSubscriptions);
router.get('/calendar', subscriptionController.getCalendarData);
router.get('/:id', subscriptionController.getSubscription);

// Create, update, delete
router.post('/', subscriptionController.createSubscription);
router.put('/:id', subscriptionController.updateSubscription);
router.delete('/:id', subscriptionController.deleteSubscription);

// Record payment
router.post('/:id/payment', subscriptionController.recordPayment);

module.exports = router;
