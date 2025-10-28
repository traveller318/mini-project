const mongoose = require('mongoose');
require('dotenv').config();

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

// Sample data based on your frontend data.ts
const sampleData = {
  user: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    balance: 24592.89,
    cardNumber: '**** 2112',
    income: {
      totalAmount: 50000,
      monthlyAmount: 45000,
      weeklyAmount: 10500,
      percentage: 12.5
    },
    expense: {
      totalAmount: 35000,
      monthlyAmount: 32000,
      weeklyAmount: 7500,
      percentage: 8.3
    },
    riskProfile: 'Moderate',
    preferences: {
      currency: 'INR',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        billReminders: true,
        goalReminders: true
      }
    }
  },
  
  savingGoals: [
    {
      name: 'PlayStation 5',
      targetAmount: 60995,
      currentAmount: 42021,
      monthlyContribution: 2000,
      estimatedCompletion: new Date('2026-01-15'),
      color: '#3B82F6',
      category: 'electronics',
      isMainGoal: true
    },
    {
      name: 'New Laptop',
      targetAmount: 250000,
      currentAmount: 125000,
      monthlyContribution: 5000,
      estimatedCompletion: new Date('2026-06-15'),
      color: '#10B981',
      category: 'electronics'
    },
    {
      name: 'Vacation Fund',
      targetAmount: 150000,
      currentAmount: 80050,
      monthlyContribution: 3000,
      estimatedCompletion: new Date('2026-04-15'),
      color: '#F59E0B',
      category: 'vacation'
    }
  ],
  
  transactions: [
    {
      type: 'income',
      name: 'Google LLC',
      category: 'Work',
      amount: 2500,
      icon: 'logo-google',
      description: 'Monthly salary',
      date: new Date()
    },
    {
      type: 'expense',
      name: 'Netflix',
      category: 'Entertainment',
      amount: 649,
      icon: 'film-outline',
      description: 'Monthly subscription',
      date: new Date(Date.now() - 86400000)
    },
    {
      type: 'expense',
      name: 'Starbucks',
      category: 'Food & Drink',
      amount: 245,
      icon: 'cafe-outline',
      description: 'Coffee',
      date: new Date(Date.now() - 172800000)
    },
    {
      type: 'expense',
      name: 'Amazon',
      category: 'Shopping',
      amount: 1299,
      icon: 'bag-outline',
      description: 'Online shopping',
      date: new Date(Date.now() - 259200000)
    },
    {
      type: 'income',
      name: 'Salary Deposit',
      category: 'Salary',
      amount: 45000,
      icon: 'card-outline',
      description: 'Monthly salary',
      date: new Date(Date.now() - 604800000)
    }
  ],
  
  subscriptions: [
    {
      name: 'Spotify',
      category: 'Entertainment',
      amount: 199,
      frequency: 'monthly',
      icon: 'musical-notes',
      dueDate: new Date(Date.now() + 86400000),
      startDate: new Date(Date.now() - 2592000000)
    },
    {
      name: 'Netflix',
      category: 'Entertainment',
      amount: 649,
      frequency: 'monthly',
      icon: 'film',
      dueDate: new Date(Date.now() + 345600000),
      startDate: new Date(Date.now() - 2592000000)
    },
    {
      name: 'Amazon Prime',
      category: 'Shopping',
      amount: 179,
      frequency: 'monthly',
      icon: 'cart',
      dueDate: new Date(Date.now() + 604800000),
      startDate: new Date(Date.now() - 2592000000)
    }
  ],
  
  budgets: [
    {
      name: 'Food Budget',
      category: 'Food & Drink',
      limit: 10000,
      spent: 5675,
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      color: '#EF4444',
      alerts: {
        enabled: true,
        thresholds: [
          { percentage: 50, triggered: true, triggeredAt: new Date(Date.now() - 432000000) },
          { percentage: 75, triggered: false },
          { percentage: 90, triggered: false },
          { percentage: 100, triggered: false }
        ]
      }
    },
    {
      name: 'Shopping Budget',
      category: 'Shopping',
      limit: 15000,
      spent: 8902,
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      color: '#8B5CF6'
    },
    {
      name: 'Entertainment Budget',
      category: 'Entertainment',
      limit: 5000,
      spent: 3458,
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      color: '#F59E0B'
    }
  ]
};

// Seed function
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await SavingGoal.deleteMany({});
    await Subscription.deleteMany({});
    await Budget.deleteMany({});
    await Notification.deleteMany({});
    await VoiceInteraction.deleteMany({});
    await InvestmentRecommendation.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create user
    console.log('\n👤 Creating user...');
    const user = new User(sampleData.user);
    await user.save();
    console.log(`✅ User created: ${user.name} (${user.email})`);

    // Create saving goals
    console.log('\n🎯 Creating saving goals...');
    for (const goalData of sampleData.savingGoals) {
      const goal = new SavingGoal({
        ...goalData,
        userId: user._id
      });
      await goal.save();
      console.log(`  ✅ Goal created: ${goal.name} (₹${goal.currentAmount}/${goal.targetAmount})`);
    }

    // Create transactions
    console.log('\n💰 Creating transactions...');
    for (const transactionData of sampleData.transactions) {
      const transaction = new Transaction({
        ...transactionData,
        userId: user._id
      });
      await transaction.save();
      console.log(`  ✅ Transaction created: ${transaction.name} (${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount})`);
    }

    // Create subscriptions
    console.log('\n📅 Creating subscriptions...');
    for (const subscriptionData of sampleData.subscriptions) {
      const subscription = new Subscription({
        ...subscriptionData,
        userId: user._id
      });
      await subscription.save();
      console.log(`  ✅ Subscription created: ${subscription.name} (₹${subscription.amount}/${subscription.frequency})`);
    }

    // Create budgets
    console.log('\n💵 Creating budgets...');
    for (const budgetData of sampleData.budgets) {
      const budget = new Budget({
        ...budgetData,
        userId: user._id
      });
      await budget.save();
      const percentage = ((budget.spent / budget.limit) * 100).toFixed(0);
      console.log(`  ✅ Budget created: ${budget.name} (${percentage}% spent)`);
    }

    // Create sample notifications
    console.log('\n🔔 Creating notifications...');
    
    // Budget alert
    const budgetAlert = new Notification({
      userId: user._id,
      type: 'budget_alert',
      title: 'Budget Alert',
      message: 'You\'ve spent 75% of your Food & Drink budget',
      icon: 'warning-outline',
      color: '#F59E0B',
      priority: 'medium',
      channels: {
        inApp: { enabled: true, delivered: true, deliveredAt: new Date() }
      }
    });
    await budgetAlert.save();
    console.log('  ✅ Budget alert notification created');

    // Goal milestone
    const goalMilestone = new Notification({
      userId: user._id,
      type: 'goal_milestone',
      title: 'Goal Milestone Reached!',
      message: 'You\'ve reached 50% of your Vacation Fund goal!',
      icon: 'ribbon',
      color: '#10B981',
      priority: 'high',
      channels: {
        inApp: { enabled: true, delivered: true, deliveredAt: new Date() }
      }
    });
    await goalMilestone.save();
    console.log('  ✅ Goal milestone notification created');

    // Subscription reminder
    const subReminder = new Notification({
      userId: user._id,
      type: 'subscription_due',
      title: 'Subscription Due Soon',
      message: 'Your Spotify subscription of ₹199 is due tomorrow',
      icon: 'time',
      color: '#3B82F6',
      priority: 'high',
      channels: {
        inApp: { enabled: true, delivered: true, deliveredAt: new Date() }
      }
    });
    await subReminder.save();
    console.log('  ✅ Subscription reminder notification created');

    // Create investment recommendations
    console.log('\n📈 Creating investment recommendations...');
    const recommendations = [
      {
        userId: user._id,
        name: 'HDFC Mid Cap Opportunities',
        description: 'Best suited for moderate-risk investors',
        type: 'mutual_fund',
        riskLevel: 'Moderate',
        performance: {
          projectedReturn: 12,
          annualGrowth: 12,
          ytdGrowth: 8.5
        },
        confidence: 82,
        icon: 'analytics-outline',
        color: '#F59E0B',
        buttonText: 'Invest Now',
        category: 'equity',
        recommendationBasis: {
          userBalance: user.balance,
          userRiskProfile: user.riskProfile
        }
      },
      {
        userId: user._id,
        name: 'SBI Debt Fund Plus',
        description: 'Stable returns with minimal risk',
        type: 'mutual_fund',
        riskLevel: 'Low',
        performance: {
          projectedReturn: 7,
          annualGrowth: 7,
          ytdGrowth: 5.2
        },
        confidence: 90,
        icon: 'shield-checkmark-outline',
        color: '#3B82F6',
        buttonText: 'Start SIP',
        category: 'debt',
        recommendationBasis: {
          userBalance: user.balance,
          userRiskProfile: user.riskProfile
        }
      }
    ];

    for (const recData of recommendations) {
      const recommendation = new InvestmentRecommendation(recData);
      await recommendation.save();
      console.log(`  ✅ Recommendation created: ${recommendation.name} (Confidence: ${recommendation.confidence}%)`);
    }

    // Display summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                    SEED SUMMARY                        ');
    console.log('═══════════════════════════════════════════════════════');
    
    const userCount = await User.countDocuments();
    const transactionCount = await Transaction.countDocuments();
    const goalCount = await SavingGoal.countDocuments();
    const subscriptionCount = await Subscription.countDocuments();
    const budgetCount = await Budget.countDocuments();
    const notificationCount = await Notification.countDocuments();
    const recommendationCount = await InvestmentRecommendation.countDocuments();
    
    console.log(`👥 Users:                ${userCount}`);
    console.log(`💰 Transactions:         ${transactionCount}`);
    console.log(`🎯 Saving Goals:         ${goalCount}`);
    console.log(`📅 Subscriptions:        ${subscriptionCount}`);
    console.log(`💵 Budgets:              ${budgetCount}`);
    console.log(`🔔 Notifications:        ${notificationCount}`);
    console.log(`📈 Recommendations:      ${recommendationCount}`);
    console.log('═══════════════════════════════════════════════════════');
    
    console.log('\n✨ Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: password123`);
    console.log(`   User ID: ${user._id}`);
    
    console.log('\n🚀 You can now test your API with this data!');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
