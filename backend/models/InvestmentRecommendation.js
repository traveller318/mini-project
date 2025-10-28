const mongoose = require('mongoose');

const investmentRecommendationSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Recommendation Details
  name: {
    type: String,
    required: [true, 'Investment name is required'],
    trim: true,
    maxlength: [200, 'Investment name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Investment Type
  type: {
    type: String,
    required: [true, 'Investment type is required'],
    enum: {
      values: [
        'sip', // Systematic Investment Plan
        'mutual_fund',
        'stock',
        'etf', // Exchange Traded Fund
        'bond',
        'fd', // Fixed Deposit
        'crypto',
        'real_estate',
        'gold',
        'other'
      ],
      message: 'Invalid investment type'
    }
  },
  
  // Risk Level
  riskLevel: {
    type: String,
    required: [true, 'Risk level is required'],
    enum: {
      values: ['Low', 'Moderate', 'High'],
      message: 'Risk level must be Low, Moderate, or High'
    }
  },
  
  // Performance Metrics
  performance: {
    projectedReturn: {
      type: Number, // Percentage
      min: -100,
      max: 1000
    },
    annualGrowth: {
      type: Number, // Percentage
      min: -100,
      max: 1000
    },
    ytdGrowth: {
      type: Number, // Year to date growth percentage
      default: 0
    },
    historicalReturns: [{
      year: Number,
      returnPercentage: Number
    }]
  },
  
  // Confidence Score
  confidence: {
    type: Number,
    required: [true, 'Confidence score is required'],
    min: [0, 'Confidence cannot be less than 0'],
    max: [100, 'Confidence cannot be more than 100']
  },
  
  // Minimum Investment
  minInvestment: {
    type: Number,
    default: 0,
    min: [0, 'Minimum investment cannot be negative']
  },
  
  // Recommended Investment Amount
  recommendedAmount: {
    type: Number,
    default: null
  },
  
  // Visual Customization
  icon: {
    type: String,
    default: 'trending-up-outline'
  },
  color: {
    type: String,
    default: '#10B981'
  },
  imageUrl: {
    type: String,
    default: null
  },
  
  // Category
  category: {
    type: String,
    enum: ['equity', 'debt', 'hybrid', 'commodity', 'real_estate', 'cryptocurrency', 'alternative'],
    default: 'equity'
  },
  
  // Provider Information
  provider: {
    name: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null
    }
  },
  
  // Button Action
  buttonText: {
    type: String,
    default: 'Invest Now'
  },
  actionUrl: {
    type: String,
    default: null
  },
  
  // Reason for Recommendation
  reasons: [{
    type: String,
    trim: true
  }],
  
  // Pros and Cons
  pros: [{
    type: String,
    trim: true
  }],
  cons: [{
    type: String,
    trim: true
  }],
  
  // AI Insights
  aiInsights: [{
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Insight message cannot exceed 500 characters']
    },
    icon: {
      type: String,
      default: 'sparkles'
    },
    color: {
      type: String,
      default: '#3B82F6'
    },
    gradient: [{
      type: String
    }],
    priority: {
      type: Number,
      default: 0
    }
  }],
  
  // Recommendation Basis
  recommendationBasis: {
    userBalance: {
      type: Number,
      default: 0
    },
    userRiskProfile: {
      type: String,
      enum: ['Low', 'Moderate', 'High'],
      default: 'Moderate'
    },
    userGoals: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingGoal'
    }],
    spendingPattern: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    },
    ageGroup: {
      type: String,
      enum: ['18-25', '26-35', '36-45', '46-60', '60+'],
      default: null
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'invested', 'dismissed'],
    default: 'active'
  },
  
  // User Actions
  userActions: {
    viewed: {
      type: Boolean,
      default: false
    },
    viewedAt: {
      type: Date,
      default: null
    },
    clicked: {
      type: Boolean,
      default: false
    },
    clickedAt: {
      type: Date,
      default: null
    },
    invested: {
      type: Boolean,
      default: false
    },
    investedAt: {
      type: Date,
      default: null
    },
    investedAmount: {
      type: Number,
      default: null
    },
    dismissed: {
      type: Boolean,
      default: false
    },
    dismissedAt: {
      type: Date,
      default: null
    }
  },
  
  // Expiry
  expiresAt: {
    type: Date,
    default: function() {
      // Recommendations expire after 30 days by default
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      return expiryDate;
    }
  },
  
  // Metadata
  metadata: {
    algorithmVersion: {
      type: String,
      default: '1.0.0'
    },
    generatedBy: {
      type: String,
      enum: ['ai', 'manual', 'hybrid'],
      default: 'ai'
    },
    dataSourceDate: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
investmentRecommendationSchema.index({ userId: 1, status: 1 });
investmentRecommendationSchema.index({ userId: 1, riskLevel: 1 });
investmentRecommendationSchema.index({ userId: 1, createdAt: -1 });
investmentRecommendationSchema.index({ expiresAt: 1 });

const InvestmentRecommendation = mongoose.model('InvestmentRecommendation', investmentRecommendationSchema);

module.exports = InvestmentRecommendation;
