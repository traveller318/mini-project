const Transaction = require('../models/Transaction');
const User = require('../models/User');

// ============================================
// GET ALL TRANSACTIONS
// ============================================
exports.getAllTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50, type, category, startDate, endDate } = req.query;

    const query = { userId, isDeleted: false };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions: transactions.map(txn => ({
          id: txn._id,
          name: txn.name,
          category: txn.category,
          amount: txn.type === 'income' ? txn.amount : -txn.amount,
          type: txn.type,
          timestamp: txn.timestamp,
          date: txn.date,
          icon: txn.icon,
          description: txn.description,
          isRecurring: txn.isRecurring,
          recurringDetails: txn.recurringDetails
        })),
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalTransactions: count
      }
    });

  } catch (error) {
    console.error('Get All Transactions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// ============================================
// GET TRANSACTIONS BY CATEGORY
// ============================================
exports.getTransactionsByCategory = async (req, res) => {
  try {
    const userId = req.user._id;

    const transactions = await Transaction.find({ userId, isDeleted: false })
      .sort({ date: -1 });

    // Group by category
    const categoryMap = {};
    transactions.forEach(txn => {
      if (!categoryMap[txn.category]) {
        categoryMap[txn.category] = {
          name: txn.category,
          icon: txn.icon,
          color: txn.color,
          totalAmount: 0,
          transactions: []
        };
      }
      
      const amount = txn.type === 'income' ? txn.amount : -txn.amount;
      categoryMap[txn.category].totalAmount += amount;
      categoryMap[txn.category].transactions.push({
        id: txn._id,
        name: txn.name,
        amount,
        type: txn.type,
        date: txn.date,
        icon: txn.icon
      });
    });

    const categories = Object.values(categoryMap);

    res.status(200).json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Get Transactions By Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions by category',
      error: error.message
    });
  }
};

// ============================================
// CREATE TRANSACTION
// ============================================
exports.createTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      description,
      amount,
      type,
      category,
      icon,
      color,
      date,
      isRecurring,
      recurringDetails,
      paymentMethod,
      notes
    } = req.body;

    // Validation
    if (!name || !amount || !type || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      name,
      description: description || '',
      amount,
      type,
      category,
      icon: icon || 'ellipsis-horizontal-outline',
      color: color || '#A0A0A0',
      date: date || new Date(),
      timestamp: new Date().toISOString(),
      isRecurring: isRecurring || false,
      recurringDetails: isRecurring ? recurringDetails : null,
      paymentMethod: paymentMethod || 'other',
      notes: notes || '',
      metadata: {
        source: 'manual'
      }
    });

    // Update user's income/expense totals
    await updateUserFinancials(userId);

    // Check budget alerts if this is an expense
    if (type.toLowerCase() === 'expense') {
      try {
        const Budget = require('../models/Budget');
        const Notification = require('../models/Notification');
        
        // Find active budgets for this category
        const budgets = await Budget.find({
          userId,
          category,
          isDeleted: false,
          status: 'active',
          'alerts.enabled': true,
          startDate: { $lte: transaction.date },
          endDate: { $gte: transaction.date }
        });

        // Check alerts for each budget
        for (const budget of budgets) {
          // Recalculate budget spending
          const { updateBudgetSpending } = require('./budget.controller');
          await updateBudgetSpending(budget);

          const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;

          // Check each threshold
          for (const threshold of budget.alerts.thresholds) {
            if (percentage >= threshold.percentage && !threshold.triggered) {
              // Create notification
              await Notification.create({
                userId,
                type: percentage >= 100 ? 'budget_exceeded' : 'budget_alert',
                title: `Budget Alert: ${budget.category}`,
                message: `You've spent ${Math.round(percentage)}% of your ${budget.category} budget (₹${budget.spent.toLocaleString()} / ₹${budget.limit.toLocaleString()})`,
                icon: 'warning-outline',
                color: percentage >= 100 ? '#EF4444' : percentage >= 90 ? '#F59E0B' : '#3B82F6',
                priority: percentage >= 100 ? 'urgent' : percentage >= 90 ? 'high' : 'medium',
                relatedDocument: {
                  documentType: 'Budget',
                  documentId: budget._id
                }
              });

              // Mark threshold as triggered
              threshold.triggered = true;
              threshold.triggeredAt = new Date();
            }
          }

          budget.alerts.lastAlertSent = new Date();
          await budget.save();
        }
      } catch (budgetError) {
        console.error('Budget Alert Error:', budgetError);
        // Don't fail the transaction if budget check fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
};

// ============================================
// UPDATE TRANSACTION
// ============================================
exports.updateTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update user's income/expense totals
    await updateUserFinancials(userId);

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Update Transaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction',
      error: error.message
    });
  }
};

// ============================================
// DELETE TRANSACTION
// ============================================
exports.deleteTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update user's income/expense totals
    await updateUserFinancials(userId);

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Delete Transaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction',
      error: error.message
    });
  }
};

// ============================================
// SCAN RECEIPT/DOCUMENT
// ============================================
exports.scanReceipt = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const receiptPath = `/uploads/receipts/${req.file.filename}`;

    // TODO: Implement OCR/text recognition here
    // For now, return mock extracted data
    const extractedTransactions = [
      {
        name: 'Restaurant Bill',
        category: 'Food & Drink',
        amount: 850,
        type: 'expense',
        icon: '🍽️',
        description: 'Extracted from receipt'
      },
      {
        name: 'Coffee',
        category: 'Food & Drink',
        amount: 150,
        type: 'expense',
        icon: '☕',
        description: 'Extracted from receipt'
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Receipt scanned successfully',
      data: {
        receiptImage: receiptPath,
        extractedTransactions
      }
    });

  } catch (error) {
    console.error('Scan Receipt Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scanning receipt',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTION: UPDATE USER FINANCIALS
// ============================================
async function updateUserFinancials(userId) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current month transactions
    const transactions = await Transaction.find({
      userId,
      isDeleted: false,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(txn => {
      if (txn.type === 'income') {
        totalIncome += txn.amount;
      } else {
        totalExpense += txn.amount;
      }
    });

    // Update user
    await User.findByIdAndUpdate(userId, {
      'income.monthlyAmount': totalIncome,
      'expense.monthlyAmount': totalExpense,
      balance: totalIncome - totalExpense
    });

  } catch (error) {
    console.error('Update User Financials Error:', error);
  }
}
