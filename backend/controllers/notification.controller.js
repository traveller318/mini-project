const Notification = require('../models/Notification');
const User = require('../models/User');

// ============================================
// CREATE NOTIFICATION
// ============================================
exports.createNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      type,
      title,
      message,
      icon,
      color,
      priority,
      relatedDocument,
      action,
      scheduledFor,
      expiresAt,
      channels
    } = req.body;

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      icon: icon || 'notifications-outline',
      color: color || '#3B82F6',
      priority: priority || 'medium',
      relatedDocument,
      action,
      scheduledFor,
      expiresAt,
      channels: channels || {
        inApp: { enabled: true, delivered: false },
        push: { enabled: false, delivered: false },
        email: { enabled: false, delivered: false }
      }
    });

    // Mark as delivered for in-app
    if (notification.channels.inApp.enabled) {
      notification.channels.inApp.delivered = true;
      notification.channels.inApp.deliveredAt = new Date();
      await notification.save();
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification }
    });

  } catch (error) {
    console.error('Create Notification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

// ============================================
// GET ALL NOTIFICATIONS
// ============================================
exports.getAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      page = 1, 
      limit = 20, 
      isRead, 
      type, 
      priority 
    } = req.query;

    const query = {
      userId,
      isDeleted: false
    };

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    if (type) {
      query.type = type;
    }

    if (priority) {
      query.priority = priority;
    }

    // Check for expired notifications
    const now = new Date();
    query.$or = [
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ];

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalNotifications: count
      }
    });

  } catch (error) {
    console.error('Get All Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// ============================================
// GET NOTIFICATION BY ID
// ============================================
exports.getNotificationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId,
      isDeleted: false
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { notification }
    });

  } catch (error) {
    console.error('Get Notification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification',
      error: error.message
    });
  }
};

// ============================================
// GET UNREAD COUNT
// ============================================
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      userId,
      isRead: false,
      isDeleted: false,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });

  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

// ============================================
// MARK AS READ
// ============================================
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });

  } catch (error) {
    console.error('Mark As Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// ============================================
// MARK ALL AS READ
// ============================================
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      {
        userId,
        isRead: false,
        isDeleted: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Mark All As Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// ============================================
// DELETE NOTIFICATION
// ============================================
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: { notification }
    });

  } catch (error) {
    console.error('Delete Notification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// ============================================
// DELETE ALL NOTIFICATIONS
// ============================================
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { onlyRead } = req.query;

    const query = {
      userId,
      isDeleted: false
    };

    // Only delete read notifications if specified
    if (onlyRead === 'true') {
      query.isRead = true;
    }

    const result = await Notification.updateMany(
      query,
      {
        isDeleted: true,
        deletedAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Notifications deleted successfully',
      data: {
        deletedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Delete All Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notifications',
      error: error.message
    });
  }
};

// ============================================
// GET NOTIFICATIONS BY TYPE
// ============================================
exports.getNotificationsByType = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({
      userId,
      type,
      isDeleted: false,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Notification.countDocuments({
      userId,
      type,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        type,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalNotifications: count
      }
    });

  } catch (error) {
    console.error('Get Notifications By Type Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// ============================================
// GET NOTIFICATION SUMMARY
// ============================================
exports.getNotificationSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const now = new Date();

    // Count by priority
    const urgentCount = await Notification.countDocuments({
      userId,
      isRead: false,
      isDeleted: false,
      priority: 'urgent',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    });

    const highCount = await Notification.countDocuments({
      userId,
      isRead: false,
      isDeleted: false,
      priority: 'high',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    });

    // Count by type
    const budgetAlerts = await Notification.countDocuments({
      userId,
      isRead: false,
      isDeleted: false,
      type: { $in: ['budget_alert', 'budget_exceeded'] },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    });

    const subscriptionReminders = await Notification.countDocuments({
      userId,
      isRead: false,
      isDeleted: false,
      type: { $in: ['subscription_due', 'subscription_overdue'] },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    });

    const goalUpdates = await Notification.countDocuments({
      userId,
      isRead: false,
      isDeleted: false,
      type: { $in: ['goal_milestone', 'goal_achieved'] },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    });

    const totalUnread = await Notification.countDocuments({
      userId,
      isRead: false,
      isDeleted: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUnread,
          byPriority: {
            urgent: urgentCount,
            high: highCount
          },
          byType: {
            budgetAlerts,
            subscriptionReminders,
            goalUpdates
          }
        }
      }
    });

  } catch (error) {
    console.error('Get Notification Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification summary',
      error: error.message
    });
  }
};

// ============================================
// CLEANUP EXPIRED NOTIFICATIONS
// ============================================
exports.cleanupExpiredNotifications = async (req, res) => {
  try {
    const now = new Date();

    const result = await Notification.updateMany(
      {
        isDeleted: false,
        expiresAt: { $lte: now }
      },
      {
        isDeleted: true,
        deletedAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Expired notifications cleaned up',
      data: {
        deletedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Cleanup Expired Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up expired notifications',
      error: error.message
    });
  }
};
