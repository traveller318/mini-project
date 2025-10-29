/**
 * Check available Gemini models
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
  console.log('Testing Gemini API...\n');

  // Try different model names
  const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'models/gemini-pro',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello');
      const response = await result.response;
      const text = response.text();
      console.log(`✅ SUCCESS! Model ${modelName} works!`);
      console.log(`Response: ${text.substring(0, 50)}...\n`);
      return modelName;
    } catch (error) {
      console.log(`❌ Failed: ${error.message.substring(0, 100)}...\n`);
    }
  }

  console.log('No working model found. Please check your API key.');
}

checkModels();
