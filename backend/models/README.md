# MongoDB Schema Documentation

## Overview
This document provides comprehensive documentation for all MongoDB schemas used in the Personal Finance Management Application. All schemas are built using Mongoose ODM for MongoDB.

---

## Table of Contents
1. [User Schema](#user-schema)
2. [Transaction Schema](#transaction-schema)
3. [SavingGoal Schema](#savinggoal-schema)
4. [Subscription Schema](#subscription-schema)
5. [Budget Schema](#budget-schema)
6. [Notification Schema](#notification-schema)
7. [VoiceInteraction Schema](#voiceinteraction-schema)
8. [InvestmentRecommendation Schema](#investmentrecommendation-schema)

---

## User Schema

**Model Name:** `User`  
**Collection:** `users`

### Description
Stores user account information, authentication credentials, financial summary, and preferences.

### Fields

#### Basic Authentication
- `name` (String, Required): User's full name
- `email` (String, Required, Unique): User's email address (lowercase)
- `password` (String, Required): Hashed password (bcrypt)
- `profileImage` (String): URL to profile image
- `phoneNumber` (String): Contact number
- `dateOfBirth` (Date): User's date of birth

#### Financial Information
- `balance` (Number): Current account balance
- `cardNumber` (String): Masked card number (e.g., "**** 2112")
- `income` (Object):
  - `totalAmount`: Total income
  - `monthlyAmount`: Monthly income
  - `weeklyAmount`: Weekly income
  - `percentage`: Income growth percentage
- `expense` (Object): Similar structure to income

#### Spending Analytics
- `spendingByCategory` (Array): Array of category-wise spending
  - Each contains: name, amount, percentage, color

#### Risk Profile & Preferences
- `riskProfile` (String): 'Low', 'Moderate', or 'High'
- `preferences` (Object): User preferences for currency, language, notifications, theme

#### Account Status
- `isActive` (Boolean): Account active status
- `isVerified` (Boolean): Email verification status
- `lastLogin` (Date): Last login timestamp
- `subscriptionPlan` (String): 'free', 'basic', or 'premium'

### Virtuals
- `netSavings`: Calculated as income - expense
- `goals`: References to user's saving goals
- `transactions`: References to user's transactions
- `subscriptions`: References to user's subscriptions

### Methods
- `comparePassword(candidatePassword)`: Compare password for login
- `generateVerificationToken()`: Generate email verification token
- `updateSpendingStats()`: Update spending statistics from transactions

### Indexes
- `email`: Unique index for fast lookup
- `createdAt`: Descending index for sorting

---

## Transaction Schema

**Model Name:** `Transaction`  
**Collection:** `transactions`

### Description
Records all financial transactions (income and expenses) with detailed categorization and metadata.

### Fields

#### Basic Information
- `userId` (ObjectId, Required): Reference to User
- `type` (String, Required): 'income' or 'expense'
- `name` (String, Required): Transaction name/description
- `description` (String): Additional details
- `amount` (Number, Required): Transaction amount
- `category` (String, Required): Category (Food, Transport, Salary, etc.)

#### Visual & Organization
- `icon` (String): Icon identifier
- `color` (String): Display color
- `tags` (Array): Tags for organization

#### Date & Time
- `date` (Date, Required): Transaction date
- `timestamp` (String): ISO timestamp string

#### Recurring Transactions
- `isRecurring` (Boolean): Is this a recurring transaction
- `recurringDetails` (Object):
  - `frequency`: 'weekly', 'monthly', 'custom'
  - `startDate`, `endDate`, `nextOccurrence`

#### Receipt Information (for scanned receipts)
- `receipt` (Object):
  - `hasReceipt`: Boolean
  - `imageUri`: Image path
  - `fileName`, `fileSize`
  - `scannedData`: OCR extracted data including items, merchant, amounts

#### Additional Details
- `paymentMethod` (String): 'cash', 'card', 'upi', etc.
- `location` (Object): Name, address, coordinates
- `notes` (String): User notes
- `status` (String): 'completed', 'pending', 'cancelled', 'failed'

### Virtuals
- `formattedAmount`: Formatted string with +/- and currency
- `relativeTime`: Human-readable time ago

### Methods
- `softDelete()`: Soft delete transaction

### Static Methods
- `getByCategory(userId, category)`: Get transactions by category
- `getByDateRange(userId, startDate, endDate)`: Get transactions in date range
- `getMonthlySummary(userId, year, month)`: Get monthly summary

### Indexes
- `userId + date`: For date-based queries
- `userId + type + category`: For filtering
- `isRecurring + nextOccurrence`: For recurring transactions

---

## SavingGoal Schema

**Model Name:** `SavingGoal`  
**Collection:** `savinggoals`

### Description
Manages user's savings goals with progress tracking, contributions, and milestones.

### Fields

#### Goal Details
- `userId` (ObjectId, Required): Reference to User
- `name` (String, Required): Goal name
- `description` (String): Goal description
- `targetAmount` (Number, Required): Target savings amount
- `currentAmount` (Number): Current saved amount
- `monthlyContribution` (Number, Required): Monthly saving target

#### Dates & Status
- `startDate` (Date): Goal start date
- `estimatedCompletion` (Date, Required): Estimated completion
- `actualCompletion` (Date): Actual completion date
- `isMainGoal` (Boolean): Is this the main/primary goal
- `status` (String): 'active', 'completed', 'paused', 'cancelled'

#### Visual Customization
- `color` (String): Display color
- `icon` (String): Icon identifier
- `imageUrl` (String): Goal image

#### Contribution History
- `contributions` (Array): Array of contribution records
  - Each contains: amount, date, note, source

#### Automatic Contributions
- `automaticContribution` (Object):
  - `enabled`, `frequency`, `amount`, `nextContributionDate`

#### Reminders & Milestones
- `reminders` (Array): Reminder configurations
- `milestones` (Array): Progress milestones (25%, 50%, 75%, 100%)

#### Analytics
- `analytics` (Object):
  - `totalContributed`, `contributionCount`
  - `averageMonthlyContribution`
  - `projectedCompletionDate`
  - `daysToCompletion`, `monthsToCompletion`

### Virtuals
- `progressPercentage`: Percentage of goal completed
- `remainingAmount`: Amount remaining to reach goal
- `isCompleted`: Boolean if goal is completed
- `monthlyProgress`: Current month's progress

### Methods
- `addContribution(amount, note, source)`: Add a contribution
- `setAsMainGoal()`: Set this as the main goal
- `softDelete()`: Soft delete goal

### Static Methods
- `getActiveGoals(userId)`: Get active goals
- `getCompletedGoals(userId)`: Get completed goals
- `getTotalSavings(userId)`: Get total savings across all goals

### Indexes
- `userId + status`: For filtering
- `userId + isMainGoal`: For main goal queries

---

## Subscription Schema

**Model Name:** `Subscription`  
**Collection:** `subscriptions`

### Description
Manages recurring subscriptions, bills, and EMIs with auto-pay and reminder features.

### Fields

#### Basic Information
- `userId` (ObjectId, Required): Reference to User
- `name` (String, Required): Subscription/bill name
- `description` (String): Details
- `category` (String, Required): 'Entertainment', 'Bills', 'Utilities', 'EMI', 'Loans', etc.
- `amount` (Number, Required): Payment amount

#### Frequency & Dates
- `frequency` (String, Required): 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
- `customFrequencyDays` (Number): For custom frequency
- `startDate` (Date, Required): Subscription start
- `endDate` (Date): Subscription end (null for ongoing)
- `dueDate` (Date, Required): Next payment due date
- `nextDueDate` (Date): Calculated next due date
- `daysUntilDue` (Number): Days until next payment

#### Visual & Branding
- `icon`, `logo`, `color`: Display customization

#### Auto-Pay Settings
- `autoPay` (Object):
  - `enabled`, `paymentMethod`, `paymentMethodId`

#### Reminders
- `reminders` (Object):
  - `enabled`, `daysBefore`, `lastReminderSent`

#### Payment History
- `paymentHistory` (Array): Array of payment records
  - Each contains: amount, paidOn, status, transactionId, note

#### Billing Information
- `billingInfo` (Object): Provider, accountNumber, customerId, contact details

#### Analytics
- `analytics` (Object):
  - `totalPaid`, `paymentCount`, `averagePayment`
  - `lastPaymentDate`, `missedPayments`

### Virtuals
- `formattedDueDate`: Formatted date string
- `isOverdue`: Boolean if payment is overdue

### Methods
- `calculateNextDueDate()`: Calculate next due date based on frequency
- `recordPayment(amount, status, transactionId, note)`: Record a payment
- `pause()`, `resume()`, `cancel()`: Manage subscription status
- `softDelete()`: Soft delete subscription

### Static Methods
- `getUpcoming(userId, daysAhead)`: Get upcoming subscriptions
- `getOverdue(userId)`: Get overdue subscriptions
- `getTotalMonthlyRecurring(userId)`: Get total monthly recurring amount

### Indexes
- `userId + status`: For filtering
- `userId + dueDate`: For due date queries
- `userId + nextDueDate`: For upcoming reminders

---

## Budget Schema

**Model Name:** `Budget`  
**Collection:** `budgets`

### Description
Manages budget limits for different categories with alerts and rollover capabilities.

### Fields

#### Basic Information
- `userId` (ObjectId, Required): Reference to User
- `name` (String, Required): Budget name
- `description` (String): Details
- `category` (String, Required): Budget category

#### Amounts
- `limit` (Number, Required): Budget limit
- `spent` (Number): Amount spent
- `remaining` (Number): Remaining budget

#### Time Period
- `period` (String, Required): 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
- `startDate` (Date, Required): Period start
- `endDate` (Date, Required): Period end

#### Alerts
- `alerts` (Object):
  - `enabled`: Boolean
  - `thresholds`: Array of percentage thresholds (50%, 75%, 90%, 100%)
  - Each threshold tracks: percentage, triggered, triggeredAt

#### Rollover Settings
- `rollover` (Object):
  - `enabled`, `carryForwardUnspent`, `previousPeriodRemainder`

#### Visual
- `color`, `icon`: Display customization

#### Analytics
- `analytics` (Object):
  - `averageSpending`, `spendingVelocity`
  - `projectedSpend`
  - `comparisonToPrevious`: percentage, trend

#### Status & Recurrence
- `status` (String): 'active', 'exceeded', 'completed', 'paused'
- `isRecurring` (Boolean): Auto-renew budget
- `recurringSettings` (Object): autoRenew, adjustmentFactor

### Virtuals
- `percentageSpent`: Percentage of budget spent
- `isExceeded`: Boolean if budget exceeded
- `daysRemaining`: Days remaining in period

### Methods
- `addSpending(amount)`: Add spending to budget
- `removeSpending(amount)`: Remove spending (for deletions)
- `renew()`: Create new budget for next period
- `softDelete()`: Soft delete budget

### Static Methods
- `getActiveBudgets(userId)`: Get active budgets
- `getBudgetForCategory(userId, category)`: Get budget for specific category
- `updateFromTransaction(userId, category, amount, isAdd)`: Update budget from transaction

### Indexes
- `userId + status`: For filtering
- `userId + category`: For category queries
- `userId + startDate + endDate`: For date range queries

---

## Notification Schema

**Model Name:** `Notification`  
**Collection:** `notifications`

### Description
Manages in-app, push, and email notifications for various events.

### Fields

#### Basic Information
- `userId` (ObjectId, Required): Reference to User
- `type` (String, Required): Notification type (budget_alert, goal_achieved, subscription_due, etc.)
- `title` (String, Required): Notification title
- `message` (String, Required): Notification message

#### Visual Elements
- `icon`, `color`, `imageUrl`: Display customization
- `priority` (String): 'low', 'medium', 'high', 'urgent'

#### Related Document
- `relatedDocument` (Object):
  - `documentType`: Model name (Transaction, Budget, etc.)
  - `documentId`: Reference to document

#### Action
- `action` (Object):
  - `type`: 'none', 'view', 'navigate', 'external_link'
  - `label`, `route`, `url`, `data`

#### Status
- `isRead` (Boolean): Read status
- `readAt` (Date): When read

#### Delivery Channels
- `channels` (Object):
  - `inApp`, `push`, `email`
  - Each has: enabled, delivered, deliveredAt

#### Scheduling & Expiry
- `scheduledFor` (Date): When to deliver
- `expiresAt` (Date): When to expire
- `group` (String): Group similar notifications

### Virtuals
- `isExpired`: Boolean if expired
- `timeAgo`: Human-readable time

### Methods
- `markAsRead()`: Mark notification as read
- `markAsDelivered(channel)`: Mark as delivered on channel
- `softDelete()`: Soft delete notification

### Static Methods
- `getUnreadCount(userId)`: Get count of unread
- `getRecent(userId, limit)`: Get recent notifications
- `getUnread(userId)`: Get unread notifications
- `markAllAsRead(userId)`: Mark all as read
- `deleteOld(daysOld)`: Delete old notifications
- `createBudgetAlert(userId, budgetId, percentage)`: Create budget alert
- `createSubscriptionReminder(...)`: Create subscription reminder
- `createGoalMilestone(...)`: Create goal milestone notification

### Indexes
- `userId + isRead + createdAt`: For unread queries
- `userId + type`: For type filtering
- `scheduledFor`, `expiresAt`: For scheduled delivery

---

## VoiceInteraction Schema

**Model Name:** `VoiceInteraction`  
**Collection:** `voiceinteractions`

### Description
Stores voice command interactions, transcriptions, and AI responses.

### Fields

#### Basic Information
- `userId` (ObjectId, Required): Reference to User

#### Audio Recording
- `recording` (Object):
  - `uri`, `duration`, `format`, `fileSize`, `quality`

#### Transcription
- `transcription` (Object):
  - `text`: Transcribed text
  - `confidence`: Transcription confidence (0-100)
  - `language`, `processingTime`

#### Intent Recognition
- `intent` (Object):
  - `type`: Intent type (add_transaction, view_balance, etc.)
  - `confidence`: Intent confidence
  - `entities`: Extracted entities (amount, category, date, etc.)

#### AI Response
- `response` (Object):
  - `text`: Response text
  - `type`: 'information', 'confirmation', 'question', 'error', 'success'
  - `actionTaken`: What action was taken
  - `relatedDocuments`: References to created/modified documents

#### Quick Questions
- `isQuickQuestion` (Boolean): Was this a predefined quick question
- `quickQuestionType` (String): Type of quick question

#### Processing
- `processingStatus` (String): 'pending', 'processing', 'completed', 'failed'
- `error` (Object): Error information if failed

#### Feedback
- `userFeedback` (Object):
  - `rating` (1-5), `wasHelpful`, `comment`

#### Context
- `context` (Object):
  - `previousInteractionId`, `sessionId`
  - `deviceInfo`, `location`

### Virtuals
- `wasSuccessful`: Boolean if processing succeeded
- `formattedDuration`: Formatted duration string

### Methods
- `markAsProcessed(transcriptionText, intentType, responseText)`
- `markAsFailed(errorType, errorMessage)`
- `addFeedback(rating, wasHelpful, comment)`

### Static Methods
- `getRecentInteractions(userId, limit)`
- `getByIntent(userId, intentType)`
- `getSuccessRate(userId)`
- `getMostCommonIntents(userId, limit)`

### Indexes
- `userId + createdAt`: For recent queries
- `userId + intent.type`: For intent filtering
- `context.sessionId`: For session tracking

---

## InvestmentRecommendation Schema

**Model Name:** `InvestmentRecommendation`  
**Collection:** `investmentrecommendations`

### Description
AI-generated investment recommendations based on user's profile and financial situation.

### Fields

#### Basic Information
- `userId` (ObjectId, Required): Reference to User
- `name` (String, Required): Investment name
- `description` (String, Required): Investment description
- `type` (String, Required): 'sip', 'mutual_fund', 'stock', 'etf', 'bond', 'crypto', etc.

#### Risk & Performance
- `riskLevel` (String, Required): 'Low', 'Moderate', 'High'
- `performance` (Object):
  - `projectedReturn`, `annualGrowth`, `ytdGrowth`
  - `historicalReturns`: Array of year-wise returns
- `confidence` (Number, Required): Confidence score (0-100)

#### Investment Details
- `minInvestment` (Number): Minimum investment required
- `recommendedAmount` (Number): Recommended investment amount
- `category` (String): 'equity', 'debt', 'hybrid', etc.

#### Visual & Provider
- `icon`, `color`, `imageUrl`: Display customization
- `provider` (Object):
  - `name`, `website`, `rating`

#### Recommendation Details
- `buttonText`, `actionUrl`: CTA details
- `reasons` (Array): Reasons for recommendation
- `pros`, `cons` (Arrays): Advantages and disadvantages

#### AI Insights
- `aiInsights` (Array): AI-generated insights
  - Each contains: message, icon, color, gradient, priority

#### Recommendation Basis
- `recommendationBasis` (Object):
  - `userBalance`, `userRiskProfile`
  - `userGoals`, `spendingPattern`, `ageGroup`

#### Status & Actions
- `status` (String): 'active', 'expired', 'invested', 'dismissed'
- `userActions` (Object):
  - Tracking: viewed, clicked, invested, dismissed
  - Each with timestamp and details

#### Expiry & Metadata
- `expiresAt` (Date): Recommendation expiry
- `metadata` (Object):
  - `algorithmVersion`, `generatedBy`, `dataSourceDate`

### Virtuals
- `isExpired`: Boolean if expired
- `daysUntilExpiry`: Days until expiry

### Methods
- `markAsViewed()`, `markAsClicked()`, `markAsInvested(amount)`, `dismiss()`

### Static Methods
- `getActiveRecommendations(userId, riskLevel)`
- `generateForUser(userId)`: Generate new recommendations

### Indexes
- `userId + status`: For filtering
- `userId + riskLevel`: For risk-based queries
- `expiresAt`: For expiry checks

---

## Usage Examples

### Import all models
```javascript
const {
  User,
  Transaction,
  SavingGoal,
  Subscription,
  Budget,
  Notification,
  VoiceInteraction,
  InvestmentRecommendation
} = require('./models');
```

### Create a new transaction
```javascript
const transaction = new Transaction({
  userId: user._id,
  type: 'expense',
  name: 'Lunch at Cafe',
  amount: 450,
  category: 'Food & Drink',
  date: new Date()
});
await transaction.save();
```

### Get user's active goals
```javascript
const goals = await SavingGoal.getActiveGoals(userId);
```

### Add contribution to goal
```javascript
const goal = await SavingGoal.findById(goalId);
await goal.addContribution(500, 'Monthly savings', 'manual');
```

### Create budget alert notification
```javascript
await Notification.createBudgetAlert(userId, budgetId, 85);
```

---

## Relationships

### User → Transactions (One-to-Many)
User has many Transactions

### User → SavingGoals (One-to-Many)
User has many SavingGoals

### User → Subscriptions (One-to-Many)
User has many Subscriptions

### User → Budgets (One-to-Many)
User has many Budgets

### User → Notifications (One-to-Many)
User has many Notifications

### User → VoiceInteractions (One-to-Many)
User has many VoiceInteractions

### User → InvestmentRecommendations (One-to-Many)
User has many InvestmentRecommendations

### Transaction ↔ Budget (Many-to-One)
Transactions update Budget spending

### Subscription → Transaction (One-to-Many)
Subscription payments create Transactions

### SavingGoal → InvestmentRecommendation (Many-to-Many)
Recommendations based on Goals

---

## Best Practices

1. **Always use transactions** for operations that modify multiple documents
2. **Use virtuals** instead of storing calculated fields
3. **Implement soft deletes** rather than hard deletes
4. **Use indexes** for frequently queried fields
5. **Validate data** at schema level whenever possible
6. **Use pre/post hooks** for automatic calculations
7. **Implement pagination** for large datasets
8. **Use aggregation pipelines** for complex queries
9. **Keep relationships denormalized** where appropriate for performance
10. **Regular cleanup** of old/expired data

---

## Security Considerations

1. **Passwords**: Always hashed using bcrypt
2. **Sensitive data**: Use select: false for sensitive fields
3. **Validation**: Input validation at schema level
4. **Sanitization**: Sanitize user inputs
5. **Rate limiting**: Implement for API endpoints
6. **Authentication**: JWT-based authentication
7. **Authorization**: Role-based access control
8. **Encryption**: Encrypt sensitive data at rest

---

## Performance Optimization

1. **Indexes**: Created on frequently queried fields
2. **Lean queries**: Use .lean() for read-only operations
3. **Select specific fields**: Don't fetch unnecessary data
4. **Pagination**: Implement cursor-based pagination
5. **Caching**: Cache frequently accessed data
6. **Aggregation**: Use for complex calculations
7. **Connection pooling**: Configure appropriate pool size
8. **Batch operations**: Use for bulk inserts/updates

---

## Maintenance

### Regular Tasks
- Delete old notifications (30+ days old)
- Archive completed goals
- Clean up expired recommendations
- Update user spending statistics
- Process recurring transactions
- Send scheduled notifications
- Check and renew expired budgets
- Process subscription payments

---

## Version History

- **v1.0.0** (Initial Release): Complete schema implementation with all features
