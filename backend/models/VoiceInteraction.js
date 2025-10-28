const mongoose = require('mongoose');

const voiceInteractionSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Audio Recording Details
  recording: {
    uri: {
      type: String,
      required: [true, 'Recording URI is required']
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    format: {
      type: String,
      enum: ['wav', 'mp3', 'aac', 'ogg'],
      default: 'wav'
    },
    fileSize: {
      type: Number, // in bytes
      default: 0
    },
    quality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high'
    }
  },
  
  // Transcription
  transcription: {
    text: {
      type: String,
      default: ''
    },
    confidence: {
      type: Number, // 0 to 100
      default: 0
    },
    language: {
      type: String,
      default: 'en-US'
    },
    processingTime: {
      type: Number, // in milliseconds
      default: 0
    }
  },
  
  // Intent Recognition
  intent: {
    type: {
      type: String,
      enum: [
        'add_transaction',
        'view_transactions',
        'view_balance',
        'set_budget',
        'view_goals',
        'add_goal',
        'view_subscriptions',
        'view_insights',
        'get_advice',
        'other',
        'unknown'
      ],
      default: 'unknown'
    },
    confidence: {
      type: Number,
      default: 0
    },
    entities: [{
      type: {
        type: String,
        enum: ['amount', 'category', 'date', 'merchant', 'goal_name', 'time_period']
      },
      value: mongoose.Schema.Types.Mixed,
      confidence: Number
    }]
  },
  
  // AI Response
  response: {
    text: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['information', 'confirmation', 'question', 'error', 'success'],
      default: 'information'
    },
    actionTaken: {
      type: String,
      enum: ['none', 'transaction_created', 'goal_created', 'budget_set', 'data_retrieved'],
      default: 'none'
    },
    relatedDocuments: [{
      documentType: {
        type: String,
        enum: ['Transaction', 'SavingGoal', 'Subscription', 'Budget']
      },
      documentId: {
        type: mongoose.Schema.Types.ObjectId
      }
    }]
  },
  
  // Quick Questions (predefined queries)
  isQuickQuestion: {
    type: Boolean,
    default: false
  },
  quickQuestionType: {
    type: String,
    enum: ['spending_report', 'budget_status', 'recent_transactions', 'upcoming_bills', null],
    default: null
  },
  
  // Processing Status
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Error Information
  error: {
    hasError: {
      type: Boolean,
      default: false
    },
    errorType: {
      type: String,
      enum: ['transcription_failed', 'intent_not_recognized', 'action_failed', 'other'],
      default: null
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  
  // Feedback
  userFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    wasHelpful: {
      type: Boolean,
      default: null
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: ''
    }
  },
  
  // Context
  context: {
    previousInteractionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoiceInteraction',
      default: null
    },
    sessionId: {
      type: String,
      default: null
    },
    deviceInfo: {
      type: String,
      default: ''
    },
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Metadata
  metadata: {
    modelVersion: {
      type: String,
      default: '1.0.0'
    },
    processingEngine: {
      type: String,
      enum: ['google', 'azure', 'aws', 'custom'],
      default: 'custom'
    },
    totalProcessingTime: {
      type: Number, // in milliseconds
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
voiceInteractionSchema.index({ userId: 1, createdAt: -1 });
voiceInteractionSchema.index({ userId: 1, 'intent.type': 1 });
voiceInteractionSchema.index({ userId: 1, processingStatus: 1 });
voiceInteractionSchema.index({ 'context.sessionId': 1 });

const VoiceInteraction = mongoose.model('VoiceInteraction', voiceInteractionSchema);

module.exports = VoiceInteraction;
