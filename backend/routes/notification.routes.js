const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validation.middleware');
const notificationController = require('../controllers/notification.controller');

// ============================================
// NOTIFICATION ROUTES
// ============================================

// @route   POST /api/v1/notifications
// @desc    Create a new notification
// @access  Private
router.post(
  '/',
  protect,
  notificationController.createNotification
);

// @route   GET /api/v1/notifications
// @desc    Get all notifications for authenticated user
// @access  Private
router.get(
  '/',
  protect,
  notificationController.getAllNotifications
);

// @route   GET /api/v1/notifications/unread/count
// @desc    Get unread notification count
// @access  Private
router.get(
  '/unread/count',
  protect,
  notificationController.getUnreadCount
);

// @route   GET /api/v1/notifications/summary
// @desc    Get notification summary
// @access  Private
router.get(
  '/summary',
  protect,
  notificationController.getNotificationSummary
);

// @route   PUT /api/v1/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put(
  '/mark-all-read',
  protect,
  notificationController.markAllAsRead
);

// @route   DELETE /api/v1/notifications/all
// @desc    Delete all notifications
// @access  Private
router.delete(
  '/all',
  protect,
  notificationController.deleteAllNotifications
);

// @route   POST /api/v1/notifications/cleanup
// @desc    Cleanup expired notifications
// @access  Private
router.post(
  '/cleanup',
  protect,
  notificationController.cleanupExpiredNotifications
);

// @route   GET /api/v1/notifications/type/:type
// @desc    Get notifications by type
// @access  Private
router.get(
  '/type/:type',
  protect,
  notificationController.getNotificationsByType
);

// @route   GET /api/v1/notifications/:id
// @desc    Get notification by ID
// @access  Private
router.get(
  '/:id',
  protect,
  validateObjectId('id'),
  notificationController.getNotificationById
);

// @route   PUT /api/v1/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put(
  '/:id/read',
  protect,
  validateObjectId('id'),
  notificationController.markAsRead
);

// @route   DELETE /api/v1/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete(
  '/:id',
  protect,
  validateObjectId('id'),
  notificationController.deleteNotification
);

module.exports = router;
