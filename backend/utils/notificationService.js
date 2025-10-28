/**
 * Notification Service
 * Utility for creating and managing notifications
 */

const Notification = require('../models/Notification');

/**
 * Create a notification
 */
const createNotification = async (userId, data) => {
  try {
    const notification = await Notification.create({
      userId,
      type: data.type || 'system',
      title: data.title,
      message: data.message,
      icon: data.icon || 'notifications-outline',
      color: data.color || '#3B82F6',
      priority: data.priority || 'medium',
      relatedDocument: data.relatedDocument || null,
      action: data.action || { type: 'none' },
      channels: data.channels || {
        inApp: { enabled: true, delivered: true, deliveredAt: new Date() },
        push: { enabled: false },
        email: { enabled: false }
      }
    });

    return notification;
  } catch (error) {
    console.error('Create Notification Error:', error);
    throw error;
  }
};

/**
 * Create budget alert notification
 */
const createBudgetAlert = async (userId, budget, percentage) => {
  const type = percentage >= 100 ? 'budget_exceeded' : 'budget_alert';
  const icon = percentage >= 100 ? 'alert-circle' : 'warning-outline';
  const color = percentage >= 100 ? '#EF4444' : percentage >= 90 ? '#F59E0B' : '#3B82F6';
  const priority = percentage >= 100 ? 'urgent' : percentage >= 90 ? 'high' : 'medium';

  return await createNotification(userId, {
    type,
    title: `Budget Alert: ${budget.category}`,
    message: `You've spent ${Math.round(percentage)}% of your ${budget.category} budget (₹${budget.spent.toLocaleString()} / ₹${budget.limit.toLocaleString()})`,
    icon,
    color,
    priority,
    relatedDocument: {
      documentType: 'Budget',
      documentId: budget._id
    }
  });
};

/**
 * Create subscription reminder notification
 */
const createSubscriptionReminder = async (userId, subscription, daysUntilDue) => {
  const isOverdue = daysUntilDue < 0;
  const type = isOverdue ? 'subscription_overdue' : 'subscription_due';
  const icon = isOverdue ? 'alert-circle' : 'calendar-outline';
  const color = isOverdue ? '#EF4444' : daysUntilDue <= 3 ? '#F59E0B' : '#3B82F6';
  const priority = isOverdue ? 'urgent' : daysUntilDue <= 3 ? 'high' : 'medium';

  const message = isOverdue
    ? `Your ${subscription.name} subscription is overdue! Amount: ₹${subscription.amount}`
    : `Your ${subscription.name} subscription is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}. Amount: ₹${subscription.amount}`;

  return await createNotification(userId, {
    type,
    title: isOverdue ? 'Subscription Overdue' : 'Upcoming Subscription',
    message,
    icon,
    color,
    priority,
    relatedDocument: {
      documentType: 'Subscription',
      documentId: subscription._id
    }
  });
};

/**
 * Create goal milestone notification
 */
const createGoalMilestone = async (userId, goal, percentage) => {
  const isAchieved = percentage >= 100;
  const type = isAchieved ? 'goal_achieved' : 'goal_milestone';
  const icon = isAchieved ? 'trophy' : 'flag-outline';
  const color = isAchieved ? '#10B981' : '#3B82F6';
  const priority = isAchieved ? 'high' : 'medium';

  const message = isAchieved
    ? `Congratulations! You've achieved your goal "${goal.name}" of ₹${goal.targetAmount.toLocaleString()}!`
    : `You've reached ${Math.round(percentage)}% of your goal "${goal.name}" (₹${goal.currentAmount.toLocaleString()} / ₹${goal.targetAmount.toLocaleString()})`;

  return await createNotification(userId, {
    type,
    title: isAchieved ? 'Goal Achieved! 🎉' : 'Goal Milestone',
    message,
    icon,
    color,
    priority,
    relatedDocument: {
      documentType: 'SavingGoal',
      documentId: goal._id
    }
  });
};

/**
 * Create transaction notification
 */
const createTransactionNotification = async (userId, transaction) => {
  const isIncome = transaction.type.toLowerCase() === 'income';
  const icon = isIncome ? 'arrow-down-circle' : 'arrow-up-circle';
  const color = isIncome ? '#10B981' : '#EF4444';

  return await createNotification(userId, {
    type: 'transaction_added',
    title: isIncome ? 'Income Added' : 'Expense Added',
    message: `${transaction.name}: ₹${transaction.amount.toLocaleString()} (${transaction.category})`,
    icon,
    color,
    priority: 'low',
    relatedDocument: {
      documentType: 'Transaction',
      documentId: transaction._id
    }
  });
};

/**
 * Create spending insight notification
 */
const createSpendingInsight = async (userId, insight) => {
  return await createNotification(userId, {
    type: 'spending_insight',
    title: insight.title,
    message: insight.message,
    icon: insight.icon || 'analytics-outline',
    color: insight.color || '#3B82F6',
    priority: insight.priority || 'low'
  });
};

/**
 * Create achievement notification
 */
const createAchievement = async (userId, achievement) => {
  return await createNotification(userId, {
    type: 'achievement',
    title: achievement.title,
    message: achievement.message,
    icon: 'trophy',
    color: '#10B981',
    priority: 'medium'
  });
};

/**
 * Bulk create notifications
 */
const bulkCreateNotifications = async (notifications) => {
  try {
    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Bulk Create Notifications Error:', error);
    throw error;
  }
};

/**
 * Check and send scheduled notifications
 */
const processScheduledNotifications = async () => {
  try {
    const now = new Date();
    
    const scheduledNotifications = await Notification.find({
      isDeleted: false,
      scheduledFor: { $lte: now },
      'channels.inApp.delivered': false
    });

    for (const notification of scheduledNotifications) {
      notification.channels.inApp.delivered = true;
      notification.channels.inApp.deliveredAt = new Date();
      await notification.save();
    }

    return scheduledNotifications.length;
  } catch (error) {
    console.error('Process Scheduled Notifications Error:', error);
    throw error;
  }
};

/**
 * Clean up old read notifications
 */
const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.updateMany(
      {
        isDeleted: false,
        isRead: true,
        readAt: { $lte: cutoffDate }
      },
      {
        isDeleted: true,
        deletedAt: new Date()
      }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error('Cleanup Old Notifications Error:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createBudgetAlert,
  createSubscriptionReminder,
  createGoalMilestone,
  createTransactionNotification,
  createSpendingInsight,
  createAchievement,
  bulkCreateNotifications,
  processScheduledNotifications,
  cleanupOldNotifications
};
