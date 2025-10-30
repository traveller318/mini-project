const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
let genAI = null;
try {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
  } else {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
}

/**
 * Category mapping with icons - STRICT CATEGORIES ONLY
 * These are the ONLY valid categories. Any other category should default to "Other"
 */
const categoryMappings = {
  // Expense categories
  'Food': { icon: 'fast-food-outline', color: '#EF4444' },
  'Transport': { icon: 'car-outline', color: '#F59E0B' },
  'Shopping': { icon: 'cart-outline', color: '#8B5CF6' },
  'Entertainment': { icon: 'game-controller-outline', color: '#EC4899' },
  'Bills': { icon: 'receipt-outline', color: '#14B8A6' },
  'Health': { icon: 'medical-outline', color: '#EF4444' },
  'Education': { icon: 'school-outline', color: '#3B82F6' },
  'Travel': { icon: 'airplane-outline', color: '#06B6D4' },
  'Groceries': { icon: 'basket-outline', color: '#10B981' },
  'Rent': { icon: 'home-outline', color: '#6366F1' },
  'Other': { icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
  
  // Income categories
  'Salary': { icon: 'cash-outline', color: '#10B981' },
  'Business': { icon: 'briefcase-outline', color: '#3B82F6' },
  'Investment': { icon: 'trending-up-outline', color: '#8B5CF6' },
  'Freelance': { icon: 'laptop-outline', color: '#06B6D4' },
  'Gift': { icon: 'gift-outline', color: '#EC4899' }
};

/**
 * Valid categories list
 */
const VALID_EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Travel', 'Groceries', 'Rent', 'Other'];
const VALID_INCOME_CATEGORIES = ['Salary', 'Business', 'Investment', 'Freelance', 'Gift', 'Other'];

/**
 * Get category icon and color - Validates category against strict list
 */
const getCategoryMetadata = (category, type = 'expense') => {
  // Validate category is in the allowed list
  const validCategories = type === 'income' ? VALID_INCOME_CATEGORIES : VALID_EXPENSE_CATEGORIES;
  
  // If category is not valid, default to "Other"
  if (!validCategories.includes(category)) {
    console.warn(`⚠️  Invalid category "${category}" detected. Defaulting to "Other"`);
    return { icon: 'ellipsis-horizontal-outline', color: '#6B7280' };
  }
  
  return categoryMappings[category] || { icon: 'ellipsis-horizontal-outline', color: '#6B7280' };
};

/**
 * Parse receipt/bill text using Gemini AI
 * @param {string} extractedText - Text extracted from OCR
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Parsed transaction data
 */
const parseReceiptWithGemini = async (extractedText, options = {}) => {
  try {
    console.log('🤖 Starting Gemini AI parsing...');
    
    if (!extractedText || extractedText.length < 5) {
      throw new Error('Insufficient text to parse');
    }

    if (!genAI) {
      console.error('❌ Gemini AI not initialized. Check GEMINI_API_KEY in .env file');
      throw new Error('Gemini AI service not available. Please configure GEMINI_API_KEY');
    }

    // Use gemini-2.5-flash model only
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('📡 Using model: gemini-2.5-flash');

    // Create a detailed prompt for transaction extraction
    const prompt = `
You are a financial transaction parser. Analyze the following receipt/bill text and extract transaction details.

RECEIPT TEXT:
${extractedText}

INSTRUCTIONS:
1. Identify ALL individual items/transactions with their amounts
2. Extract merchant/vendor name if present
3. Detect transaction date and time if available
4. Categorize each transaction appropriately
5. Identify if this is a single transaction or multiple items
6. Extract payment method if mentioned
7. Calculate totals and subtotals

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown or extra text
- Amounts should be positive numbers (we'll handle expense/income separately)
- Use Indian Rupee (₹) currency format
- If date is not found, use current date
- Categorize intelligently based on merchant name and items
- Split itemized bills into individual transactions

STRICT CATEGORIES - USE ONLY THESE (if category doesn't fit, use "Other"):
Expense ONLY: Food, Transport, Shopping, Entertainment, Bills, Health, Education, Travel, Groceries, Rent, Other
Income ONLY: Salary, Business, Investment, Freelance, Gift, Other

CATEGORY RULES:
- Food: Restaurants, cafes, snacks, dining out
- Groceries: Supermarkets, vegetables, daily essentials
- Transport: Uber, taxi, fuel, parking, metro
- Bills: Electricity, water, phone, internet
- Shopping: Clothing, electronics, general purchases
- Entertainment: Movies, concerts, gaming, subscriptions
- Health: Doctor, medicine, hospital, pharmacy
- Education: Books, courses, tuition
- Travel: Hotels, flights, vacation expenses
- Rent: House rent, office rent
- Other: Anything that doesn't fit above categories, Other

OUTPUT FORMAT (JSON) - Must match Transaction model exactly:
{
  "merchantName": "Vendor/Store Name",
  "totalAmount": 1000,
  "date": "2024-10-30",
  "time": "14:30",
  "paymentMethod": "cash/card/upi/bank_transfer/wallet/other",
  "transactions": [
    {
      "name": "Item Description",
      "description": "Detailed description",
      "amount": 100,
      "type": "expense",
      "category": "Groceries",
      "icon": "basket-outline",
      "color": "#10B981",
      "paymentMethod": "card",
      "notes": "",
      "tags": []
    }
  ],
  "confidence": "high/medium/low",
  "notes": "Additional context if needed"
}

Now parse the receipt text above and return ONLY the JSON response:`;

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log('📝 Raw Gemini response received');

    // Clean the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.log('Raw response:', text.substring(0, 200));
      
      // Fallback: Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Gemini response as JSON');
      }
    }

    // Validate and enrich the parsed data - Match Transaction model structure
    const enrichedTransactions = parsedData.transactions.map((txn, index) => {
      const txnType = txn.type || 'expense';
      
      // Validate and fix category
      let category = txn.category || 'Other';
      const validCategories = txnType === 'income' ? VALID_INCOME_CATEGORIES : VALID_EXPENSE_CATEGORIES;
      
      // If category is not in the valid list, default to "Other"
      if (!validCategories.includes(category)) {
        console.warn(`⚠️  Invalid category "${category}" for ${txnType}. Setting to "Other"`);
        category = 'Other';
      }
      
      const metadata = getCategoryMetadata(category, txnType);
      
      // Build transaction object matching Transaction model
      return {
        // Temporary ID for frontend tracking
        id: `extracted_${Date.now()}_${index}`,
        
        // Required fields
        name: txn.name || 'Unknown Item',
        description: txn.description || txn.name || '',
        amount: Math.abs(parseFloat(txn.amount) || 0),
        type: txnType,
        category: category,
        
        // Display fields
        icon: metadata.icon,
        color: metadata.color,
        
        // Date/Time
        date: parsedData.date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        
        // Payment
        paymentMethod: txn.paymentMethod || parsedData.paymentMethod || 'other',
        
        // Additional fields
        notes: txn.notes || '',
        tags: txn.tags || [],
        
        // Status
        status: 'completed',
        
        // Receipt information
        receipt: {
          hasReceipt: true,
          imageUri: '', // Will be set when saving
          scannedData: {
            merchantName: parsedData.merchantName,
            totalAmount: parsedData.totalAmount,
            ocrConfidence: parsedData.confidence === 'high' ? 90 : parsedData.confidence === 'medium' ? 70 : 50
          }
        },
        
        // Metadata matching model
        metadata: {
          source: 'scanned',
          merchantName: parsedData.merchantName,
          confidence: parsedData.confidence || 'medium',
          extractedAt: new Date().toISOString()
        }
      };
    });

    console.log(`✅ Successfully parsed ${enrichedTransactions.length} transactions`);

    return {
      success: true,
      merchantName: parsedData.merchantName || 'Unknown Merchant',
      totalAmount: parsedData.totalAmount || 0,
      date: parsedData.date || new Date().toISOString().split('T')[0],
      time: parsedData.time || '',
      paymentMethod: parsedData.paymentMethod || 'other',
      transactions: enrichedTransactions,
      confidence: parsedData.confidence || 'medium',
      notes: parsedData.notes || '',
      rawText: extractedText
    };

  } catch (error) {
    console.error('❌ Gemini Parsing Error:', error.message);
    
    // Fallback: Create a basic transaction if parsing fails
    return {
      success: false,
      error: error.message,
      fallbackTransaction: createFallbackTransaction(extractedText)
    };
  }
};

/**
 * Create a fallback transaction when AI parsing fails
 * @param {string} text - Extracted text
 * @returns {Object} - Basic transaction object
 */
const createFallbackTransaction = (text) => {
  // Try to extract amount using regex
  const amountPatterns = [
    /₹\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    /INR\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
    /\d+(?:,\d+)*(?:\.\d{2})?/
  ];

  let amount = 0;
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseFloat(match[1]?.replace(/,/g, '') || match[0].replace(/,/g, ''));
      break;
    }
  }

  return {
    // Temporary ID
    id: `fallback_${Date.now()}`,
    
    // Required fields
    name: 'Transaction from Receipt',
    description: text.substring(0, 100),
    amount: amount || 0,
    type: 'expense',
    category: 'Other',
    
    // Display
    icon: 'receipt-outline',
    color: '#6B7280',
    
    // Date/Time
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    
    // Payment
    paymentMethod: 'other',
    
    // Additional
    notes: '',
    tags: [],
    status: 'completed',
    
    // Receipt info
    receipt: {
      hasReceipt: true,
      imageUri: '',
      scannedData: {
        ocrConfidence: 20
      }
    },
    
    // Metadata
    metadata: {
      source: 'scanned',
      confidence: 'low',
      extractedAt: new Date().toISOString()
    }
  };
};

/**
 * Validate transaction data quality
 * @param {Object} transactionData - Parsed transaction data
 * @returns {Object} - Validation result
 */
const validateTransactionData = (transactionData) => {
  const warnings = [];
  const errors = [];

  if (!transactionData.transactions || transactionData.transactions.length === 0) {
    errors.push('No transactions extracted');
  }

  transactionData.transactions?.forEach((txn, index) => {
    if (!txn.amount || txn.amount <= 0) {
      warnings.push(`Transaction ${index + 1}: Amount is missing or invalid`);
    }
    if (!txn.name || txn.name.length < 2) {
      warnings.push(`Transaction ${index + 1}: Description is too short`);
    }
    if (!txn.category) {
      warnings.push(`Transaction ${index + 1}: Category is missing`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    quality: errors.length > 0 ? 'invalid' : warnings.length > 2 ? 'fair' : 'good'
  };
};

/**
 * Smart categorization using AI (for manual entry)
 * @param {string} description - Transaction description
 * @param {number} amount - Transaction amount
 * @returns {Promise<Object>} - Suggested category
 */
const suggestCategory = async (description, amount) => {
  try {
    if (!genAI) {
      throw new Error('Gemini AI service not available');
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Categorize this transaction:
Description: "${description}"
Amount: ₹${amount}

Choose EXACTLY ONE category from the list below. If the transaction doesn't clearly fit any category, choose "Other".

STRICT CATEGORIES - CHOOSE ONLY FROM THESE:
Expense: Food, Transport, Shopping, Entertainment, Bills, Health, Education, Travel, Groceries, Rent, Other
Income: Salary, Business, Investment, Freelance, Gift, Other

CATEGORY DEFINITIONS:
- Food: Restaurants, cafes, dining out
- Groceries: Supermarket, vegetables, daily essentials
- Transport: Uber, taxi, fuel, parking
- Bills: Electricity, water, phone bills
- Shopping: Clothing, electronics, general shopping
- Entertainment: Movies, concerts, subscriptions
- Health: Doctor, medicine, pharmacy
- Education: Books, courses, tuition
- Travel: Hotels, flights, vacation
- Rent: House rent, office rent
- Salary: Monthly salary, wages
- Business: Business income, sales
- Investment: Stock gains, dividends
- Freelance: Freelance work, gigs
- Gift: Money gifts received
- Other: Anything else

Return ONLY the category name from the list above, nothing else. No explanations, just the category name.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let category = response.text().trim();

    // Determine if it's income or expense based on common patterns
    const incomeKeywords = ['salary', 'income', 'received', 'payment received', 'freelance', 'business', 'investment'];
    const isIncome = incomeKeywords.some(keyword => description.toLowerCase().includes(keyword));
    const txnType = isIncome ? 'income' : 'expense';

    // Validate category against strict list
    const validCategories = txnType === 'income' ? VALID_INCOME_CATEGORIES : VALID_EXPENSE_CATEGORIES;
    if (!validCategories.includes(category)) {
      console.warn(`⚠️  AI suggested invalid category "${category}". Defaulting to "Other"`);
      category = 'Other';
    }

    const metadata = getCategoryMetadata(category, txnType);

    return {
      category,
      icon: metadata.icon,
      color: metadata.color,
      confidence: 'high',
      type: txnType
    };

  } catch (error) {
    console.error('Category Suggestion Error:', error.message);
    return {
      category: 'Other',
      icon: 'ellipsis-horizontal-outline',
      color: '#6B7280',
      confidence: 'low',
      type: 'expense'
    };
  }
};

/**
 * Format API response data into natural language for voice agent
 * @param {Object} apiData - Raw data from API endpoint
 * @param {string} intent - User's original intent
 * @param {string} query - User's original query
 * @returns {Promise<Object>} - Natural language response
 */
const formatNaturalResponse = async (apiData, intent, query) => {
  try {
    console.log('🗣️  Formatting natural language response...');
    
    if (!genAI) {
      throw new Error('Gemini AI service not available');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create context-aware prompt
    const prompt = `
You are a friendly financial voice assistant. The user asked: "${query}"

Their intent was: ${intent}

Here is the data retrieved from the backend:
${JSON.stringify(apiData, null, 2)}

TASK: Convert this data into a natural, conversational response that:
1. Directly answers the user's question
2. Highlights key numbers and insights
3. Is concise but informative (2-4 sentences)
4. Uses a friendly, helpful tone
5. Mentions currency as "rupees" or uses ₹ symbol
6. Provides actionable insights when relevant

EXAMPLES:

Query: "What is my food budget?"
Response: "Your food budget is set at ₹5,000 for this month. You've spent ₹3,200 so far, which is 64% of your budget. You have ₹1,800 remaining."

Query: "Show my recent transactions"
Response: "Here are your 5 most recent transactions: Coffee at Starbucks for ₹450, Uber ride for ₹280, Grocery shopping for ₹1,200, Netflix subscription for ₹649, and Dinner at Pizza Hut for ₹890."

Query: "What's my balance?"
Response: "Your current balance is ₹45,320. Your monthly income is ₹75,000 and you've spent ₹29,680 this month."

Now generate a natural response for the user's query. Return ONLY the response text, no JSON, no markdown, just the natural language answer:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const naturalResponse = response.text().trim();

    console.log('✅ Natural response generated');
    console.log(`💬 Response: "${naturalResponse.substring(0, 100)}..."`);

    return {
      success: true,
      response: naturalResponse,
      intent: intent,
      originalQuery: query
    };

  } catch (error) {
    console.error('❌ Natural response formatting error:', error.message);
    
    // Fallback: Create a basic response
    return {
      success: false,
      response: 'I found the information you requested. Please check your screen for details.',
      error: error.message
    };
  }
};

/**
 * Generate a helpful error message when API call fails
 * @param {string} query - User's query
 * @param {string} errorMessage - Error from API
 * @returns {Promise<string>} - User-friendly error message
 */
const formatErrorResponse = async (query, errorMessage) => {
  try {
    if (!genAI) {
      return "I'm sorry, I couldn't process your request. Please try again.";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
The user asked: "${query}"

But we encountered an error: ${errorMessage}

Generate a friendly, helpful error message that:
1. Apologizes for the issue
2. Suggests what might be wrong
3. Tells them what to do next
4. Keeps it concise (1-2 sentences)

Return ONLY the message text:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();

  } catch (error) {
    return "I'm sorry, I couldn't process your request. Please try again or rephrase your question.";
  }
};

module.exports = {
  parseReceiptWithGemini,
  createFallbackTransaction,
  validateTransactionData,
  suggestCategory,
  getCategoryMetadata,
  formatNaturalResponse,
  formatErrorResponse
};
