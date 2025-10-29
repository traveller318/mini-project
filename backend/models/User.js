const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Authentication Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  
  // Profile Information
  profileImage: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  
  // Financial Information
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  cardNumber: {
    type: String,
    default: null
  },
  
  // Income & Expense Summary
  income: {
    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    monthlyAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    weeklyAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  expense: {
    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    monthlyAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    weeklyAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  
  // Spending by Category
  spendingByCategory: [{
    name: {
      type: String,
      required: true,
      enum: ['Food & Drink', 'Shopping', 'Transport', 'Entertainment', 'Bills & Utilities', 'Health', 'Education', 'Travel', 'Groceries', 'Rent', 'Work', 'Transfer', 'Others']
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    color: {
      type: String,
      default: '#A0A0A0'
    }
  }],
  
  // Risk Profile for Investment Recommendations
  riskProfile: {
    type: String,
    enum: ['Low', 'Moderate', 'High'],
    default: 'Moderate'
  },
  
  // Preferences
  preferences: {
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP']
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      billReminders: {
        type: Boolean,
        default: true
      },
      goalReminders: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  
  // Password Reset
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // Session Management
  lastLogin: {
    type: Date,
    default: null
  },
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    deviceInfo: String
  }],
  
  // Subscription Status
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },
  subscriptionExpiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
// Note: email index is already created via 'unique: true' in schema definition
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;