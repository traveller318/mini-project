const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
}

// ============================================
// GET EXPENSE DISTRIBUTION (PIE CHART)
// ============================================
exports.getExpenseDistribution = async (req, res) => {
  try {
    const userId = req.user._id;
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

    // Helper function to get consistent colors for categories
    const getCategoryColor = (category) => {
      const colorMap = {
        'Food': '#FF6B6B',
        'Food & Drink': '#FF6B6B',
        'Shopping': '#8B5CF6',
        'Transport': '#F97316',
        'Entertainment': '#F59E0B',
        'Utilities': '#06B6D4',
        'Bills': '#6366F1',
        'Bills & Utilities': '#6366F1',
        'Health': '#EC4899',
        'Education': '#14B8A6',
        'Travel': '#10B981',
        'Groceries': '#84CC16',
        'Rent': '#A855F7',
        'Salary': '#22C55E',
        'Business': '#3B82F6',
        'Investment': '#06B6D4',
        'Freelance': '#8B5CF6',
        'Gift': '#EC4899',
        'Work': '#22C55E',
        'Other': '#6B7280',
        'Others': '#6B7280',
      };
      return colorMap[category] || '#A0A0A0';
    };

    // Group by category
    const categoryTotals = {};
    let totalExpense = 0;

    transactions.forEach(txn => {
      if (!categoryTotals[txn.category]) {
        categoryTotals[txn.category] = {
          name: txn.category,
          amount: 0,
          color: getCategoryColor(txn.category)
        };
      }
      categoryTotals[txn.category].amount += txn.amount;
      totalExpense += txn.amount;
    });

    // Calculate percentages
    const expenseData = totalExpense > 0 
      ? Object.values(categoryTotals).map(cat => ({
          ...cat,
          percentage: Math.round((cat.amount / totalExpense) * 100)
        }))
      : [];

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
    const userId = req.user._id;
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

    // Check if there's sufficient data
    const hasData = progressionData.some(item => item.income > 0);
    const insufficientData = !hasData;

    res.status(200).json({
      success: true,
      data: { progressionData, insufficientData }
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
    const userId = req.user._id;
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
    const userId = req.user._id;
    const { months = 6, categories } = req.query;

    const categoryList = categories 
      ? categories.split(',') 
      : ['Food & Drink', 'Shopping', 'Transport', 'Entertainment'];

    const trendData = [];
    const now = new Date();
    let totalAmount = 0;

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

        const categoryAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
        monthData[category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')] = categoryAmount;
        totalAmount += categoryAmount;
      }

      trendData.push(monthData);
    }

    // Check if there's sufficient data
    const insufficientData = totalAmount === 0;

    res.status(200).json({
      success: true,
      data: { trendData, categories: categoryList, insufficientData }
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
    const userId = req.user._id;
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
    const userId = req.user._id;
    const user = await User.findById(userId);

    console.log('📊 Fetching insights for user:', userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('👤 User financial data:', {
      monthlyIncome: user.income.monthlyAmount,
      monthlyExpense: user.expense.monthlyAmount,
      balance: user.balance
    });

    // Check if user has sufficient data
    const hasData = user.income.monthlyAmount > 0 || user.expense.monthlyAmount > 0;

    if (!hasData) {
      console.log('⚠️ User has no financial data yet');
      // Return a welcome insight when no data exists
      const insights = [{
        type: 'neutral',
        title: 'Welcome to Financial Insights',
        description: 'Start adding your income and expense transactions to get personalized insights about your financial health, spending patterns, and savings opportunities.',
        icon: '👋'
      }];
      
      return res.status(200).json({
        success: true,
        data: { insights }
      });
    }

    // Fetch recent transactions for context
    const recentTransactions = await Transaction.find({
      userId,
      isDeleted: false
    })
    .sort({ date: -1 })
    .limit(50);

    console.log(`📝 Found ${recentTransactions.length} recent transactions`);

    // Calculate additional metrics
    const savingsRate = user.income.monthlyAmount > 0 
      ? ((user.income.monthlyAmount - user.expense.monthlyAmount) / user.income.monthlyAmount) * 100
      : 0;

    const expenseRatio = user.income.monthlyAmount > 0
      ? (user.expense.monthlyAmount / user.income.monthlyAmount) * 100
      : 0;

    // Calculate category-wise expenses
    const categoryExpenses = {};
    recentTransactions
      .filter(txn => txn.type === 'expense')
      .forEach(txn => {
        if (!categoryExpenses[txn.category]) {
          categoryExpenses[txn.category] = 0;
        }
        categoryExpenses[txn.category] += txn.amount;
      });

    const topCategories = Object.entries(categoryExpenses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));

    console.log('📈 Financial metrics:', {
      savingsRate: savingsRate.toFixed(2) + '%',
      expenseRatio: expenseRatio.toFixed(2) + '%',
      topCategories: topCategories.map(c => c.category).join(', ')
    });

    // Generate insights using Gemini AI if available
    let insights = [];
    
    if (genAI) {
      try {
        console.log('🤖 Attempting to generate insights with Gemini AI...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
You are a financial advisor AI. Based on the following user financial data, generate 3-4 brief, actionable insights.

USER FINANCIAL DATA:
- Monthly Income: ₹${user.income.monthlyAmount}
- Monthly Expenses: ₹${user.expense.monthlyAmount}
- Current Balance: ₹${user.balance}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Expense to Income Ratio: ${expenseRatio.toFixed(1)}%
- Top Spending Categories: ${topCategories.map(cat => `${cat.category} (₹${cat.amount})`).join(', ')}

GUIDELINES:
1. Keep each insight BRIEF (1-2 sentences max, under 120 characters for description)
2. Be specific and actionable
3. Use appropriate emojis for icons
4. Mix positive reinforcement with constructive advice
5. Focus on practical tips

OUTPUT FORMAT (JSON only, no markdown):
{
  "insights": [
    {
      "type": "positive/negative/warning/neutral",
      "title": "Short Title (3-5 words)",
      "description": "Brief actionable insight (max 120 chars)",
      "icon": "single emoji"
    }
  ]
}

TYPES:
- positive: Good financial behavior (green)
- negative: Concerning issues (red)
- warning: Areas needing attention (orange)
- neutral: General information (blue)

Generate 3-4 insights now:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean the response
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
          const parsedData = JSON.parse(text);
          if (parsedData.insights && Array.isArray(parsedData.insights)) {
            insights = parsedData.insights;
            console.log(`✅ Gemini generated ${insights.length} insights`);
          }
        } catch (parseError) {
          console.error('Failed to parse Gemini insights response:', parseError.message);
          // Fall back to rule-based insights
          insights = generateRuleBasedInsights(user, savingsRate, expenseRatio, topCategories);
        }
      } catch (geminiError) {
        console.error('Gemini API Error:', geminiError.message);
        // Fall back to rule-based insights
        insights = generateRuleBasedInsights(user, savingsRate, expenseRatio, topCategories);
      }
    } else {
      console.log('⚠️ Gemini AI not available, using rule-based insights');
      // Fall back to rule-based insights if Gemini is not available
      insights = generateRuleBasedInsights(user, savingsRate, expenseRatio, topCategories);
    }

    console.log(`📤 Sending ${insights.length} insights to client`);
    
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

// Helper function for rule-based insights (fallback)
function generateRuleBasedInsights(user, savingsRate, expenseRatio, topCategories) {
  const insights = [];

  console.log('🔍 Generating rule-based insights...');
  console.log('User data:', { 
    income: user.income.monthlyAmount, 
    expense: user.expense.monthlyAmount,
    balance: user.balance,
    savingsRate,
    expenseRatio,
    topCategories: topCategories.length
  });

  // Spending insight
  if (expenseRatio > 80) {
    insights.push({
      type: 'warning',
      title: 'High Spending Alert',
      description: `You're spending ${expenseRatio.toFixed(0)}% of income. Try to reduce expenses.`,
      icon: '⚠️'
    });
  } else if (expenseRatio < 50 && expenseRatio > 0) {
    insights.push({
      type: 'positive',
      title: 'Controlled Spending',
      description: `Great job! Only ${expenseRatio.toFixed(0)}% of income spent this month.`,
      icon: '✅'
    });
  }

  // Savings insight
  if (savingsRate > 30) {
    insights.push({
      type: 'positive',
      title: 'Excellent Savings!',
      description: `You're saving ${savingsRate.toFixed(0)}% of income. Outstanding!`,
      icon: '💰'
    });
  } else if (savingsRate > 20) {
    insights.push({
      type: 'positive',
      title: 'Great Savings!',
      description: `You're saving ${savingsRate.toFixed(0)}% of income. Keep it up!`,
      icon: '💰'
    });
  } else if (savingsRate < 10 && savingsRate > 0) {
    insights.push({
      type: 'warning',
      title: 'Low Savings Rate',
      description: `Only ${savingsRate.toFixed(0)}% savings. Aim for at least 20%.`,
      icon: '📉'
    });
  } else if (savingsRate < 0) {
    insights.push({
      type: 'negative',
      title: 'Overspending Alert',
      description: `Expenses exceed income. Review your budget urgently.`,
      icon: '🚨'
    });
  }

  // Balance insight
  if (user.income.monthlyAmount > 0) {
    const monthsOfIncome = user.balance / user.income.monthlyAmount;
    
    if (monthsOfIncome < 1) {
      insights.push({
        type: 'warning',
        title: 'Build Emergency Fund',
        description: 'Your balance is less than one month of income. Start saving!',
        icon: '🚨'
      });
    } else if (monthsOfIncome >= 3) {
      insights.push({
        type: 'positive',
        title: 'Strong Emergency Fund',
        description: `You have ${Math.round(monthsOfIncome)} months of income saved!`,
        icon: '🛡️'
      });
    }
  }

  // Category-specific insight
  if (topCategories.length > 0) {
    const topCategory = topCategories[0];
    const categoryPercentage = user.expense.monthlyAmount > 0 
      ? (topCategory.amount / user.expense.monthlyAmount) * 100 
      : 0;
    
    if (categoryPercentage > 40) {
      insights.push({
        type: 'warning',
        title: `${topCategory.category} Dominant`,
        description: `${categoryPercentage.toFixed(0)}% of expenses. Consider reducing this category.`,
        icon: '📊'
      });
    } else if (categoryPercentage > 30) {
      insights.push({
        type: 'neutral',
        title: `${topCategory.category} Spending`,
        description: `${categoryPercentage.toFixed(0)}% of expenses. Monitor this category closely.`,
        icon: '📊'
      });
    }
  }

  // If still no insights, add a generic positive one
  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      title: 'Start Your Journey',
      description: 'Add more transactions to get detailed insights about your finances!',
      icon: '🚀'
    });
  }

  console.log(`✅ Generated ${insights.length} rule-based insights`);
  return insights;
}
