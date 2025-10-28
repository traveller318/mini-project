const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Transaction Type
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    }
  },
  
  // Transaction Details
  name: {
    type: String,
    required: [true, 'Transaction name is required'],
    trim: true,
    maxlength: [200, 'Transaction name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  
  // Amount
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  
  // Category
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        // Expense Categories
        'Food', 'Food & Drink', 'Transport', 'Shopping', 'Entertainment', 
        'Bills', 'Bills & Utilities', 'Health', 'Education', 'Travel', 
        'Groceries', 'Rent', 'Other', 'Others',
        // Income Categories
        'Salary', 'Business', 'Investment', 'Freelance', 'Gift', 'Work',
        // Transfer
        'Transfer'
      ],
      message: 'Invalid category'
    }
  },
  
  // Icon & Color
  icon: {
    type: String,
    default: 'ellipsis-horizontal-outline'
  },
  color: {
    type: String,
    default: '#A0A0A0'
  },
  
  // Date & Time
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  timestamp: {
    type: String,
    default: function() {
      return new Date().toISOString();
    }
  },
  
  // Recurring Transaction
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'custom'],
      default: null
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    nextOccurrence: {
      type: Date,
      default: null
    }
  },
  
  // Receipt/Image Information (for scanned receipts)
  receipt: {
    hasReceipt: {
      type: Boolean,
      default: false
    },
    imageUri: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number,
      default: null
    },
    scannedData: {
      merchantName: String,
      totalAmount: Number,
      items: [{
        name: String,
        quantity: Number,
        price: Number
      }],
      taxAmount: Number,
      date: Date,
      ocrConfidence: Number
    }
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'wallet', 'other'],
    default: 'other'
  },
  
  // Location (optional)
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Tags for better organization
  tags: [{
    type: String,
    trim: true
  }],
  
  // Notes
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },
  
  // Status
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'failed'],
    default: 'completed'
  },
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'scanned', 'imported', 'recurring'],
      default: 'manual'
    },
    deviceInfo: String,
    ipAddress: String
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
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, category: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ isRecurring: 1, 'recurringDetails.nextOccurrence': 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
