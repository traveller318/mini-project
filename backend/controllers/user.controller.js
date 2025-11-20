const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SavingGoal = require('../models/SavingGoal');
const Subscription = require('../models/Subscription');

// ============================================
// GET DASHBOARD DATA
// ============================================
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user data
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User Data:', user);

    // Get recent transactions (last 5)
    const recentTransactions = await Transaction.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get saving goals
    const savingGoals = await SavingGoal.find({ userId, isDeleted: false, status: 'active' })
      .sort({ isMainGoal: -1, createdAt: -1 })
      .limit(5);

    // Get upcoming subscriptions (next 30 days)
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    const upcomingSubscriptions = await Subscription.find({
      userId,
      isDeleted: false,
      status: 'active',
      nextDueDate: { $gte: today, $lte: thirtyDaysLater }
    }).sort({ nextDueDate: 1 });

    res.status(200).json({
      success: true,
      data: {
        userData: {
          name: user.name,
          balance: user.balance,
          cardNumber: user.cardNumber,
          income: {
            amount: user.income.monthlyAmount,
            percentage: user.income.percentage
          },
          expense: {
            amount: user.expense.monthlyAmount,
            percentage: user.expense.percentage
          }
        },
        savingGoals: savingGoals.map(goal => ({
          id: goal._id,
          title: goal.name,
          current: goal.currentAmount,
          target: goal.targetAmount,
          color: goal.color,
          isMainGoal: goal.isMainGoal
        })),
        recentTransactions: recentTransactions.map(txn => ({
          id: txn._id,
          name: txn.name,
          category: txn.category,
          amount: txn.type === 'income' ? txn.amount : -txn.amount,
          type: txn.type,
          timestamp: txn.timestamp,
          icon: txn.icon
        })),
        upcomingBillsAndSubscriptions: upcomingSubscriptions.map(sub => ({
          id: sub._id,
          name: sub.name,
          icon: sub.icon,
          logo: sub.logo,
          amount: sub.amount,
          frequency: sub.frequency,
          dueDate: sub.nextDueDate,
          daysUntilDue: sub.daysUntilDue,
          category: sub.category
        }))
      }
    });

  } catch (error) {
    console.error('Get Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// ============================================
// GET USER PROFILE
// ============================================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// ============================================
// UPDATE USER PROFILE
// ============================================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phoneNumber, dateOfBirth, riskProfile, preferences } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (riskProfile) updateData.riskProfile = riskProfile;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// ============================================
// UPDATE PROFILE IMAGE
// ============================================
exports.updateProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const profileImagePath = `/uploads/profiles/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: profileImagePath },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      data: {
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error('Update Profile Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile image',
      error: error.message
    });
  }
};

// ============================================
// GET FINANCIAL SUMMARY
// ============================================
exports.getFinancialSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all transactions for current month
    const transactions = await Transaction.find({
      userId,
      isDeleted: false,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {};

    transactions.forEach(txn => {
      if (txn.type === 'income') {
        totalIncome += txn.amount;
      } else {
        totalExpense += txn.amount;
        
        if (!categoryBreakdown[txn.category]) {
          categoryBreakdown[txn.category] = 0;
        }
        categoryBreakdown[txn.category] += txn.amount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        categoryBreakdown,
        month: now.toLocaleString('default', { month: 'long', year: 'numeric' })
      }
    });

  } catch (error) {
    console.error('Get Financial Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching financial summary',
      error: error.message
    });
  }
};

// ============================================
// UPDATE RISK PROFILE
// ============================================
exports.updateRiskProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { riskProfile } = req.body;

    if (!['Low', 'Moderate', 'High'].includes(riskProfile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid risk profile. Must be Low, Moderate, or High'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { riskProfile },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Risk profile updated successfully',
      data: {
        riskProfile: user.riskProfile
      }
    });

  } catch (error) {
    console.error('Update Risk Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating risk profile',
      error: error.message
    });
  }
};

// ============================================
// GET USER PROFILE (Alias for voice agent)
// ============================================
exports.getUserProfile = async (req, res) => {
  return exports.getProfile(req, res);
};

// ============================================
// GET USER BALANCE
// ============================================
exports.getUserBalance = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('balance income expense');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        balance: user.balance,
        income: user.income,
        expense: user.expense
      }
    });

  } catch (error) {
    console.error('Get User Balance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching balance',
      error: error.message
    });
  }
};
