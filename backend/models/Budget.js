const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Budget Details
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxlength: [100, 'Budget name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  
  // Category
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'Food', 'Food & Drink', 'Transport', 'Shopping', 'Entertainment',
        'Bills', 'Bills & Utilities', 'Health', 'Education', 'Travel',
        'Groceries', 'Rent', 'Overall', 'Others'
      ],
      message: 'Invalid category'
    }
  },
  
  // Amount Limits
  limit: {
    type: Number,
    required: [true, 'Budget limit is required'],
    min: [0, 'Budget limit cannot be negative']
  },
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative'],
    set: function(val) {
      // Ensure spent is never negative
      return Math.max(0, val || 0);
    }
  },
  remaining: {
    type: Number,
    default: function() {
      return this.limit - this.spent;
    }
  },
  
  // Time Period
  period: {
    type: String,
    required: [true, 'Budget period is required'],
    enum: {
      values: ['weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      message: 'Invalid period'
    },
    default: 'monthly'
  },
  
  // Date Range
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: function() {
      return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    }
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    default: function() {
      return new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    }
  },
  
  // Alerts
  alerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    thresholds: [{
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      triggered: {
        type: Boolean,
        default: false
      },
      triggeredAt: {
        type: Date,
        default: null
      }
    }],
    lastAlertSent: {
      type: Date,
      default: null
    }
  },
  
  // Rollover Settings
  rollover: {
    enabled: {
      type: Boolean,
      default: false
    },
    carryForwardUnspent: {
      type: Boolean,
      default: false
    },
    previousPeriodRemainder: {
      type: Number,
      default: 0
    }
  },
  
  // Visual Customization
  color: {
    type: String,
    default: '#3B82F6'
  },
  icon: {
    type: String,
    default: 'wallet-outline'
  },
  
  // Analytics
  analytics: {
    averageSpending: {
      type: Number,
      default: 0
    },
    spendingVelocity: { // Amount spent per day
      type: Number,
      default: 0
    },
    projectedSpend: {
      type: Number,
      default: 0
    },
    comparisonToPrevious: {
      percentage: {
        type: Number,
        default: 0
      },
      trend: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable'],
        default: 'stable'
      }
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'exceeded', 'completed', 'paused'],
    default: 'active'
  },
  
  // Recurrence
  isRecurring: {
    type: Boolean,
    default: true
  },
  recurringSettings: {
    autoRenew: {
      type: Boolean,
      default: true
    },
    adjustmentFactor: {
      type: Number,
      default: 0 // Percentage to increase/decrease on renewal
    }
  },
  
  // Notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
budgetSchema.index({ userId: 1, status: 1 });
budgetSchema.index({ userId: 1, category: 1 });
budgetSchema.index({ userId: 1, startDate: 1, endDate: 1 });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
