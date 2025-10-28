const Transaction = require('../models/Transaction');
const User = require('../models/User');

// ============================================
// GET ALL TRANSACTIONS
// ============================================
exports.getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
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
    const userId = req.user.userId;

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
    const userId = req.user.userId;
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
    const userId = req.user.userId;
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
    const userId = req.user.userId;
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
    const userId = req.user.userId;

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
