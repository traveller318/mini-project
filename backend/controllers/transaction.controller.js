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
// SCAN RECEIPT/DOCUMENT WITH OCR + AI
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
    const fullPath = `uploads/receipts/${req.file.filename}`;

    console.log('📸 Receipt uploaded:', req.file.filename);

    // Import OCR and Gemini services
    const { extractTextFromImage, validateOCRResult } = require('../utils/ocrService');
    const { parseReceiptWithGemini, validateTransactionData } = require('../utils/geminiService');

    // Step 1: Extract text from image using OCR
    console.log('🔍 Step 1: Extracting text with OCR...');
    const ocrResult = await extractTextFromImage(fullPath);

    // Validate OCR result
    const ocrValidation = validateOCRResult(ocrResult);
    if (!ocrValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract text from image. Please ensure the image is clear and readable.',
        warnings: ocrValidation.warnings
      });
    }

    // Step 2: Parse extracted text with Gemini AI
    console.log('🤖 Step 2: Parsing with Gemini AI...');
    const parsedData = await parseReceiptWithGemini(ocrResult.text);

    // Handle parsing failure with fallback
    if (!parsedData.success && parsedData.fallbackTransaction) {
      return res.status(200).json({
        success: true,
        message: 'Receipt scanned with limited accuracy. Please review the transaction details.',
        data: {
          receiptImage: receiptPath,
          merchantName: 'Unknown Merchant',
          totalAmount: parsedData.fallbackTransaction.amount,
          extractedTransactions: [parsedData.fallbackTransaction],
          ocrConfidence: ocrResult.confidence,
          parseConfidence: 'low',
          warnings: ['AI parsing failed. Using basic extraction.', ...ocrValidation.warnings]
        }
      });
    }

    // Validate transaction data
    const dataValidation = validateTransactionData(parsedData);

    // Step 3: Return parsed transaction data
    res.status(200).json({
      success: true,
      message: 'Receipt scanned successfully',
      data: {
        receiptImage: receiptPath,
        merchantName: parsedData.merchantName,
        totalAmount: parsedData.totalAmount,
        date: parsedData.date,
        time: parsedData.time,
        paymentMethod: parsedData.paymentMethod,
        extractedTransactions: parsedData.transactions,
        ocrConfidence: ocrResult.confidence,
        parseConfidence: parsedData.confidence,
        warnings: [...ocrValidation.warnings, ...dataValidation.warnings],
        quality: dataValidation.quality,
        metadata: {
          wordCount: ocrResult.wordCount,
          lineCount: ocrResult.lineCount,
          processingTime: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Scan Receipt Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scanning receipt',
      error: error.message,
      hint: 'Please ensure the image is clear and contains readable text'
    });
  }
};

// ============================================
// SAVE EXTRACTED TRANSACTIONS (BULK)
// ============================================
exports.saveExtractedTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { transactions, receiptImage, merchantName } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transactions provided'
      });
    }

    // Validate and save each transaction
    const savedTransactions = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i];
      
      try {
        // Validate required fields
        if (!txn.name || !txn.amount || !txn.type || !txn.category) {
          errors.push(`Transaction ${i + 1}: Missing required fields`);
          continue;
        }

        // Create transaction matching Transaction model
        const transaction = await Transaction.create({
          userId,
          // Basic info
          name: txn.name,
          description: txn.description || txn.name || '',
          amount: Math.abs(parseFloat(txn.amount)),
          type: txn.type,
          category: txn.category,
          
          // Display
          icon: txn.icon || 'ellipsis-horizontal-outline',
          color: txn.color || '#6B7280',
          
          // Date/Time
          date: txn.date ? new Date(txn.date) : new Date(),
          timestamp: txn.timestamp || new Date().toISOString(),
          
          // Payment
          paymentMethod: txn.paymentMethod || 'other',
          
          // Additional
          notes: txn.notes || '',
          tags: txn.tags || [],
          status: txn.status || 'completed',
          
          // Recurring (false for scanned receipts)
          isRecurring: false,
          recurringDetails: null,
          
          // Receipt info
          receipt: {
            hasReceipt: true,
            imageUri: receiptImage || '',
            fileName: txn.receipt?.fileName || '',
            fileSize: txn.receipt?.fileSize || 0,
            scannedData: {
              merchantName: merchantName || txn.metadata?.merchantName || '',
              totalAmount: txn.amount,
              ocrConfidence: txn.receipt?.scannedData?.ocrConfidence || 0,
              date: txn.date ? new Date(txn.date) : new Date()
            }
          },
          
          // Metadata
          metadata: {
            source: 'scanned',
            ...txn.metadata
          }
        });

        savedTransactions.push(transaction);

      } catch (txnError) {
        console.error(`Error saving transaction ${i + 1}:`, txnError.message);
        errors.push(`Transaction ${i + 1}: ${txnError.message}`);
      }
    }

    // Update user's income/expense totals
    if (savedTransactions.length > 0) {
      await updateUserFinancials(userId);
    }

    res.status(201).json({
      success: true,
      message: `Successfully saved ${savedTransactions.length} transaction(s)`,
      data: {
        savedTransactions,
        totalSaved: savedTransactions.length,
        totalFailed: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('❌ Save Extracted Transactions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving transactions',
      error: error.message
    });
  }
};

// ============================================
// SUGGEST CATEGORY USING AI
// ============================================
exports.suggestCategory = async (req, res) => {
  try {
    const { description, amount } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    const { suggestCategory } = require('../utils/geminiService');
    const suggestion = await suggestCategory(description, amount || 0);

    res.status(200).json({
      success: true,
      data: suggestion
    });

  } catch (error) {
    console.error('❌ Suggest Category Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error suggesting category',
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
