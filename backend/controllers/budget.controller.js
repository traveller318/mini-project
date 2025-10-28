const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ============================================
// CREATE BUDGET
// ============================================
exports.createBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      description,
      category,
      limit,
      period,
      startDate,
      endDate,
      color,
      icon,
      alerts
    } = req.body;

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      userId,
      category,
      period,
      isDeleted: false,
      status: 'active'
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: `Active budget already exists for ${category} (${period})`
      });
    }

    // Create budget
    const budget = await Budget.create({
      userId,
      name: name || `${category} Budget`,
      description,
      category,
      limit,
      period,
      startDate: startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      color: color || '#3B82F6',
      icon: icon || 'wallet-outline',
      alerts: alerts || {
        enabled: true,
        thresholds: [
          { percentage: 50, triggered: false },
          { percentage: 75, triggered: false },
          { percentage: 90, triggered: false }
        ]
      }
    });

    // Calculate current spending for this budget
    await updateBudgetSpending(budget);

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: { budget }
    });

  } catch (error) {
    console.error('Create Budget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating budget',
      error: error.message
    });
  }
};

// ============================================
// GET ALL BUDGETS
// ============================================
exports.getAllBudgets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, period, category } = req.query;

    const query = {
      userId,
      isDeleted: false
    };

    if (status) query.status = status;
    if (period) query.period = period;
    if (category) query.category = category;

    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    // Update spending for each budget
    for (const budget of budgets) {
      await updateBudgetSpending(budget);
    }

    res.status(200).json({
      success: true,
      data: {
        budgets,
        count: budgets.length
      }
    });

  } catch (error) {
    console.error('Get All Budgets Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budgets',
      error: error.message
    });
  }
};

// ============================================
// GET BUDGET BY ID
// ============================================
exports.getBudgetById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const budget = await Budget.findOne({ _id: id, userId, isDeleted: false });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Update spending
    await updateBudgetSpending(budget);

    res.status(200).json({
      success: true,
      data: { budget }
    });

  } catch (error) {
    console.error('Get Budget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget',
      error: error.message
    });
  }
};

// ============================================
// GET BUDGETS BY CATEGORY
// ============================================
exports.getBudgetsByCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category } = req.params;

    const budgets = await Budget.find({
      userId,
      category,
      isDeleted: false
    }).sort({ createdAt: -1 });

    // Update spending for each budget
    for (const budget of budgets) {
      await updateBudgetSpending(budget);
    }

    res.status(200).json({
      success: true,
      data: {
        budgets,
        category,
        count: budgets.length
      }
    });

  } catch (error) {
    console.error('Get Budgets By Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budgets',
      error: error.message
    });
  }
};

// ============================================
// UPDATE BUDGET
// ============================================
exports.updateBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating userId or spent amount directly
    delete updateData.userId;
    delete updateData.spent;

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Update spending
    await updateBudgetSpending(budget);

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: { budget }
    });

  } catch (error) {
    console.error('Update Budget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating budget',
      error: error.message
    });
  }
};

// ============================================
// DELETE BUDGET (SOFT DELETE)
// ============================================
exports.deleteBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'completed'
      },
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
      data: { budget }
    });

  } catch (error) {
    console.error('Delete Budget Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting budget',
      error: error.message
    });
  }
};

// ============================================
// GET BUDGET OVERVIEW
// ============================================
exports.getBudgetOverview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'monthly' } = req.query;

    const budgets = await Budget.find({
      userId,
      period,
      isDeleted: false,
      status: 'active'
    });

    // Update spending for each budget
    for (const budget of budgets) {
      await updateBudgetSpending(budget);
    }

    // Calculate totals
    const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalLimit - totalSpent;
    const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

    // Get categories at risk (>80% spent)
    const categoriesAtRisk = budgets.filter(b => {
      const percentage = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
      return percentage > 80;
    });

    res.status(200).json({
      success: true,
      data: {
        budgets,
        overview: {
          totalLimit,
          totalSpent,
          totalRemaining,
          overallPercentage,
          categoriesAtRisk: categoriesAtRisk.length
        }
      }
    });

  } catch (error) {
    console.error('Get Budget Overview Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget overview',
      error: error.message
    });
  }
};

// ============================================
// CHECK BUDGET ALERTS
// ============================================
exports.checkBudgetAlerts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const budgets = await Budget.find({
      userId,
      isDeleted: false,
      status: 'active',
      'alerts.enabled': true
    });

    const alerts = [];

    for (const budget of budgets) {
      await updateBudgetSpending(budget);

      const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;

      // Check each threshold
      for (const threshold of budget.alerts.thresholds) {
        if (percentage >= threshold.percentage && !threshold.triggered) {
          // Create notification
          await Notification.create({
            userId,
            type: percentage >= 100 ? 'budget_exceeded' : 'budget_alert',
            title: `Budget Alert: ${budget.category}`,
            message: `You've spent ${Math.round(percentage)}% of your ${budget.category} budget (₹${budget.spent.toLocaleString()} / ₹${budget.limit.toLocaleString()})`,
            icon: 'warning-outline',
            color: percentage >= 100 ? '#EF4444' : percentage >= 90 ? '#F59E0B' : '#3B82F6',
            priority: percentage >= 100 ? 'urgent' : percentage >= 90 ? 'high' : 'medium',
            relatedDocument: {
              documentType: 'Budget',
              documentId: budget._id
            }
          });

          // Mark threshold as triggered
          threshold.triggered = true;
          threshold.triggeredAt = new Date();

          alerts.push({
            budgetId: budget._id,
            category: budget.category,
            percentage: Math.round(percentage),
            threshold: threshold.percentage
          });
        }
      }

      budget.alerts.lastAlertSent = new Date();
      await budget.save();

      // Update status if exceeded
      if (percentage >= 100 && budget.status !== 'exceeded') {
        budget.status = 'exceeded';
        await budget.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `${alerts.length} alert(s) triggered`,
      data: { alerts }
    });

  } catch (error) {
    console.error('Check Budget Alerts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking budget alerts',
      error: error.message
    });
  }
};

// ============================================
// RENEW BUDGETS (FOR RECURRING BUDGETS)
// ============================================
exports.renewBudgets = async (req, res) => {
  try {
    const userId = req.user.userId;

    const now = new Date();
    const budgetsToRenew = await Budget.find({
      userId,
      isDeleted: false,
      isRecurring: true,
      'recurringSettings.autoRenew': true,
      endDate: { $lte: now }
    });

    const renewedBudgets = [];

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

      renewedBudgets.push(newBudget);
    }

    res.status(200).json({
      success: true,
      message: `${renewedBudgets.length} budget(s) renewed successfully`,
      data: { renewedBudgets }
    });

  } catch (error) {
    console.error('Renew Budgets Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error renewing budgets',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTION: UPDATE BUDGET SPENDING
// ============================================
async function updateBudgetSpending(budget) {
  try {
    // Get all transactions in budget period
    const transactions = await Transaction.find({
      userId: budget.userId,
      isDeleted: false,
      type: 'expense',
      category: budget.category,
      date: {
        $gte: budget.startDate,
        $lte: budget.endDate
      }
    });

    const totalSpent = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    budget.spent = totalSpent;
    budget.remaining = budget.limit - totalSpent;

    // Calculate analytics
    const daysPassed = Math.ceil((new Date() - budget.startDate) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((budget.endDate - budget.startDate) / (1000 * 60 * 60 * 24));
    
    budget.analytics.averageSpending = daysPassed > 0 ? totalSpent / daysPassed : 0;
    budget.analytics.spendingVelocity = budget.analytics.averageSpending;
    budget.analytics.projectedSpend = totalDays > 0 ? budget.analytics.averageSpending * totalDays : 0;

    // Update status
    const percentage = budget.limit > 0 ? (totalSpent / budget.limit) * 100 : 0;
    if (percentage >= 100) {
      budget.status = 'exceeded';
    } else if (new Date() > budget.endDate) {
      budget.status = 'completed';
    } else {
      budget.status = 'active';
    }

    await budget.save();
    return budget;

  } catch (error) {
    console.error('Update Budget Spending Error:', error);
    throw error;
  }
}
