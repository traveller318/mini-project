const Transaction = require('../models/Transaction');
const User = require('../models/User');

// ============================================
// GET EXPENSE DISTRIBUTION (PIE CHART)
// ============================================
exports.getExpenseDistribution = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const query = {
      userId,
      isDeleted: false,
      type: 'expense'
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query);

    // Group by category
    const categoryTotals = {};
    let totalExpense = 0;

    transactions.forEach(txn => {
      if (!categoryTotals[txn.category]) {
        categoryTotals[txn.category] = {
          name: txn.category,
          amount: 0,
          color: txn.color || '#A0A0A0'
        };
      }
      categoryTotals[txn.category].amount += txn.amount;
      totalExpense += txn.amount;
    });

    // Calculate percentages
    const expenseData = Object.values(categoryTotals).map(cat => ({
      ...cat,
      percentage: Math.round((cat.amount / totalExpense) * 100)
    }));

    res.status(200).json({
      success: true,
      data: { expenseData, totalExpense }
    });

  } catch (error) {
    console.error('Get Expense Distribution Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense distribution',
      error: error.message
    });
  }
};

// ============================================
// GET INCOME PROGRESSION (LINE CHART)
// ============================================
exports.getIncomeProgression = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { months = 6 } = req.query;

    const progressionData = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const transactions = await Transaction.find({
        userId,
        isDeleted: false,
        type: 'income',
        date: { $gte: monthStart, $lte: monthEnd }
      });

      const totalIncome = transactions.reduce((sum, txn) => sum + txn.amount, 0);

      progressionData.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        income: totalIncome
      });
    }

    res.status(200).json({
      success: true,
      data: { progressionData }
    });

  } catch (error) {
    console.error('Get Income Progression Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching income progression',
      error: error.message
    });
  }
};

// ============================================
// GET SPENDING OVER TIME
// ============================================
exports.getSpendingOverTime = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, year } = req.query;

    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth();
    const targetYear = year || currentDate.getFullYear();

    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, parseInt(targetMonth) + 1, 0);

    const transactions = await Transaction.find({
      userId,
      isDeleted: false,
      type: 'expense',
      date: { $gte: monthStart, $lte: monthEnd }
    }).sort({ date: 1 });

    // Group by day and calculate cumulative
    const dailySpending = {};
    let cumulative = 0;

    transactions.forEach(txn => {
      const day = txn.date.getDate();
      if (!dailySpending[day]) {
        dailySpending[day] = { day, amount: 0, cumulative: 0 };
      }
      dailySpending[day].amount += txn.amount;
      cumulative += txn.amount;
      dailySpending[day].cumulative = cumulative;
    });

    const spendingData = Object.values(dailySpending);

    res.status(200).json({
      success: true,
      data: {
        spendingData,
        totalSpent: cumulative,
        month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })
      }
    });

  } catch (error) {
    console.error('Get Spending Over Time Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching spending over time',
      error: error.message
    });
  }
};

// ============================================
// GET CATEGORY TRENDS (STACKED AREA CHART)
// ============================================
exports.getCategoryTrends = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { months = 6, categories } = req.query;

    const categoryList = categories 
      ? categories.split(',') 
      : ['Food & Drink', 'Shopping', 'Transport', 'Entertainment'];

    const trendData = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthData = {
        month: monthStart.toLocaleString('default', { month: 'short' })
      };

      for (const category of categoryList) {
        const transactions = await Transaction.find({
          userId,
          isDeleted: false,
          type: 'expense',
          category,
          date: { $gte: monthStart, $lte: monthEnd }
        });

        monthData[category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')] = 
          transactions.reduce((sum, txn) => sum + txn.amount, 0);
      }

      trendData.push(monthData);
    }

    res.status(200).json({
      success: true,
      data: { trendData, categories: categoryList }
    });

  } catch (error) {
    console.error('Get Category Trends Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category trends',
      error: error.message
    });
  }
};

// ============================================
// GET FINANCIAL HEALTH SCORE
// ============================================
exports.getFinancialHealthScore = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate financial health score based on various factors
    let score = 0;

    // Income vs Expense ratio (40 points)
    const incomeExpenseRatio = user.income.monthlyAmount > 0 
      ? (user.expense.monthlyAmount / user.income.monthlyAmount) 
      : 0;
    
    if (incomeExpenseRatio < 0.5) score += 40;
    else if (incomeExpenseRatio < 0.7) score += 30;
    else if (incomeExpenseRatio < 0.9) score += 20;
    else score += 10;

    // Savings rate (30 points)
    const savingsRate = user.income.monthlyAmount > 0
      ? ((user.income.monthlyAmount - user.expense.monthlyAmount) / user.income.monthlyAmount)
      : 0;
    
    if (savingsRate > 0.3) score += 30;
    else if (savingsRate > 0.2) score += 20;
    else if (savingsRate > 0.1) score += 10;

    // Balance (30 points)
    if (user.balance > user.income.monthlyAmount * 3) score += 30;
    else if (user.balance > user.income.monthlyAmount * 2) score += 20;
    else if (user.balance > user.income.monthlyAmount) score += 10;

    res.status(200).json({
      success: true,
      data: {
        score: Math.min(score, 100),
        breakdown: {
          incomeExpenseRatio: Math.round(incomeExpenseRatio * 100),
          savingsRate: Math.round(savingsRate * 100),
          monthlyIncome: user.income.monthlyAmount,
          monthlyExpense: user.expense.monthlyAmount,
          balance: user.balance
        }
      }
    });

  } catch (error) {
    console.error('Get Financial Health Score Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating financial health score',
      error: error.message
    });
  }
};

// ============================================
// GET INSIGHTS & RECOMMENDATIONS
// ============================================
exports.getInsights = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const insights = [];

    // Spending insight
    if (user.expense.monthlyAmount > user.income.monthlyAmount * 0.8) {
      insights.push({
        type: 'warning',
        title: 'High Spending Alert',
        description: `You're spending ${Math.round((user.expense.monthlyAmount / user.income.monthlyAmount) * 100)}% of your income. Consider reducing expenses.`,
        icon: '⚠️'
      });
    }

    // Savings insight
    const savingsRate = (user.income.monthlyAmount - user.expense.monthlyAmount) / user.income.monthlyAmount;
    if (savingsRate > 0.2) {
      insights.push({
        type: 'positive',
        title: 'Great Savings!',
        description: `You're saving ${Math.round(savingsRate * 100)}% of your income. Keep it up!`,
        icon: '💰'
      });
    }

    // Balance insight
    if (user.balance < user.income.monthlyAmount) {
      insights.push({
        type: 'warning',
        title: 'Low Emergency Fund',
        description: 'Your balance is less than one month of income. Consider building an emergency fund.',
        icon: '🚨'
      });
    }

    res.status(200).json({
      success: true,
      data: { insights }
    });

  } catch (error) {
    console.error('Get Insights Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insights',
      error: error.message
    });
  }
};
