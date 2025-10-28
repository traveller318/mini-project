// Export all models from a single file for easy importing

const User = require('./User');
const Transaction = require('./Transaction');
const SavingGoal = require('./SavingGoal');
const Subscription = require('./Subscription');
const Budget = require('./Budget');
const Notification = require('./Notification');
const VoiceInteraction = require('./VoiceInteraction');
const InvestmentRecommendation = require('./InvestmentRecommendation');

module.exports = {
  User,
  Transaction,
  SavingGoal,
  Subscription,
  Budget,
  Notification,
  VoiceInteraction,
  InvestmentRecommendation
};
