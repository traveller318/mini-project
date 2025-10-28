# Quick Reference Guide - MongoDB Schemas

## 🚀 Quick Start

### Import All Models
```javascript
const {
  User, Transaction, SavingGoal, Subscription,
  Budget, Notification, VoiceInteraction, InvestmentRecommendation
} = require('./models');
```

---

## 📌 Common Operations

### User Operations

```javascript
// Create new user
const user = new User({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securepassword'
});
await user.save(); // Password auto-hashed

// Login
const user = await User.findOne({ email }).select('+password');
const isMatch = await user.comparePassword(candidatePassword);

// Update spending stats
await user.updateSpendingStats();

// Get user with relationships
const user = await User.findById(userId)
  .populate('goals')
  .populate('transactions')
  .populate('subscriptions');
```

### Transaction Operations

```javascript
// Create transaction
const transaction = new Transaction({
  userId,
  type: 'expense',
  name: 'Lunch',
  amount: 450,
  category: 'Food & Drink',
  date: new Date()
});
await transaction.save(); // Auto-updates user stats

// Get by category
const transactions = await Transaction.getByCategory(userId, 'Food & Drink');

// Get by date range
const transactions = await Transaction.getByDateRange(
  userId,
  new Date('2025-10-01'),
  new Date('2025-10-31')
);

// Monthly summary
const summary = await Transaction.getMonthlySummary(userId, 2025, 10);
// Returns: { income, expense, netSavings, transactionCount }

// Soft delete
await transaction.softDelete();
```

### Saving Goal Operations

```javascript
// Create goal
const goal = new SavingGoal({
  userId,
  name: 'Vacation Fund',
  targetAmount: 50000,
  currentAmount: 0,
  monthlyContribution: 2000,
  estimatedCompletion: new Date('2026-01-01')
});
await goal.save();

// Add contribution
await goal.addContribution(2000, 'Monthly savings', 'manual');

// Set as main goal
await goal.setAsMainGoal();

// Get active goals
const goals = await SavingGoal.getActiveGoals(userId);

// Get total savings
const totalSavings = await SavingGoal.getTotalSavings(userId);
```

### Subscription Operations

```javascript
// Create subscription
const subscription = new Subscription({
  userId,
  name: 'Netflix',
  category: 'Entertainment',
  amount: 649,
  frequency: 'monthly',
  dueDate: new Date('2025-11-15')
});
await subscription.save();

// Record payment
await subscription.recordPayment(649, 'success', transactionId);

// Get upcoming subscriptions (next 7 days)
const upcoming = await Subscription.getUpcoming(userId, 7);

// Get overdue subscriptions
const overdue = await Subscription.getOverdue(userId);

// Total monthly recurring
const total = await Subscription.getTotalMonthlyRecurring(userId);

// Pause/Resume
await subscription.pause();
await subscription.resume();
```

### Budget Operations

```javascript
// Create budget
const budget = new Budget({
  userId,
  name: 'Food Budget',
  category: 'Food & Drink',
  limit: 10000,
  period: 'monthly',
  startDate: new Date('2025-10-01'),
  endDate: new Date('2025-10-31')
});
await budget.save();

// Add spending
await budget.addSpending(450);

// Get active budgets
const budgets = await Budget.getActiveBudgets(userId);

// Get budget for category
const budget = await Budget.getBudgetForCategory(userId, 'Food & Drink');

// Update from transaction
await Budget.updateFromTransaction(userId, 'Food & Drink', 450, true);

// Renew budget
const newBudget = await budget.renew();
```

### Notification Operations

```javascript
// Create custom notification
const notification = new Notification({
  userId,
  type: 'spending_insight',
  title: 'Spending Alert',
  message: 'You spent 20% more this month',
  priority: 'medium'
});
await notification.save();

// Create budget alert
await Notification.createBudgetAlert(userId, budgetId, 85);

// Create subscription reminder
await Notification.createSubscriptionReminder(
  userId, subscriptionId, 'Netflix', 3, 649
);

// Create goal milestone
await Notification.createGoalMilestone(
  userId, goalId, 'Vacation Fund', 50
);

// Get unread notifications
const unread = await Notification.getUnread(userId);

// Get unread count
const count = await Notification.getUnreadCount(userId);

// Mark as read
await notification.markAsRead();

// Mark all as read
await Notification.markAllAsRead(userId);
```

### Voice Interaction Operations

```javascript
// Create voice interaction
const interaction = new VoiceInteraction({
  userId,
  recording: {
    uri: 'file://recordings/abc.wav',
    duration: 5.2,
    format: 'wav'
  }
});
await interaction.save();

// Mark as processed
await interaction.markAsProcessed(
  'Show my spending report',
  'view_transactions',
  'Here is your spending report...'
);

// Mark as failed
await interaction.markAsFailed(
  'transcription_failed',
  'Could not process audio'
);

// Add feedback
await interaction.addFeedback(5, true, 'Very helpful');

// Get recent interactions
const recent = await VoiceInteraction.getRecentInteractions(userId, 10);

// Get success rate
const successRate = await VoiceInteraction.getSuccessRate(userId);
```

### Investment Recommendation Operations

```javascript
// Generate recommendations for user
const recommendations = await InvestmentRecommendation.generateForUser(userId);

// Get active recommendations
const active = await InvestmentRecommendation.getActiveRecommendations(
  userId,
  'Moderate' // optional risk level filter
);

// Mark actions
await recommendation.markAsViewed();
await recommendation.markAsClicked();
await recommendation.markAsInvested(5000);
await recommendation.dismiss();
```

---

## 🔍 Common Queries

### Get Dashboard Data
```javascript
// User summary
const user = await User.findById(userId);
const netSavings = user.netSavings; // Virtual field

// Recent transactions
const recentTransactions = await Transaction.find({ userId })
  .sort({ date: -1 })
  .limit(5);

// Active goals
const goals = await SavingGoal.find({ 
  userId, 
  status: 'active' 
}).sort({ isMainGoal: -1 });

// Upcoming bills (next 30 days)
const bills = await Subscription.getUpcoming(userId, 30);
```

### Get Transaction Analytics
```javascript
// By category
const categoryData = await Transaction.aggregate([
  { $match: { userId: mongoose.Types.ObjectId(userId), type: 'expense' } },
  { $group: { 
    _id: '$category', 
    total: { $sum: '$amount' },
    count: { $sum: 1 }
  }},
  { $sort: { total: -1 } }
]);

// Monthly comparison
const thisMonth = await Transaction.getMonthlySummary(userId, 2025, 10);
const lastMonth = await Transaction.getMonthlySummary(userId, 2025, 9);
```

### Get Budget Status
```javascript
// All active budgets with status
const budgets = await Budget.find({
  userId,
  status: { $in: ['active', 'exceeded'] },
  endDate: { $gte: new Date() }
});

// Exceeded budgets
const exceeded = budgets.filter(b => b.isExceeded);
```

---

## ⚡ Performance Tips

### Use Lean Queries (Read-Only)
```javascript
// Faster queries without document methods
const transactions = await Transaction.find({ userId }).lean();
```

### Select Only Needed Fields
```javascript
const users = await User.find().select('name email balance');
```

### Use Indexes
```javascript
// Already created on schemas, but you can verify:
// User: email, createdAt
// Transaction: userId+date, userId+type+category
// Goal: userId+status
// Subscription: userId+dueDate
```

### Batch Operations
```javascript
// Instead of multiple saves
await Transaction.insertMany([
  { userId, type: 'expense', ... },
  { userId, type: 'expense', ... }
]);
```

---

## 🎯 Common Patterns

### Create Transaction with Budget Update
```javascript
const transaction = new Transaction({
  userId,
  type: 'expense',
  category: 'Food & Drink',
  amount: 450,
  ...
});
await transaction.save(); // Auto-updates user stats
await Budget.updateFromTransaction(userId, 'Food & Drink', 450, true);
```

### Subscription Payment Flow
```javascript
// 1. Create transaction
const transaction = new Transaction({
  userId,
  type: 'expense',
  name: subscription.name,
  amount: subscription.amount,
  category: 'Bills',
  metadata: { source: 'subscription' }
});
await transaction.save();

// 2. Record payment in subscription
await subscription.recordPayment(
  subscription.amount,
  'success',
  transaction._id
);

// 3. Create notification
await Notification.createSubscriptionReminder(...);
```

### Goal Contribution Flow
```javascript
// 1. Add contribution
await goal.addContribution(amount, note);

// 2. Check milestone
const percentage = goal.progressPercentage;
if (percentage >= 50 && !goal.milestones[1].reached) {
  await Notification.createGoalMilestone(userId, goal._id, goal.name, 50);
}

// 3. Check completion
if (goal.isCompleted) {
  await Notification.createGoalMilestone(userId, goal._id, goal.name, 100);
}
```

---

## 🔐 Security Checklist

- ✅ Passwords are auto-hashed with bcrypt
- ✅ Sensitive fields use `select: false`
- ✅ Input validation at schema level
- ✅ Soft deletes instead of hard deletes
- ✅ Audit trails (createdAt, updatedAt)
- ✅ User ownership checks in queries

---

## 📊 Validation Examples

All schemas have built-in validation:

```javascript
// Will throw validation error
const transaction = new Transaction({
  userId,
  type: 'invalid', // Must be 'income' or 'expense'
  amount: -50      // Must be positive
});
await transaction.save(); // ValidationError

// Proper way with error handling
try {
  await transaction.save();
} catch (error) {
  if (error.name === 'ValidationError') {
    console.log(error.errors);
  }
}
```

---

## 🛠️ Maintenance Tasks

### Daily
```javascript
// Process recurring transactions
// Send due subscription reminders
// Update budget analytics
```

### Weekly
```javascript
// Clean old notifications
await Notification.deleteOld(30); // Delete 30+ days old
```

### Monthly
```javascript
// Renew expired budgets
const budgets = await Budget.find({ 
  status: 'completed',
  isRecurring: true 
});
for (const budget of budgets) {
  await budget.renew();
}

// Archive completed goals
// Generate monthly reports
```

---

## 📝 Error Handling

```javascript
try {
  const transaction = new Transaction({...});
  await transaction.save();
} catch (error) {
  if (error.name === 'ValidationError') {
    // Handle validation errors
    Object.values(error.errors).forEach(err => {
      console.log(err.message);
    });
  } else if (error.code === 11000) {
    // Handle duplicate key errors
    console.log('Duplicate entry');
  } else {
    // Handle other errors
    console.error(error);
  }
}
```

---

## 🎨 Virtual Fields (No Storage)

```javascript
// Access virtual fields like regular fields
const user = await User.findById(userId);
console.log(user.netSavings); // Calculated: income - expense

const goal = await SavingGoal.findById(goalId);
console.log(goal.progressPercentage); // Calculated
console.log(goal.remainingAmount);   // Calculated
console.log(goal.isCompleted);       // Boolean

const budget = await Budget.findById(budgetId);
console.log(budget.percentageSpent); // Calculated
console.log(budget.isExceeded);      // Boolean
```

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: October 28, 2025
