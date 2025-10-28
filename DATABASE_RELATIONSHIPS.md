# Database Schema Relationships

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                                    USER                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │ • _id (ObjectId)                                                       │    │
│  │ • name (String)                                                        │    │
│  │ • email (String) [UNIQUE]                                             │    │
│  │ • password (String) [HASHED]                                          │    │
│  │ • balance (Number)                                                     │    │
│  │ • income { totalAmount, monthlyAmount, weeklyAmount, percentage }    │    │
│  │ • expense { totalAmount, monthlyAmount, weeklyAmount, percentage }   │    │
│  │ • spendingByCategory [ { name, amount, percentage, color } ]         │    │
│  │ • riskProfile (String: Low/Moderate/High)                            │    │
│  │ • preferences { currency, language, notifications, theme }           │    │
│  │ • subscriptionPlan (String: free/basic/premium)                      │    │
│  └───────────────────────────────────────────────────────────────────────┘    │
│                                     │                                           │
│         ┌───────────────────────────┼───────────────────────────────┐          │
│         │                           │                               │          │
│         ▼                           ▼                               ▼          │
│  ┌─────────────┐            ┌──────────────┐              ┌──────────────┐   │
│  │             │            │              │              │              │   │
│  │ TRANSACTION │            │ SAVING GOAL  │              │ SUBSCRIPTION │   │
│  │             │            │              │              │              │   │
│  └─────────────┘            └──────────────┘              └──────────────┘   │
│         │                           │                               │          │
│         │                           │                               │          │
│         ▼                           ▼                               ▼          │
│  ┌─────────────┐            ┌──────────────┐              ┌──────────────┐   │
│  │   BUDGET    │            │ NOTIFICATION │              │ NOTIFICATION │   │
│  │             │            │              │              │              │   │
│  └─────────────┘            └──────────────┘              └──────────────┘   │
│         │                                                                      │
│         ▼                                                                      │
│  ┌─────────────┐                                                              │
│  │NOTIFICATION │                                                              │
│  │             │                                                              │
│  └─────────────┘                                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────────┐
         │                                                  │
         │  ADDITIONAL RELATED COLLECTIONS                  │
         │                                                  │
         └──────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐
│                 │  │                  │  │                        │
│ VOICE           │  │  INVESTMENT      │  │    NOTIFICATION        │
│ INTERACTION     │  │  RECOMMENDATION  │  │                        │
│                 │  │                  │  │                        │
└─────────────────┘  └──────────────────┘  └────────────────────────┘
```

## Detailed Relationships

### 1. USER ↔ TRANSACTION (One-to-Many)

```
USER (1) ──────────────────▶ TRANSACTION (Many)
   │                              │
   │ userId: ObjectId             │ userId: Reference
   │                              │ type: income/expense
   │                              │ category: String
   │                              │ amount: Number
   │                              │
   └──────────── Updates ────────┘
        (User.updateSpendingStats)
```

**Flow:**
- Transaction references User via `userId`
- Post-save hook updates User's spending statistics
- Transaction categories map to User's `spendingByCategory`

### 2. USER ↔ SAVING GOAL (One-to-Many)

```
USER (1) ──────────────────▶ SAVING GOAL (Many)
   │                              │
   │ userId: ObjectId             │ userId: Reference
   │ balance: Number              │ currentAmount: Number
   │                              │ contributions: [...]
   │                              │ isMainGoal: Boolean
   │                              │
   └──────────────────────────────┘
```

**Flow:**
- SavingGoal references User via `userId`
- Contributions tracked in embedded array
- Progress calculations done via virtuals
- Main goal designation managed by methods

### 3. USER ↔ SUBSCRIPTION (One-to-Many)

```
USER (1) ──────────────────▶ SUBSCRIPTION (Many)
   │                              │
   │ userId: ObjectId             │ userId: Reference
   │                              │ dueDate: Date
   │                              │ frequency: String
   │                              │ paymentHistory: [...]
   │                              │
   └──────────────────────────────┘
```

**Flow:**
- Subscription references User via `userId`
- Auto-calculates next due date
- Payment history embedded
- Can create Transactions on payment

### 4. USER ↔ BUDGET (One-to-Many)

```
USER (1) ──────────────────▶ BUDGET (Many)
   │                              │
   │ userId: ObjectId             │ userId: Reference
   │ spendingByCategory           │ category: String
   │                              │ limit: Number
   │                              │ spent: Number
   │                              │
   └──────────────────────────────┘
```

**Flow:**
- Budget references User via `userId`
- Category-based budgets
- Spending updated from Transactions
- Alert thresholds tracked

### 5. TRANSACTION → BUDGET (Many-to-One)

```
TRANSACTION (Many) ──────────▶ BUDGET (1)
        │                          │
        │ category: String         │ category: String
        │ amount: Number           │ spent: Number
        │                          │
        └───── Updates ────────────┘
     (Budget.updateFromTransaction)
```

**Flow:**
- Transaction category matches Budget category
- Budget.spent auto-updated when Transaction created
- Alert notifications triggered on thresholds

### 6. SUBSCRIPTION → TRANSACTION (One-to-Many)

```
SUBSCRIPTION (1) ──────────▶ TRANSACTION (Many)
        │                          │
        │ _id: ObjectId            │ metadata.subscriptionId
        │ amount: Number           │ amount: Number
        │ paymentHistory           │ type: expense
        │                          │
        └──────────────────────────┘
```

**Flow:**
- Subscription payment creates Transaction
- Transaction ID stored in paymentHistory
- Category set to subscription's category

### 7. USER ↔ NOTIFICATION (One-to-Many)

```
USER (1) ──────────────────▶ NOTIFICATION (Many)
   │                              │
   │ userId: ObjectId             │ userId: Reference
   │ preferences.notifications    │ type: String
   │                              │ isRead: Boolean
   │                              │ channels: {...}
   │                              │
   └──────────────────────────────┘
```

**Flow:**
- Notification references User via `userId`
- Created by various triggers (budget, goal, subscription)
- Multi-channel delivery (in-app, push, email)

### 8. NOTIFICATION ↔ OTHER MODELS (Many-to-One)

```
NOTIFICATION ──────────▶ [TRANSACTION | BUDGET | GOAL | SUBSCRIPTION]
     │                           │
     │ relatedDocument: {        │
     │   documentType: String    │
     │   documentId: ObjectId    │ _id: ObjectId
     │ }                         │
     │                           │
     └───────────────────────────┘
```

**Flow:**
- Notification can reference any model
- documentType specifies model name
- documentId is the reference

### 9. USER ↔ VOICE INTERACTION (One-to-Many)

```
USER (1) ──────────────────▶ VOICE INTERACTION (Many)
   │                              │
   │ userId: ObjectId             │ userId: Reference
   │                              │ transcription: {...}
   │                              │ intent: {...}
   │                              │ response: {...}
   │                              │
   └──────────────────────────────┘
```

**Flow:**
- VoiceInteraction references User via `userId`
- Stores audio, transcription, and AI response
- Can reference created documents in response.relatedDocuments

### 10. USER ↔ INVESTMENT RECOMMENDATION (One-to-Many)

```
USER (1) ──────────────────▶ INVESTMENT RECOMMENDATION (Many)
   │                              │
   │ userId: ObjectId             │ userId: Reference
   │ balance: Number              │ recommendationBasis.userBalance
   │ riskProfile: String          │ riskLevel: String
   │                              │ userActions: {...}
   │                              │
   └──────────────────────────────┘
```

**Flow:**
- InvestmentRecommendation references User via `userId`
- Generated based on User's balance and riskProfile
- Can reference SavingGoals in recommendationBasis

## Data Flow Diagrams

### Transaction Creation Flow

```
1. User adds transaction
         │
         ▼
2. Transaction.save()
         │
         ├──▶ 3. Post-save hook
         │         │
         │         ▼
         │    4. User.updateSpendingStats()
         │         │
         │         ├──▶ Update income/expense
         │         └──▶ Update spendingByCategory
         │
         └──▶ 5. Budget.updateFromTransaction()
                   │
                   ├──▶ Update spent amount
                   └──▶ Check thresholds
                         │
                         └──▶ 6. Notification.createBudgetAlert()
```

### Goal Contribution Flow

```
1. User contributes to goal
         │
         ▼
2. Goal.addContribution()
         │
         ├──▶ 3. Add to contributions array
         │
         ├──▶ 4. Update currentAmount
         │
         ├──▶ 5. Pre-save hook
         │         │
         │         ├──▶ Calculate analytics
         │         ├──▶ Check milestones
         │         └──▶ Update projections
         │
         └──▶ 6. Check if milestone reached
                   │
                   └──▶ 7. Notification.createGoalMilestone()
```

### Subscription Payment Flow

```
1. Subscription due date arrives
         │
         ▼
2. Create reminder notification
         │
         ▼
3. User pays subscription
         │
         ├──▶ 4. Create Transaction
         │         │
         │         └──▶ Update User stats
         │
         └──▶ 5. Subscription.recordPayment()
                   │
                   ├──▶ Add to paymentHistory
                   └──▶ Calculate nextDueDate
```

### Voice Interaction Flow

```
1. User records voice
         │
         ▼
2. VoiceInteraction.save()
         │
         ▼
3. Process audio
         │
         ├──▶ 4. Transcribe to text
         │
         ├──▶ 5. Identify intent
         │
         └──▶ 6. Execute action
                   │
                   ├──▶ Create Transaction
                   ├──▶ Create Goal
                   ├──▶ Query data
                   │
                   └──▶ 7. Generate response
                         │
                         └──▶ 8. Store in response.relatedDocuments
```

## Collection Summary

| Collection | References To | Referenced By | Cascade Delete |
|------------|--------------|---------------|----------------|
| users | None | All | Yes - All user data |
| transactions | users, budgets | notifications | Yes |
| savinggoals | users | notifications, recommendations | Yes |
| subscriptions | users | transactions, notifications | Yes |
| budgets | users | notifications | Yes |
| notifications | users, [any model] | None | No |
| voiceinteractions | users, [created docs] | None | No |
| investmentrecommendations | users, goals | None | No |

## Indexes Summary

### Primary Indexes (Unique)
- users: `email`

### Compound Indexes (Performance)
- transactions: `userId + date`, `userId + type + category`
- savinggoals: `userId + status`, `userId + isMainGoal`
- subscriptions: `userId + dueDate`, `userId + status`
- budgets: `userId + category`, `userId + startDate + endDate`
- notifications: `userId + isRead + createdAt`
- voiceinteractions: `userId + createdAt`
- investmentrecommendations: `userId + status`, `userId + riskLevel`

## Data Integrity Rules

1. **User Deletion**: Soft delete all related documents
2. **Transaction Deletion**: Update User stats and Budget spent
3. **Goal Completion**: Create notification, update status
4. **Budget Exceeded**: Create alert notification
5. **Subscription Due**: Create reminder notification
6. **Milestone Reached**: Create achievement notification

---

**Diagram Version**: 1.0.0  
**Last Updated**: October 28, 2025
