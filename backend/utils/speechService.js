const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const path = require('path');

// Initialize Gemini AI
let genAI = null;
let fileManager = null;

try {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
  } else {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
    console.log('✅ Speech Service: Gemini AI initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI for Speech Service:', error.message);
}

/**
 * Load backend routes documentation
 */
const loadRoutesDocumentation = () => {
  try {
    const routesPath = path.join(__dirname, '../docs/backend_routes.json');
    const routesData = fs.readFileSync(routesPath, 'utf8');
    return JSON.parse(routesData);
  } catch (error) {
    console.error('❌ Failed to load routes documentation:', error.message);
    return null;
  }
};

/**
 * Get audio file MIME type based on extension
 */
const getAudioMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm'
  };
  return mimeTypes[ext] || 'audio/wav';
};

/**
 * Transcribe audio and understand intent using Gemini
 * This is the main function that combines transcription and intent detection
 * 
 * @param {string} audioFilePath - Path to the uploaded audio file
 * @returns {Promise<Object>} - Transcription, intent, and endpoint information
 */
const transcribeAndUnderstand = async (audioFilePath) => {
  try {
    console.log('🎤 Starting audio transcription and intent detection...');
    
    if (!genAI || !fileManager) {
      throw new Error('Gemini AI service not initialized. Check GEMINI_API_KEY in .env');
    }

    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Audio file not found');
    }

    // Load routes documentation
    const routesDoc = loadRoutesDocumentation();
    if (!routesDoc) {
      throw new Error('Failed to load routes documentation');
    }

    // Upload audio file to Gemini
    console.log('📤 Uploading audio file to Gemini...');
    const mimeType = getAudioMimeType(audioFilePath);
    
    const uploadResult = await fileManager.uploadFile(audioFilePath, {
      mimeType: mimeType,
      displayName: path.basename(audioFilePath)
    });

    console.log(`✅ Audio file uploaded: ${uploadResult.file.displayName}`);
    console.log(`📊 File URI: ${uploadResult.file.uri}`);

    // Use Gemini 1.5 Flash model (supports audio)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash'
    });

    // Create comprehensive prompt for audio analysis
    const prompt = `
You are a financial voice assistant. Listen to this audio recording and perform the following tasks:

1. **TRANSCRIBE** the audio accurately
2. **UNDERSTAND** the user's intent
3. **IDENTIFY** the appropriate API endpoint to call
4. **EXTRACT** any parameters from the query

AVAILABLE API ENDPOINTS:
${JSON.stringify(routesDoc.routes, null, 2)}

COMMON CATEGORIES:
${routesDoc.commonCategories.join(', ')}

EXAMPLE QUERIES AND RESPONSES:
${JSON.stringify(routesDoc.commonQueries, null, 2)}

RULES:
- Be precise with endpoint selection
- Extract all relevant parameters (category, dates, amounts, etc.)
- If the query is ambiguous, choose the most likely intent
- For budget queries, extract the category name
- For transaction queries, identify if they want to view, create, or analyze
- For time-based queries, determine the period (month, week, year)
- If category is mentioned, match it to the closest valid category from the list
- Return ONLY valid JSON, no markdown formatting

RESPOND IN THIS EXACT JSON FORMAT:
{
  "transcription": "exact words the user spoke",
  "confidence": 0.95,
  "intent": "descriptive intent like 'view_food_budget' or 'get_spending_report'",
  "endpoint": "/budgets or /transactions or /insights/spending etc",
  "method": "GET or POST or PUT or DELETE",
  "parameters": {
    "category": "Food",
    "period": "month"
  },
  "naturalQuery": "user-friendly version of the query",
  "requiresAuth": true
}

Now analyze the audio and return the JSON response:`;

    // Generate content with audio file
    console.log('🤖 Analyzing audio with Gemini...');
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    let textResponse = response.text();

    console.log('📝 Raw Gemini response received');

    // Clean response - remove markdown code blocks if present
    textResponse = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.log('Raw response:', textResponse.substring(0, 300));
      
      // Fallback: Try to extract JSON from response
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Gemini response as JSON');
      }
    }

    // Validate response structure
    if (!parsedResponse.transcription || !parsedResponse.endpoint) {
      throw new Error('Invalid response structure from Gemini');
    }

    console.log('✅ Audio transcription successful');
    console.log(`📝 Transcription: "${parsedResponse.transcription}"`);
    console.log(`🎯 Intent: ${parsedResponse.intent}`);
    console.log(`🔗 Endpoint: ${parsedResponse.method} ${parsedResponse.endpoint}`);

    // Delete uploaded file from Gemini (cleanup)
    try {
      await fileManager.deleteFile(uploadResult.file.name);
      console.log('🗑️  Cleaned up uploaded file from Gemini');
    } catch (cleanupError) {
      console.warn('⚠️  Failed to cleanup file:', cleanupError.message);
    }

    return {
      success: true,
      transcription: parsedResponse.transcription,
      confidence: parsedResponse.confidence || 0.9,
      intent: parsedResponse.intent,
      endpoint: parsedResponse.endpoint,
      method: parsedResponse.method || 'GET',
      parameters: parsedResponse.parameters || {},
      naturalQuery: parsedResponse.naturalQuery || parsedResponse.transcription,
      requiresAuth: parsedResponse.requiresAuth !== false,
      metadata: {
        audioFile: path.basename(audioFilePath),
        mimeType: mimeType,
        processingTime: Date.now()
      }
    };

  } catch (error) {
    console.error('❌ Audio transcription error:', error.message);
    
    return {
      success: false,
      error: error.message,
      transcription: '',
      confidence: 0,
      intent: 'unknown',
      endpoint: null,
      method: null,
      parameters: {},
      naturalQuery: '',
      requiresAuth: true
    };
  }
};

/**
 * Simple text-based query understanding (fallback or for direct text queries)
 * Used when audio transcription is already done or for testing
 * 
 * @param {string} queryText - Text query from user
 * @returns {Promise<Object>} - Intent and endpoint information
 */
const understandTextQuery = async (queryText) => {
  try {
    console.log('💬 Analyzing text query with Gemini...');
    
    if (!genAI) {
      throw new Error('Gemini AI service not initialized');
    }

    const routesDoc = loadRoutesDocumentation();
    if (!routesDoc) {
      throw new Error('Failed to load routes documentation');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are a financial voice assistant. Analyze this text query and determine the appropriate API endpoint to call.

USER QUERY: "${queryText}"

AVAILABLE API ENDPOINTS:
${JSON.stringify(routesDoc.routes, null, 2)}

COMMON CATEGORIES:
${routesDoc.commonCategories.join(', ')}

RESPOND IN THIS EXACT JSON FORMAT:
{
  "intent": "descriptive intent",
  "endpoint": "/budgets or /transactions etc",
  "method": "GET or POST",
  "parameters": {},
  "naturalQuery": "user-friendly version"
}

Return ONLY JSON, no markdown:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(textResponse);

    console.log(`✅ Text query analyzed: ${parsed.intent}`);

    return {
      success: true,
      intent: parsed.intent,
      endpoint: parsed.endpoint,
      method: parsed.method || 'GET',
      parameters: parsed.parameters || {},
      naturalQuery: parsed.naturalQuery || queryText,
      confidence: 0.95
    };

  } catch (error) {
    console.error('❌ Text query analysis error:', error.message);
    return {
      success: false,
      error: error.message,
      intent: 'unknown',
      endpoint: null
    };
  }
};

/**
 * Validate audio file before processing
 * @param {string} filePath - Path to audio file
 * @returns {Object} - Validation result
 */
const validateAudioFile = (filePath) => {
  const maxSize = 25 * 1024 * 1024; // 25MB
  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm'];

  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'File not found' };
  }

  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (stats.size > maxSize) {
    return { valid: false, error: 'File size exceeds 25MB limit' };
  }

  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}` };
  }

  return { 
    valid: true, 
    size: stats.size, 
    extension: ext,
    mimeType: getAudioMimeType(filePath)
  };
};

module.exports = {
  transcribeAndUnderstand,
  understandTextQuery,
  validateAudioFile,
  loadRoutesDocumentation
};
