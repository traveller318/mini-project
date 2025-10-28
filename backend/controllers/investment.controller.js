const User = require('../models/User');

// Mock investment data - in production, this would come from a financial API
const investments = {
  Low: [
    {
      id: 1,
      name: 'HDFC Balanced Advantage SIP',
      description: 'Best suited for low-risk investors',
      performance: 'Projected 8% annual growth',
      buttonText: 'Start SIP',
      confidence: 85,
      icon: 'trending-up-outline',
      color: '#10b981',
      type: 'mutual_fund',
      minInvestment: 500
    },
    {
      id: 2,
      name: 'SBI Debt Fund Plus',
      description: 'Stable returns with minimal risk',
      performance: '+5.2% growth YTD',
      buttonText: 'Invest Now',
      confidence: 90,
      icon: 'shield-checkmark-outline',
      color: '#3b82f6',
      type: 'mutual_fund',
      minInvestment: 1000
    },
    {
      id: 3,
      name: 'Axis Liquid Fund',
      description: 'High liquidity for emergency funds',
      performance: 'Projected 4% annual return',
      buttonText: 'Start SIP',
      confidence: 78,
      icon: 'water-outline',
      color: '#06b6d4',
      type: 'mutual_fund',
      minInvestment: 500
    }
  ],
  Moderate: [
    {
      id: 4,
      name: 'HDFC Mid Cap Opportunities',
      description: 'Best suited for moderate-risk investors',
      performance: 'Projected 12% annual growth',
      buttonText: 'Invest Now',
      confidence: 82,
      icon: 'analytics-outline',
      color: '#f59e0b',
      type: 'mutual_fund',
      minInvestment: 5000
    },
    {
      id: 5,
      name: 'JSW Infrastructure Ltd.',
      description: 'Strong fundamentals in infrastructure',
      performance: '+18% growth in last 6 months',
      buttonText: 'Buy Stock',
      confidence: 75,
      icon: 'business-outline',
      color: '#8b5cf6',
      type: 'stock',
      minInvestment: 10000
    },
    {
      id: 6,
      name: 'Kotak Emerging Equity Fund',
      description: 'Diversified equity portfolio',
      performance: 'Projected 15% annual growth',
      buttonText: 'Start SIP',
      confidence: 88,
      icon: 'globe-outline',
      color: '#10b981',
      type: 'mutual_fund',
      minInvestment: 3000
    }
  ],
  High: [
    {
      id: 7,
      name: 'Ethereum (ETH)',
      description: 'High-potential cryptocurrency investment',
      performance: 'ROI +26% YTD',
      buttonText: 'Buy ETH',
      confidence: 70,
      icon: 'logo-ethereum',
      color: '#8b5cf6',
      type: 'crypto',
      minInvestment: 1000
    },
    {
      id: 8,
      name: 'Motilal Oswal Nasdaq 100 ETF',
      description: 'Global tech exposure with high returns',
      performance: 'Projected 18% annual growth',
      buttonText: 'Invest Now',
      confidence: 85,
      icon: 'rocket-outline',
      color: '#ef4444',
      type: 'etf',
      minInvestment: 5000
    },
    {
      id: 9,
      name: 'HDFC Small Cap Fund',
      description: 'High-risk, high-return equity fund',
      performance: '+22% growth in last year',
      buttonText: 'Start SIP',
      confidence: 79,
      icon: 'diamond-outline',
      color: '#f59e0b',
      type: 'mutual_fund',
      minInvestment: 5000
    }
  ]
};

// ============================================
// GET INVESTMENT RECOMMENDATIONS
// ============================================
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const riskProfile = user.riskProfile || 'Moderate';
    const balance = user.balance || 0;

    // Get recommendations based on risk profile
    let recommendations = [...investments[riskProfile]];

    // Filter by available balance
    recommendations = recommendations.filter(inv => inv.minInvestment <= balance);

    // Add personalized insights
    const insights = generateInsights(balance, riskProfile, user);

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        riskProfile,
        balance,
        insights
      }
    });

  } catch (error) {
    console.error('Get Investment Recommendations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching investment recommendations',
      error: error.message
    });
  }
};

// ============================================
// GET PERSONALIZED INSIGHTS
// ============================================
exports.getPersonalizedInsights = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const insights = generateInsights(user.balance, user.riskProfile, user);

    res.status(200).json({
      success: true,
      data: { insights }
    });

  } catch (error) {
    console.error('Get Personalized Insights Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching personalized insights',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTION: GENERATE INSIGHTS
// ============================================
function generateInsights(balance, riskProfile, user) {
  const insights = [
    {
      message: 'Your portfolio is 70% in equities. Consider diversifying with bonds.',
      icon: 'pie-chart-outline',
      color: '#f59e0b',
      gradient: ['#f59e0b', '#d97706'],
      type: 'diversification'
    },
    {
      message: "You're on track for 14% projected annual growth with your current investments.",
      icon: 'trending-up-outline',
      color: '#3b82f6',
      gradient: ['#3b82f6', '#1d4ed8'],
      type: 'growth'
    }
  ];

  // Balance-specific insights
  if (balance > 50000) {
    insights.push({
      message: `With ₹${balance.toLocaleString()}, you can access premium investment options with higher returns.`,
      icon: 'diamond-outline',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#7c3aed'],
      type: 'premium'
    });
  } else if (balance > 10000) {
    insights.push({
      message: `You have ₹${balance.toLocaleString()} surplus. Consider auto-investing in diversified funds.`,
      icon: 'checkmark-circle-outline',
      color: '#10b981',
      gradient: ['#10b981', '#059669'],
      type: 'balanced'
    });
  } else {
    insights.push({
      message: `You have ₹${balance.toLocaleString()} saved. Start with low-risk SIPs to build wealth steadily.`,
      icon: 'information-circle-outline',
      color: '#3b82f6',
      gradient: ['#3b82f6', '#1d4ed8'],
      type: 'starter'
    });
  }

  // Risk-specific insights
  if (riskProfile === 'Low') {
    insights.push({
      message: 'As a conservative investor, consider adding 20% mid-cap funds for better growth.',
      icon: 'shield-checkmark-outline',
      color: '#10b981',
      gradient: ['#10b981', '#059669'],
      type: 'risk_suggestion'
    });
  } else if (riskProfile === 'High') {
    insights.push({
      message: 'Your aggressive approach could yield 18-22% returns, but ensure emergency funds.',
      icon: 'rocket-outline',
      color: '#ef4444',
      gradient: ['#ef4444', '#dc2626'],
      type: 'risk_warning'
    });
  }

  // Savings rate insight
  const savingsRate = user.income.monthlyAmount > 0
    ? ((user.income.monthlyAmount - user.expense.monthlyAmount) / user.income.monthlyAmount)
    : 0;

  if (savingsRate > 0.2) {
    insights.push({
      message: `Great Progress! You're saving ${Math.round(savingsRate * 100)}% of income - consistent saver!`,
      icon: 'trophy',
      color: '#10b981',
      gradient: ['#10b981', '#059669'],
      type: 'achievement'
    });
  }

  return insights;
}

// ============================================
// UPDATE RISK PROFILE
// ============================================
exports.updateRiskProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { riskProfile } = req.body;

    if (!['Low', 'Moderate', 'High'].includes(riskProfile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid risk profile. Must be Low, Moderate, or High'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { riskProfile },
      { new: true }
    ).select('-password');

    // Get new recommendations
    const recommendations = investments[riskProfile].filter(
      inv => inv.minInvestment <= user.balance
    );

    res.status(200).json({
      success: true,
      message: 'Risk profile updated successfully',
      data: {
        riskProfile: user.riskProfile,
        recommendations
      }
    });

  } catch (error) {
    console.error('Update Risk Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating risk profile',
      error: error.message
    });
  }
};
