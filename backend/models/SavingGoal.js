const mongoose = require('mongoose');

const savingGoalSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Goal Details
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true,
    maxlength: [100, 'Goal name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  
  // Target Amount
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be greater than 0']
  },
  
  // Current Amount
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  
  // Monthly Contribution
  monthlyContribution: {
    type: Number,
    required: [true, 'Monthly contribution is required'],
    min: [0, 'Monthly contribution cannot be negative']
  },
  
  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  estimatedCompletion: {
    type: Date,
    required: [true, 'Estimated completion date is required']
  },
  actualCompletion: {
    type: Date,
    default: null
  },
  
  // Priority & Status
  isMainGoal: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
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
  imageUrl: {
    type: String,
    default: null
  },
  
  // Category
  category: {
    type: String,
    enum: ['emergency_fund', 'vacation', 'vehicle', 'home', 'education', 'investment', 'wedding', 'electronics', 'other'],
    default: 'other'
  },
  
  // Contribution History
  contributions: [{
    amount: {
      type: Number,
      required: true,
      min: [0, 'Contribution amount cannot be negative']
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      maxlength: [200, 'Note cannot exceed 200 characters']
    },
    source: {
      type: String,
      enum: ['manual', 'automatic', 'bonus', 'gift'],
      default: 'manual'
    }
  }],
  
  // Automatic Contribution Settings
  automaticContribution: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'custom'],
      default: 'monthly'
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    nextContributionDate: {
      type: Date,
      default: null
    }
  },
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['contribution', 'milestone', 'completion'],
      default: 'contribution'
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'custom'],
      default: 'monthly'
    },
    enabled: {
      type: Boolean,
      default: true
    },
    lastSentAt: {
      type: Date,
      default: null
    }
  }],
  
  // Milestones
  milestones: [{
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      required: true
    },
    reached: {
      type: Boolean,
      default: false
    },
    reachedAt: {
      type: Date,
      default: null
    },
    title: {
      type: String,
      default: ''
    }
  }],
  
  // Analytics
  analytics: {
    totalContributed: {
      type: Number,
      default: 0
    },
    contributionCount: {
      type: Number,
      default: 0
    },
    averageMonthlyContribution: {
      type: Number,
      default: 0
    },
    projectedCompletionDate: {
      type: Date,
      default: null
    },
    daysToCompletion: {
      type: Number,
      default: 0
    },
    monthsToCompletion: {
      type: Number,
      default: 0
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
savingGoalSchema.index({ userId: 1, status: 1 });
savingGoalSchema.index({ userId: 1, isMainGoal: 1 });
savingGoalSchema.index({ userId: 1, createdAt: -1 });

const SavingGoal = mongoose.model('SavingGoal', savingGoalSchema);

module.exports = SavingGoal;
