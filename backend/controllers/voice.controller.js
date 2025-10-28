const VoiceInteraction = require('../models/VoiceInteraction');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ============================================
// SAVE VOICE RECORDING
// ============================================
exports.saveVoiceRecording = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No voice file uploaded'
      });
    }

    const voicePath = `/uploads/voice/${req.file.filename}`;

    // Save voice interaction
    const voiceInteraction = await VoiceInteraction.create({
      userId,
      audioFile: voicePath,
      duration: req.body.duration || 0,
      query: req.body.query || '',
      status: 'processing'
    });

    // TODO: Implement voice-to-text processing
    // For now, return mock response
    setTimeout(async () => {
      voiceInteraction.transcript = 'Show me my spending report for this month';
      voiceInteraction.intent = 'spending_report';
      voiceInteraction.entities = { period: 'this_month' };
      voiceInteraction.response = 'Your total spending this month is ₹8,550. Your top category is Shopping at ₹2,100.';
      voiceInteraction.status = 'completed';
      await voiceInteraction.save();
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'Voice recording saved successfully',
      data: {
        voiceInteraction: {
          id: voiceInteraction._id,
          status: voiceInteraction.status
        }
      }
    });

  } catch (error) {
    console.error('Save Voice Recording Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving voice recording',
      error: error.message
    });
  }
};

// ============================================
// GET VOICE INTERACTION RESULT
// ============================================
exports.getVoiceResult = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const voiceInteraction = await VoiceInteraction.findOne({ _id: id, userId });

    if (!voiceInteraction) {
      return res.status(404).json({
        success: false,
        message: 'Voice interaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { voiceInteraction }
    });

  } catch (error) {
    console.error('Get Voice Result Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching voice result',
      error: error.message
    });
  }
};

// ============================================
// PROCESS VOICE QUERY
// ============================================
exports.processVoiceQuery = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    // Process query and determine intent
    const response = await processQuery(query, userId);

    // Save interaction
    await VoiceInteraction.create({
      userId,
      query,
      transcript: query,
      intent: response.intent,
      entities: response.entities,
      response: response.answer,
      status: 'completed'
    });

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Process Voice Query Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing voice query',
      error: error.message
    });
  }
};

// ============================================
// GET VOICE HISTORY
// ============================================
exports.getVoiceHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const interactions = await VoiceInteraction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await VoiceInteraction.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        interactions,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalInteractions: count
      }
    });

  } catch (error) {
    console.error('Get Voice History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching voice history',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTION: PROCESS QUERY
// ============================================
async function processQuery(query, userId) {
  const queryLower = query.toLowerCase();
  
  // Determine intent
  let intent = 'unknown';
  let answer = "I'm not sure how to help with that. Please try rephrasing your question.";
  let entities = {};
  let data = null;

  // Spending report
  if (queryLower.includes('spending') || queryLower.includes('expenses')) {
    intent = 'spending_report';
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactions = await Transaction.find({
      userId,
      isDeleted: false,
      type: 'expense',
      date: { $gte: monthStart }
    });

    const totalSpending = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    // Find top category
    const categoryTotals = {};
    transactions.forEach(txn => {
      categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.amount;
    });
    
    const topCategory = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])[0];

    answer = `Your total spending this month is ₹${totalSpending.toLocaleString()}. ${
      topCategory ? `Your top category is ${topCategory[0]} at ₹${topCategory[1].toLocaleString()}.` : ''
    }`;
    
    data = { totalSpending, topCategory: topCategory ? topCategory[0] : null };
  }
  
  // Recent transactions
  else if (queryLower.includes('recent') || queryLower.includes('latest transactions')) {
    intent = 'recent_transactions';
    
    const transactions = await Transaction.find({
      userId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(5);

    answer = `Here are your 5 most recent transactions: ${transactions.map(txn => 
      `${txn.name} - ₹${txn.amount}`
    ).join(', ')}`;
    
    data = transactions;
  }
  
  // Budget query
  else if (queryLower.includes('budget')) {
    intent = 'budget_query';
    
    const user = await User.findById(userId);
    answer = `Your current balance is ₹${user.balance.toLocaleString()}. Monthly income: ₹${user.income.monthlyAmount.toLocaleString()}, Monthly expenses: ₹${user.expense.monthlyAmount.toLocaleString()}.`;
    
    data = {
      balance: user.balance,
      income: user.income.monthlyAmount,
      expense: user.expense.monthlyAmount
    };
  }
  
  // Upcoming bills
  else if (queryLower.includes('upcoming') || queryLower.includes('bills')) {
    intent = 'upcoming_bills';
    answer = 'You can check your upcoming bills in the Subscriptions section.';
  }

  return {
    intent,
    answer,
    entities,
    data
  };
}
