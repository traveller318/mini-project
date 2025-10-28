/**
 * Scheduled Tasks
 * Periodic tasks that run in the background
 */

const Subscription = require('../models/Subscription');
const Budget = require('../models/Budget');
const SavingGoal = require('../models/SavingGoal');
const { createSubscriptionReminder, createGoalMilestone } = require('./notificationService');

/**
 * Check upcoming subscription due dates and send reminders
 */
const checkSubscriptionReminders = async () => {
  try {
    console.log('🔔 Checking subscription reminders...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Find subscriptions due in the next 7 days
    const upcomingSubscriptions = await Subscription.find({
      isDeleted: false,
      status: 'active',
      $or: [
        { nextDueDate: { $gte: today, $lte: sevenDaysFromNow } },
        { dueDate: { $gte: today, $lte: sevenDaysFromNow } }
      ]
    });

    let remindersCreated = 0;

    for (const subscription of upcomingSubscriptions) {
      const dueDate = new Date(subscription.nextDueDate || subscription.dueDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      // Send reminders at 7 days, 3 days, and 1 day before due
      if (daysUntilDue === 7 || daysUntilDue === 3 || daysUntilDue === 1 || daysUntilDue === 0) {
        await createSubscriptionReminder(subscription.userId, subscription, daysUntilDue);
        remindersCreated++;
      }
    }

    console.log(`✅ Created ${remindersCreated} subscription reminders`);
    return remindersCreated;

  } catch (error) {
    console.error('❌ Check Subscription Reminders Error:', error);
    throw error;
  }
};

/**
 * Check overdue subscriptions
 */
const checkOverdueSubscriptions = async () => {
  try {
    console.log('⚠️  Checking overdue subscriptions...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueSubscriptions = await Subscription.find({
      isDeleted: false,
      status: 'active',
      $or: [
        { nextDueDate: { $lt: today } },
        { dueDate: { $lt: today } }
      ]
    });

    let alertsCreated = 0;

    for (const subscription of overdueSubscriptions) {
      const dueDate = new Date(subscription.nextDueDate || subscription.dueDate);
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

      await createSubscriptionReminder(subscription.userId, subscription, -daysOverdue);
      alertsCreated++;

      // Update subscription status
      subscription.status = 'overdue';
      await subscription.save();
    }

    console.log(`✅ Created ${alertsCreated} overdue subscription alerts`);
    return alertsCreated;

  } catch (error) {
    console.error('❌ Check Overdue Subscriptions Error:', error);
    throw error;
  }
};

/**
 * Auto-renew recurring budgets
 */
const autoRenewBudgets = async () => {
  try {
    console.log('🔄 Auto-renewing budgets...');
    
    const now = new Date();
    const budgetsToRenew = await Budget.find({
      isDeleted: false,
      isRecurring: true,
      'recurringSettings.autoRenew': true,
      endDate: { $lte: now },
      status: 'active'
    });

    let renewedCount = 0;

    for (const oldBudget of budgetsToRenew) {
      // Mark old budget as completed
      oldBudget.status = 'completed';
      await oldBudget.save();

      // Calculate new dates based on period
      let newStartDate, newEndDate;
      
      switch (oldBudget.period) {
        case 'weekly':
          newStartDate = new Date(oldBudget.endDate);
          newStartDate.setDate(newStartDate.getDate() + 1);
          newEndDate = new Date(newStartDate);
          newEndDate.setDate(newEndDate.getDate() + 6);
          break;
        case 'monthly':
          newStartDate = new Date(oldBudget.endDate);
          newStartDate.setDate(newStartDate.getDate() + 1);
          newEndDate = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0);
          break;
        case 'quarterly':
          newStartDate = new Date(oldBudget.endDate);
          newStartDate.setDate(newStartDate.getDate() + 1);
          newEndDate = new Date(newStartDate);
          newEndDate.setMonth(newEndDate.getMonth() + 3);
          newEndDate.setDate(0);
          break;
        case 'yearly':
          newStartDate = new Date(oldBudget.endDate);
          newStartDate.setDate(newStartDate.getDate() + 1);
          newEndDate = new Date(newStartDate.getFullYear() + 1, 0, 0);
          break;
        default:
          continue;
      }

      // Calculate new limit with adjustment factor
      const adjustmentFactor = oldBudget.recurringSettings.adjustmentFactor || 0;
      const newLimit = oldBudget.limit * (1 + adjustmentFactor / 100);

      // Create new budget
      const newBudget = await Budget.create({
        userId: oldBudget.userId,
        name: oldBudget.name,
        description: oldBudget.description,
        category: oldBudget.category,
        limit: newLimit,
        spent: 0,
        period: oldBudget.period,
        startDate: newStartDate,
        endDate: newEndDate,
        alerts: {
          enabled: true,
          thresholds: [
            { percentage: 50, triggered: false },
            { percentage: 75, triggered: false },
            { percentage: 90, triggered: false }
          ]
        },
        rollover: oldBudget.rollover,
        color: oldBudget.color,
        icon: oldBudget.icon,
        isRecurring: true,
        recurringSettings: oldBudget.recurringSettings
      });

      // Handle rollover
      if (oldBudget.rollover.enabled && oldBudget.rollover.carryForwardUnspent) {
        const unspent = Math.max(0, oldBudget.limit - oldBudget.spent);
        newBudget.rollover.previousPeriodRemainder = unspent;
        newBudget.limit += unspent;
        await newBudget.save();
      }

      renewedCount++;
    }

    console.log(`✅ Renewed ${renewedCount} budgets`);
    return renewedCount;

  } catch (error) {
    console.error('❌ Auto-Renew Budgets Error:', error);
    throw error;
  }
};

/**
 * Check saving goal milestones
 */
const checkGoalMilestones = async () => {
  try {
    console.log('🎯 Checking goal milestones...');
    
    const goals = await SavingGoal.find({
      isDeleted: false,
      status: 'in-progress'
    });

    let milestonesCreated = 0;

    for (const goal of goals) {
      const percentage = (goal.currentAmount / goal.targetAmount) * 100;

      // Check for milestone notifications (25%, 50%, 75%, 90%, 100%)
      const milestones = [25, 50, 75, 90, 100];
      
      for (const milestone of milestones) {
        if (percentage >= milestone) {
          // Check if we already sent this milestone notification
          const milestoneKey = `milestone_${milestone}`;
          if (!goal.metadata || !goal.metadata[milestoneKey]) {
            await createGoalMilestone(goal.userId, goal, percentage);
            
            // Mark milestone as sent
            if (!goal.metadata) goal.metadata = {};
            goal.metadata[milestoneKey] = true;
            await goal.save();
            
            milestonesCreated++;

            // Update status if goal is achieved
            if (percentage >= 100 && goal.status !== 'achieved') {
              goal.status = 'achieved';
              await goal.save();
            }
          }
        }
      }
    }

    console.log(`✅ Created ${milestonesCreated} goal milestone notifications`);
    return milestonesCreated;

  } catch (error) {
    console.error('❌ Check Goal Milestones Error:', error);
    throw error;
  }
};

/**
 * Run all scheduled tasks
 */
const runScheduledTasks = async () => {
  console.log('\n⏰ Running scheduled tasks...');
  console.log('=================================');
  
  try {
    await checkSubscriptionReminders();
    await checkOverdueSubscriptions();
    await autoRenewBudgets();
    await checkGoalMilestones();
    
    console.log('=================================');
    console.log('✅ All scheduled tasks completed\n');
  } catch (error) {
    console.error('❌ Scheduled tasks error:', error);
  }
};

/**
 * Initialize scheduled tasks (run daily)
 */
const initializeScheduledTasks = () => {
  // Run immediately on startup
  runScheduledTasks();

  // Run daily at midnight
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // next day
    0, 0, 0 // at 00:00:00
  );
  
  const msToMidnight = night.getTime() - now.getTime();

  setTimeout(() => {
    runScheduledTasks();
    // Then run every 24 hours
    setInterval(runScheduledTasks, 24 * 60 * 60 * 1000);
  }, msToMidnight);

  console.log('📅 Scheduled tasks initialized - will run daily at midnight');
};

module.exports = {
  checkSubscriptionReminders,
  checkOverdueSubscriptions,
  autoRenewBudgets,
  checkGoalMilestones,
  runScheduledTasks,
  initializeScheduledTasks
};
