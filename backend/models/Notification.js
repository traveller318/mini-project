const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Notification Type
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: {
      values: [
        'transaction_added',
        'budget_alert',
        'budget_exceeded',
        'goal_milestone',
        'goal_achieved',
        'subscription_due',
        'subscription_overdue',
        'bill_reminder',
        'investment_opportunity',
        'spending_insight',
        'achievement',
        'system',
        'other'
      ],
      message: 'Invalid notification type'
    }
  },
  
  // Content
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Visual Elements
  icon: {
    type: String,
    default: 'notifications-outline'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  imageUrl: {
    type: String,
    default: null
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Related Document
  relatedDocument: {
    documentType: {
      type: String,
      enum: ['Transaction', 'Budget', 'SavingGoal', 'Subscription', 'InvestmentRecommendation', null],
      default: null
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  
  // Action
  action: {
    type: {
      type: String,
      enum: ['none', 'view', 'navigate', 'external_link'],
      default: 'none'
    },
    label: {
      type: String,
      default: ''
    },
    route: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: null
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  
  // Delivery
  channels: {
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: {
        type: Date,
        default: null
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: false
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: {
        type: Date,
        default: null
      }
    },
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: {
        type: Date,
        default: null
      }
    }
  },
  
  // Scheduling
  scheduledFor: {
    type: Date,
    default: null
  },
  
  // Expiry
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Group (for batch notifications)
  group: {
    type: String,
    default: null
  },
  
  // Metadata
  metadata: {
    category: String,
    tags: [String],
    customData: mongoose.Schema.Types.Mixed
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
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, isDeleted: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
