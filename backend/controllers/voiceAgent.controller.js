const path = require('path');
const VoiceInteraction = require('../models/VoiceInteraction');
const { transcribeAndUnderstand, understandTextQuery, validateAudioFile } = require('../utils/speechService');
const { formatNaturalResponse, formatErrorResponse } = require('../utils/geminiService');

// Import controllers for direct execution
const budgetController = require('./budget.controller');
const transactionController = require('./transaction.controller');
const goalController = require('./goal.controller');
const subscriptionController = require('./subscription.controller');
const insightsController = require('./insights.controller');
const userController = require('./user.controller');
const investmentController = require('./investment.controller');

/**
 * Main Voice Agent Handler
 * Processes uploaded audio, transcribes it, understands intent, executes API, and returns natural response
 */
exports.handleVoiceAgent = async (req, res) => {
  const startTime = Date.now();
  let voiceInteraction = null;
  
  try {
    const userId = req.user._id;

    // Validate audio file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file uploaded'
      });
    }

    const audioPath = req.file.path;
    console.log('🎤 Voice Agent: Processing audio file:', req.file.filename);

    // Validate audio file
    const validation = validateAudioFile(audioPath);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Create voice interaction record (pending status)
    voiceInteraction = await VoiceInteraction.create({
      userId,
      recording: {
        uri: `/uploads/voice/${req.file.filename}`,
        duration: req.body.duration || 0,
        format: validation.extension.replace('.', ''),
        fileSize: validation.size,
        quality: 'high'
      },
      processingStatus: 'processing'
    });

    console.log('📝 Voice interaction created:', voiceInteraction._id);

    // Step 1: Transcribe audio and understand intent using Gemini
    console.log('🤖 Step 1: Transcribing and analyzing audio...');
    const transcriptionResult = await transcribeAndUnderstand(audioPath);

    if (!transcriptionResult.success) {
      throw new Error(transcriptionResult.error || 'Failed to transcribe audio');
    }

    // Update voice interaction with transcription
    voiceInteraction.transcription = {
      text: transcriptionResult.transcription,
      confidence: transcriptionResult.confidence * 100,
      language: 'en-US',
      processingTime: Date.now() - startTime
    };

    console.log(`✅ Transcription: "${transcriptionResult.transcription}"`);
    console.log(`🎯 Intent: ${transcriptionResult.intent}`);
    console.log(`🔗 Endpoint: ${transcriptionResult.method} ${transcriptionResult.endpoint}`);

    // Step 2: Execute the appropriate API endpoint
    console.log('⚙️  Step 2: Executing API endpoint...');
    const apiResult = await executeEndpoint(
      transcriptionResult.endpoint,
      transcriptionResult.method,
      transcriptionResult.parameters,
      req.user
    );

    if (!apiResult.success) {
      throw new Error(apiResult.error || 'Failed to execute API endpoint');
    }

    console.log('✅ API execution successful');

    // Step 3: Format response into natural language
    console.log('💬 Step 3: Formatting natural language response...');
    const naturalResponse = await formatNaturalResponse(
      apiResult.data,
      transcriptionResult.intent,
      transcriptionResult.transcription
    );

    // Update voice interaction with complete information
    voiceInteraction.intent = {
      type: mapIntentToType(transcriptionResult.intent),
      confidence: transcriptionResult.confidence * 100,
      entities: Object.entries(transcriptionResult.parameters).map(([key, value]) => ({
        type: key,
        value: value,
        confidence: 90
      }))
    };

    voiceInteraction.response = {
      text: naturalResponse.response,
      type: 'information',
      actionTaken: 'data_retrieved'
    };

    voiceInteraction.processingStatus = 'completed';
    voiceInteraction.metadata = {
      modelVersion: '1.0.0',
      processingEngine: 'google',
      totalProcessingTime: Date.now() - startTime
    };

    await voiceInteraction.save();

    console.log(`✅ Voice Agent completed in ${Date.now() - startTime}ms`);

    // Return response to frontend
    res.status(200).json({
      success: true,
      message: 'Voice query processed successfully',
      data: {
        interactionId: voiceInteraction._id,
        transcription: transcriptionResult.transcription,
        intent: transcriptionResult.intent,
        response: naturalResponse.response,
        confidence: transcriptionResult.confidence,
        processingTime: Date.now() - startTime,
        apiData: apiResult.data // Include raw data for frontend display if needed
      }
    });

  } catch (error) {
    console.error('❌ Voice Agent Error:', error.message);

    // Generate user-friendly error message
    const errorResponse = await formatErrorResponse(
      req.body.query || 'your request',
      error.message
    );

    // Update voice interaction with error
    if (voiceInteraction) {
      voiceInteraction.processingStatus = 'failed';
      voiceInteraction.error = {
        hasError: true,
        errorType: 'action_failed',
        errorMessage: error.message
      };
      voiceInteraction.response = {
        text: errorResponse,
        type: 'error',
        actionTaken: 'none'
      };
      await voiceInteraction.save();
    }

    res.status(500).json({
      success: false,
      message: errorResponse,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      data: {
        interactionId: voiceInteraction?._id
      }
    });
  }
};

/**
 * Handle quick questions (predefined queries without audio)
 */
exports.handleQuickQuestion = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user._id;
    const { question, type } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    console.log('⚡ Quick Question:', question);

    // Create voice interaction record
    const voiceInteraction = await VoiceInteraction.create({
      userId,
      transcription: { text: question, confidence: 100, language: 'en-US' },
      isQuickQuestion: true,
      quickQuestionType: type || null,
      processingStatus: 'processing'
    });

    // Understand text query
    const queryResult = await understandTextQuery(question);

    if (!queryResult.success) {
      throw new Error('Failed to understand query');
    }

    // Execute endpoint
    const apiResult = await executeEndpoint(
      queryResult.endpoint,
      queryResult.method,
      queryResult.parameters,
      req.user
    );

    if (!apiResult.success) {
      throw new Error(apiResult.error);
    }

    // Format natural response
    const naturalResponse = await formatNaturalResponse(
      apiResult.data,
      queryResult.intent,
      question
    );

    // Update voice interaction
    voiceInteraction.intent = {
      type: mapIntentToType(queryResult.intent),
      confidence: 100,
      entities: []
    };
    voiceInteraction.response = {
      text: naturalResponse.response,
      type: 'information',
      actionTaken: 'data_retrieved'
    };
    voiceInteraction.processingStatus = 'completed';
    voiceInteraction.metadata = {
      totalProcessingTime: Date.now() - startTime
    };
    await voiceInteraction.save();

    res.status(200).json({
      success: true,
      message: 'Quick question processed',
      data: {
        interactionId: voiceInteraction._id,
        question: question,
        response: naturalResponse.response,
        apiData: apiResult.data,
        processingTime: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('❌ Quick Question Error:', error.message);
    
    const errorResponse = await formatErrorResponse(
      req.body.question || 'your question',
      error.message
    );

    res.status(500).json({
      success: false,
      message: errorResponse,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Execute API endpoint based on Gemini's analysis
 * This function routes to the appropriate controller
 */
async function executeEndpoint(endpoint, method, parameters, user) {
  try {
    console.log(`🔧 Executing: ${method} ${endpoint} with params:`, parameters);

    // Create mock request and response objects
    const mockReq = {
      user: user,
      query: parameters,
      params: {},
      body: parameters
    };

    let responseData = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseData = data;
          return data;
        }
      }),
      json: (data) => {
        responseData = data;
        return data;
      }
    };

    // Route to appropriate controller based on endpoint
    // Clean endpoint (remove leading/trailing slashes)
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
    const parts = cleanEndpoint.split('/');
    
    if (endpoint.startsWith('/budgets')) {
      // Check if there's an ID after /budgets/
      if (parts.length > 1 && parts[1]) {
        const id = parts[1];
        mockReq.params.id = id;
        await budgetController.getBudgetById(mockReq, mockRes);
      } else {
        // Use correct function name: getAllBudgets
        await budgetController.getAllBudgets(mockReq, mockRes);
      }
    } 
    else if (endpoint.startsWith('/transactions')) {
      if (parts.length > 1 && parts[1]) {
        const id = parts[1];
        mockReq.params.id = id;
        // Note: No getTransactionById in controller, using getAllTransactions
        await transactionController.getAllTransactions(mockReq, mockRes);
      } else {
        // Use correct function name: getAllTransactions
        await transactionController.getAllTransactions(mockReq, mockRes);
      }
    }
    else if (endpoint.startsWith('/goals')) {
      if (parts.length > 1 && parts[1]) {
        const id = parts[1];
        mockReq.params.id = id;
        // Use correct function name: getGoal
        await goalController.getGoal(mockReq, mockRes);
      } else {
        // Use correct function name: getAllGoals
        await goalController.getAllGoals(mockReq, mockRes);
      }
    }
    else if (endpoint.startsWith('/subscriptions')) {
      if (endpoint.includes('/upcoming')) {
        await subscriptionController.getUpcomingSubscriptions(mockReq, mockRes);
      } else if (parts.length > 1 && parts[1]) {
        const id = parts[1];
        mockReq.params.id = id;
        // Use correct function name: getSubscription
        await subscriptionController.getSubscription(mockReq, mockRes);
      } else {
        // Use correct function name: getAllSubscriptions
        await subscriptionController.getAllSubscriptions(mockReq, mockRes);
      }
    }
    else if (endpoint.startsWith('/insights')) {
      if (endpoint.includes('/spending') || endpoint.includes('/expense')) {
        // Use correct function name: getExpenseDistribution
        await insightsController.getExpenseDistribution(mockReq, mockRes);
      } else if (endpoint.includes('/category') || endpoint.includes('/trends')) {
        // Use correct function name: getCategoryTrends
        await insightsController.getCategoryTrends(mockReq, mockRes);
      } else {
        // Default to getInsights
        await insightsController.getInsights(mockReq, mockRes);
      }
    }
    else if (endpoint.startsWith('/users')) {
      if (endpoint.includes('/balance')) {
        await userController.getUserBalance(mockReq, mockRes);
      } else if (endpoint.includes('/profile')) {
        await userController.getUserProfile(mockReq, mockRes);
      } else {
        await userController.getUserProfile(mockReq, mockRes);
      }
    }
    else if (endpoint.startsWith('/investments')) {
      await investmentController.getInvestmentRecommendations(mockReq, mockRes);
    }
    else {
      throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    // Extract data from response
    if (responseData && responseData.success) {
      return {
        success: true,
        data: responseData.data || responseData
      };
    } else {
      throw new Error(responseData?.message || 'API execution failed');
    }

  } catch (error) {
    console.error('❌ Endpoint execution error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Map intent string to VoiceInteraction schema enum
 */
function mapIntentToType(intent) {
  const mapping = {
    'add_transaction': 'add_transaction',
    'view_transactions': 'view_transactions',
    'recent_transactions': 'view_transactions',
    'view_balance': 'view_balance',
    'get_balance': 'view_balance',
    'set_budget': 'set_budget',
    'view_budget': 'set_budget',
    'get_budget': 'set_budget',
    'view_goals': 'view_goals',
    'get_goals': 'view_goals',
    'add_goal': 'add_goal',
    'view_subscriptions': 'view_subscriptions',
    'get_subscriptions': 'view_subscriptions',
    'upcoming_bills': 'view_subscriptions',
    'view_insights': 'view_insights',
    'spending_report': 'view_insights',
    'get_advice': 'get_advice'
  };

  // Check if intent contains any of these keywords
  for (const [key, value] of Object.entries(mapping)) {
    if (intent.toLowerCase().includes(key)) {
      return value;
    }
  }

  return 'other';
}
