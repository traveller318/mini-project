/**
 * Test Script for Receipt Scanner Feature
 * 
 * This script tests the OCR and Gemini AI integration
 * Run with: node test-receipt-scanner.js
 */

require('dotenv').config();

const { extractTextFromImage, validateOCRResult } = require('./utils/ocrService');
const { parseReceiptWithGemini, validateTransactionData } = require('./utils/geminiService');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Test with sample receipt text
 */
async function testWithSampleText() {
  console.log(`\n${colors.cyan}${colors.bright}=== Testing with Sample Receipt Text ===${colors.reset}\n`);

  const sampleReceiptText = `
    ABC Restaurant
    123 Main Street, Mumbai
    Date: 30-10-2024  Time: 14:30
    
    Bill No: 12345
    
    Items:
    1. Chicken Burger       ₹350.00
    2. French Fries         ₹150.00
    3. Coke                 ₹80.00
    4. Ice Cream            ₹120.00
    
    Subtotal:               ₹700.00
    Tax (5%):               ₹35.00
    Service Charge:         ₹50.00
    -------------------------
    Total:                  ₹785.00
    
    Payment: Card
    Card No: ****1234
    
    Thank you for visiting!
  `;

  try {
    console.log(`${colors.blue}📝 Sample receipt text:${colors.reset}`);
    console.log(sampleReceiptText.trim());
    console.log(`\n${colors.yellow}⏳ Parsing with Gemini AI...${colors.reset}`);

    const parsedData = await parseReceiptWithGemini(sampleReceiptText);

    console.log(`\n${colors.green}✅ Parsing completed!${colors.reset}`);
    console.log(`\n${colors.bright}Parsed Data:${colors.reset}`);
    console.log(JSON.stringify(parsedData, null, 2));

    // Validate the parsed data
    const validation = validateTransactionData(parsedData);
    console.log(`\n${colors.bright}Validation Result:${colors.reset}`);
    console.log(`Quality: ${validation.quality}`);
    console.log(`Valid: ${validation.isValid ? colors.green + 'Yes' + colors.reset : colors.red + 'No' + colors.reset}`);
    
    if (validation.warnings.length > 0) {
      console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
      validation.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    }

    if (validation.errors.length > 0) {
      console.log(`\n${colors.red}Errors:${colors.reset}`);
      validation.errors.forEach(e => console.log(`  ❌ ${e}`));
    }

    console.log(`\n${colors.green}${colors.bright}✓ Sample text test passed!${colors.reset}`);
    return true;

  } catch (error) {
    console.error(`\n${colors.red}❌ Test failed:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Test category suggestion
 */
async function testCategorySuggestion() {
  console.log(`\n${colors.cyan}${colors.bright}=== Testing Category Suggestion ===${colors.reset}\n`);

  const testCases = [
    { description: 'Uber ride to airport', amount: 450 },
    { description: 'Netflix subscription', amount: 499 },
    { description: 'Pizza from Dominos', amount: 599 },
    { description: 'Doctor consultation', amount: 800 },
    { description: 'Monthly salary', amount: 50000 }
  ];

  try {
    const { suggestCategory } = require('./utils/geminiService');

    for (const testCase of testCases) {
      console.log(`\n${colors.blue}Testing:${colors.reset} "${testCase.description}" (₹${testCase.amount})`);
      console.log(`${colors.yellow}⏳ Getting suggestion...${colors.reset}`);

      const suggestion = await suggestCategory(testCase.description, testCase.amount);

      console.log(`${colors.green}✓ Category:${colors.reset} ${suggestion.category}`);
      console.log(`  Icon: ${suggestion.icon}`);
      console.log(`  Color: ${suggestion.color}`);
      console.log(`  Confidence: ${suggestion.confidence}`);
    }

    console.log(`\n${colors.green}${colors.bright}✓ Category suggestion tests passed!${colors.reset}`);
    return true;

  } catch (error) {
    console.error(`\n${colors.red}❌ Test failed:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Test with actual image file (if provided)
 */
async function testWithImageFile(imagePath) {
  console.log(`\n${colors.cyan}${colors.bright}=== Testing with Image File ===${colors.reset}\n`);

  const fs = require('fs');

  if (!imagePath || !fs.existsSync(imagePath)) {
    console.log(`${colors.yellow}⚠️  No image file provided or file not found${colors.reset}`);
    console.log(`${colors.blue}ℹ️  To test with an image, run:${colors.reset}`);
    console.log(`   node test-receipt-scanner.js /path/to/receipt.jpg\n`);
    return true;
  }

  try {
    console.log(`${colors.blue}📷 Image:${colors.reset} ${imagePath}`);
    console.log(`${colors.yellow}⏳ Extracting text with OCR...${colors.reset}`);

    // Step 1: OCR
    const ocrResult = await extractTextFromImage(imagePath);
    const ocrValidation = validateOCRResult(ocrResult);

    console.log(`\n${colors.green}✅ OCR completed!${colors.reset}`);
    console.log(`Confidence: ${ocrResult.confidence.toFixed(2)}%`);
    console.log(`Words: ${ocrResult.wordCount}`);
    console.log(`Lines: ${ocrResult.lineCount}`);
    console.log(`Quality: ${ocrValidation.quality}`);

    console.log(`\n${colors.blue}Extracted Text:${colors.reset}`);
    console.log(ocrResult.text.substring(0, 500) + (ocrResult.text.length > 500 ? '...' : ''));

    if (ocrValidation.warnings.length > 0) {
      console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
      ocrValidation.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    }

    // Step 2: AI Parsing
    console.log(`\n${colors.yellow}⏳ Parsing with Gemini AI...${colors.reset}`);
    const parsedData = await parseReceiptWithGemini(ocrResult.text);

    console.log(`\n${colors.green}✅ Parsing completed!${colors.reset}`);
    console.log(`\n${colors.bright}Parsed Data:${colors.reset}`);
    console.log(JSON.stringify(parsedData, null, 2));

    console.log(`\n${colors.green}${colors.bright}✓ Image file test passed!${colors.reset}`);
    return true;

  } catch (error) {
    console.error(`\n${colors.red}❌ Test failed:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}╔═══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║   Receipt Scanner Feature Test Suite     ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════╝${colors.reset}\n`);

  // Check environment
  if (!process.env.GEMINI_API_KEY) {
    console.error(`${colors.red}❌ GEMINI_API_KEY not found in environment variables${colors.reset}`);
    console.log(`${colors.yellow}Please add GEMINI_API_KEY to your .env file${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✓ Environment check passed${colors.reset}`);

  const results = [];

  // Run tests
  results.push(await testWithSampleText());
  results.push(await testCategorySuggestion());

  // Test with image file if provided
  const imagePath = process.argv[2];
  if (imagePath) {
    results.push(await testWithImageFile(imagePath));
  }

  // Summary
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}Test Summary:${colors.reset}`);
  console.log(`${colors.green}✓ Passed:${colors.reset} ${results.filter(r => r).length}`);
  console.log(`${colors.red}✗ Failed:${colors.reset} ${results.filter(r => !r).length}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);

  const allPassed = results.every(r => r);
  if (allPassed) {
    console.log(`${colors.green}${colors.bright}🎉 All tests passed! Receipt scanner is ready to use.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ Some tests failed. Please check the errors above.${colors.reset}\n`);
  }

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error(`\n${colors.red}${colors.bright}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
