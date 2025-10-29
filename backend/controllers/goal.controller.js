const SavingGoal = require('../models/SavingGoal');

// ============================================
// GET ALL GOALS
// ============================================
exports.getAllGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const query = { userId, isDeleted: false };
    if (status) query.status = status;

    const goals = await SavingGoal.find(query)
      .sort({ isMainGoal: -1, priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { goals }
    });

  } catch (error) {
    console.error('Get All Goals Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching goals',
      error: error.message
    });
  }
};

// ============================================
// GET SINGLE GOAL
// ============================================
exports.getGoal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const goal = await SavingGoal.findOne({ _id: id, userId, isDeleted: false });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { goal }
    });

  } catch (error) {
    console.error('Get Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching goal',
      error: error.message
    });
  }
};

// ============================================
// CREATE GOAL
// ============================================
exports.createGoal = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      description,
      targetAmount,
      currentAmount,
      monthlyContribution,
      estimatedCompletion,
      category,
      color,
      icon
    } = req.body;

    // Validation
    if (!name || !targetAmount || !monthlyContribution || !estimatedCompletion) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create goal
    const goal = await SavingGoal.create({
      userId,
      name,
      description: description || '',
      targetAmount,
      currentAmount: currentAmount || 0,
      monthlyContribution,
      estimatedCompletion,
      category: category || 'other',
      color: color || '#3B82F6',
      icon: icon || 'wallet-outline',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: { goal }
    });

  } catch (error) {
    console.error('Create Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating goal',
      error: error.message
    });
  }
};

// ============================================
// UPDATE GOAL
// ============================================
exports.updateGoal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    const goal = await SavingGoal.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: { goal }
    });

  } catch (error) {
    console.error('Update Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating goal',
      error: error.message
    });
  }
};

// ============================================
// DELETE GOAL
// ============================================
exports.deleteGoal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const goal = await SavingGoal.findOneAndUpdate(
      { _id: id, userId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully'
    });

  } catch (error) {
    console.error('Delete Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting goal',
      error: error.message
    });
  }
};

// ============================================
// CONTRIBUTE TO GOAL
// ============================================
exports.contributeToGoal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { amount, date, note, source } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contribution amount'
      });
    }

    const goal = await SavingGoal.findOne({ _id: id, userId, isDeleted: false });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Add contribution
    goal.contributions.push({
      amount,
      date: date || new Date(),
      note: note || '',
      source: source || 'manual'
    });

    // Update current amount
    goal.currentAmount += amount;

    // Update analytics
    goal.analytics.totalContributed += amount;
    goal.analytics.contributionCount += 1;
    goal.analytics.averageMonthlyContribution = 
      goal.analytics.totalContributed / goal.analytics.contributionCount;

    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
      goal.actualCompletion = new Date();
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Contribution added successfully',
      data: { goal }
    });

  } catch (error) {
    console.error('Contribute To Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding contribution',
      error: error.message
    });
  }
};

// ============================================
// SET MAIN GOAL
// ============================================
exports.setMainGoal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Unset all main goals first
    await SavingGoal.updateMany(
      { userId },
      { isMainGoal: false }
    );

    // Set new main goal
    const goal = await SavingGoal.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { isMainGoal: true },
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Main goal set successfully',
      data: { goal }
    });

  } catch (error) {
    console.error('Set Main Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting main goal',
      error: error.message
    });
  }
};
