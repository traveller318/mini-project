const Subscription = require('../models/Subscription');

// ============================================
// GET ALL SUBSCRIPTIONS
// ============================================
exports.getAllSubscriptions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, category } = req.query;

    const query = { userId, isDeleted: false };
    if (status) query.status = status;
    if (category) query.category = category;

    const subscriptions = await Subscription.find(query)
      .sort({ nextDueDate: 1 });

    // Calculate daysUntilDue for each subscription
    const today = new Date();
    subscriptions.forEach(sub => {
      const dueDate = new Date(sub.nextDueDate || sub.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      sub.daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });

    res.status(200).json({
      success: true,
      data: { subscriptions }
    });

  } catch (error) {
    console.error('Get All Subscriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};

// ============================================
// GET UPCOMING SUBSCRIPTIONS
// ============================================
exports.getUpcomingSubscriptions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30 } = req.query;

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    const subscriptions = await Subscription.find({
      userId,
      isDeleted: false,
      status: 'active',
      $or: [
        { nextDueDate: { $gte: today, $lte: futureDate } },
        { dueDate: { $gte: today, $lte: futureDate } }
      ]
    }).sort({ nextDueDate: 1, dueDate: 1 });

    // Calculate daysUntilDue
    subscriptions.forEach(sub => {
      const dueDate = new Date(sub.nextDueDate || sub.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      sub.daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    });

    res.status(200).json({
      success: true,
      data: { subscriptions }
    });

  } catch (error) {
    console.error('Get Upcoming Subscriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming subscriptions',
      error: error.message
    });
  }
};

// ============================================
// GET SINGLE SUBSCRIPTION
// ============================================
exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const subscription = await Subscription.findOne({ _id: id, userId, isDeleted: false });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { subscription }
    });

  } catch (error) {
    console.error('Get Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message
    });
  }
};

// ============================================
// CREATE SUBSCRIPTION
// ============================================
exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      description,
      category,
      amount,
      frequency,
      startDate,
      endDate,
      dueDate,
      icon,
      logo,
      color
    } = req.body;

    // Validation
    if (!name || !category || !amount || !frequency || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Calculate next due date
    const nextDueDate = calculateNextDueDate(new Date(dueDate), frequency);

    // Create subscription
    const subscription = await Subscription.create({
      userId,
      name,
      description: description || '',
      category,
      amount,
      frequency,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      dueDate: new Date(dueDate),
      nextDueDate,
      icon: icon || 'ellipsis-horizontal',
      logo: logo || name.charAt(0).toLowerCase(),
      color: color || '#3B82F6',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: { subscription }
    });

  } catch (error) {
    console.error('Create Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message
    });
  }
};

// ============================================
// UPDATE SUBSCRIPTION
// ============================================
exports.updateSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updateData = req.body;

    const subscription = await Subscription.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: { subscription }
    });

  } catch (error) {
    console.error('Update Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription',
      error: error.message
    });
  }
};

// ============================================
// DELETE SUBSCRIPTION
// ============================================
exports.deleteSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const subscription = await Subscription.findOneAndUpdate(
      { _id: id, userId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully'
    });

  } catch (error) {
    console.error('Delete Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subscription',
      error: error.message
    });
  }
};

// ============================================
// RECORD PAYMENT
// ============================================
exports.recordPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { amount, paidOn, status, transactionId, note } = req.body;

    const subscription = await Subscription.findOne({ _id: id, userId, isDeleted: false });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Add payment to history
    subscription.paymentHistory.push({
      amount: amount || subscription.amount,
      paidOn: paidOn || new Date(),
      status: status || 'success',
      transactionId: transactionId || null,
      note: note || ''
    });

    // Update analytics
    if (status === 'success' || !status) {
      subscription.analytics.totalPaid += (amount || subscription.amount);
      subscription.analytics.paymentCount += 1;
      subscription.analytics.averagePayment = 
        subscription.analytics.totalPaid / subscription.analytics.paymentCount;
      subscription.analytics.lastPaymentDate = paidOn || new Date();

      // Calculate next due date
      subscription.nextDueDate = calculateNextDueDate(
        new Date(subscription.nextDueDate || subscription.dueDate),
        subscription.frequency
      );
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: { subscription }
    });

  } catch (error) {
    console.error('Record Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
};

// ============================================
// GET CALENDAR DATA
// ============================================
exports.getCalendarData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const subscriptions = await Subscription.find({
      userId,
      isDeleted: false,
      status: 'active',
      $or: [
        { nextDueDate: { $gte: startDate, $lte: endDate } },
        { dueDate: { $gte: startDate, $lte: endDate } }
      ]
    });

    // Format data for calendar
    const calendarData = {};
    subscriptions.forEach(sub => {
      const dueDate = (sub.nextDueDate || sub.dueDate).toISOString().split('T')[0];
      if (!calendarData[dueDate]) {
        calendarData[dueDate] = [];
      }
      calendarData[dueDate].push({
        id: sub._id,
        name: sub.name,
        amount: sub.amount,
        category: sub.category
      });
    });

    res.status(200).json({
      success: true,
      data: { calendarData }
    });

  } catch (error) {
    console.error('Get Calendar Data Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar data',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTION: CALCULATE NEXT DUE DATE
// ============================================
function calculateNextDueDate(currentDate, frequency) {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
}
