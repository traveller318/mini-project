const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Subscription Details
  name: {
    type: String,
    required: [true, 'Subscription name is required'],
    trim: true,
    maxlength: [100, 'Subscription name cannot exceed 100 characters']
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
      values: ['Entertainment', 'Bills', 'Utilities', 'EMI', 'Loans', 'Shopping', 'Other'],
      message: 'Invalid category'
    }
  },
  
  // Amount
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  
  // Frequency
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: {
      values: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      message: 'Invalid frequency'
    },
    default: 'monthly'
  },
  
  // Custom frequency (in days)
  customFrequencyDays: {
    type: Number,
    min: [1, 'Custom frequency must be at least 1 day'],
    default: null
  },
  
  // Dates
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null // null means no end date (ongoing)
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  nextDueDate: {
    type: Date,
    default: null
  },
  
  // Days Until Due (calculated field)
  daysUntilDue: {
    type: Number,
    default: 0
  },
  
  // Visual Customization
  icon: {
    type: String,
    default: 'ellipsis-horizontal'
  },
  logo: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  
  // Auto-pay Settings
  autoPay: {
    enabled: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_account', 'upi', 'wallet'],
      default: null
    },
    paymentMethodId: {
      type: String,
      default: null
    }
  },
  
  // Reminders
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    daysBefore: {
      type: Number,
      default: 3,
      min: [0, 'Days before cannot be negative']
    },
    lastReminderSent: {
      type: Date,
      default: null
    }
  },
  
  // Payment History
  paymentHistory: [{
    amount: {
      type: Number,
      required: true
    },
    paidOn: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'success'
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    },
    note: {
      type: String,
      maxlength: [200, 'Note cannot exceed 200 characters']
    }
  }],
  
  // Billing Information
  billingInfo: {
    provider: {
      type: String,
      default: null
    },
    accountNumber: {
      type: String,
      default: null
    },
    customerId: {
      type: String,
      default: null
    },
    website: {
      type: String,
      default: null
    },
    contactNumber: {
      type: String,
      default: null
    }
  },
  
  // Analytics
  analytics: {
    totalPaid: {
      type: Number,
      default: 0
    },
    paymentCount: {
      type: Number,
      default: 0
    },
    averagePayment: {
      type: Number,
      default: 0
    },
    lastPaymentDate: {
      type: Date,
      default: null
    },
    missedPayments: {
      type: Number,
      default: 0
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active'
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
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, dueDate: 1 });
subscriptionSchema.index({ userId: 1, nextDueDate: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
