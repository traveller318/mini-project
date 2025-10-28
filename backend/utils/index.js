/**
 * Utility Functions Index
 * Central export for all utility functions
 */

// Date Helpers
const {
  getPeriodDates,
  formatDate,
  getDaysBetween,
  isPast,
  isFuture,
  getRelativeTime,
  addDays,
  addMonths,
  getMonthName
} = require('./dateHelpers');

// Financial Calculations
const {
  calculatePercentage,
  calculateGrowthRate,
  calculateCompoundInterest,
  calculateSimpleInterest,
  calculateEMI,
  calculateGoalProgress,
  calculateBudgetUtilization,
  formatCurrency,
  formatNumber,
  calculateAverage,
  calculateSum,
  calculateVariance,
  calculateStandardDeviation,
  calculateIncomeExpenseRatio,
  calculateSavingsRate,
  calculateNetWorth,
  roundToTwo,
  toIndianCurrency
} = require('./calculations');

// Notification Service
const {
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
} = require('./notificationService');

// Scheduled Tasks
const {
  checkSubscriptionReminders,
  checkOverdueSubscriptions,
  autoRenewBudgets,
  checkGoalMilestones,
  runScheduledTasks,
  initializeScheduledTasks
} = require('./scheduledTasks');

module.exports = {
  // Date Helpers
  getPeriodDates,
  formatDate,
  getDaysBetween,
  isPast,
  isFuture,
  getRelativeTime,
  addDays,
  addMonths,
  getMonthName,

  // Financial Calculations
  calculatePercentage,
  calculateGrowthRate,
  calculateCompoundInterest,
  calculateSimpleInterest,
  calculateEMI,
  calculateGoalProgress,
  calculateBudgetUtilization,
  formatCurrency,
  formatNumber,
  calculateAverage,
  calculateSum,
  calculateVariance,
  calculateStandardDeviation,
  calculateIncomeExpenseRatio,
  calculateSavingsRate,
  calculateNetWorth,
  roundToTwo,
  toIndianCurrency,

  // Notification Service
  createNotification,
  createBudgetAlert,
  createSubscriptionReminder,
  createGoalMilestone,
  createTransactionNotification,
  createSpendingInsight,
  createAchievement,
  bulkCreateNotifications,
  processScheduledNotifications,
  cleanupOldNotifications,

  // Scheduled Tasks
  checkSubscriptionReminders,
  checkOverdueSubscriptions,
  autoRenewBudgets,
  checkGoalMilestones,
  runScheduledTasks,
  initializeScheduledTasks
};
