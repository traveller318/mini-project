/**
 * Test PDF Receipt Scanner
 * 
 * This file tests the PDF receipt scanning functionality.
 * It demonstrates how to:
 * 1. Extract text from PDF receipts/bills
 * 2. Parse the extracted text using Gemini AI
 * 3. Validate the results
 * 
 * To run this test:
 * 1. Place a sample PDF receipt in the backend folder
 * 2. Update the PDF_PATH variable below
 * 3. Run: node test-pdf-scanner.js
 */

require('dotenv').config();
const path = require('path');

// Import services
const { extractTextFromPDF, validatePDFResult, getPDFInfo } = require('./utils/pdfService');
const { parseReceiptWithGemini, validateTransactionData } = require('./utils/geminiService');

// Configuration
const PDF_PATH = 'sample-receipt.pdf'; // Update this path to your PDF file

/**
 * Test PDF extraction
 */
async function testPDFExtraction() {
  try {
    console.log('='.repeat(60));
    console.log('📄 PDF RECEIPT SCANNER TEST');
    console.log('='.repeat(60));
    console.log();

    // Check if PDF exists
    const fs = require('fs');
    if (!fs.existsSync(PDF_PATH)) {
      console.error('❌ Error: PDF file not found at:', PDF_PATH);
      console.log('📝 Instructions:');
      console.log('   1. Place a sample PDF receipt in the backend folder');
      console.log('   2. Update the PDF_PATH variable in this file');
      console.log('   3. Run the test again');
      return;
    }

    console.log('📂 PDF File:', PDF_PATH);
    console.log();

    // Step 1: Get PDF info
    console.log('Step 1: Getting PDF information...');
    console.log('-'.repeat(60));
    const pdfInfo = await getPDFInfo(PDF_PATH);
    if (pdfInfo.success) {
      console.log('✅ PDF Info:');
      console.log('   Pages:', pdfInfo.pageCount);
      console.log('   Title:', pdfInfo.metadata.Title || 'N/A');
      console.log('   Author:', pdfInfo.metadata.Author || 'N/A');
      console.log('   Creator:', pdfInfo.metadata.Creator || 'N/A');
      console.log();
    }

    // Step 2: Extract text from PDF
    console.log('Step 2: Extracting text from PDF...');
    console.log('-'.repeat(60));
    const startTime = Date.now();
    const pdfResult = await extractTextFromPDF(PDF_PATH);
    const extractionTime = Date.now() - startTime;

    if (!pdfResult.success) {
      console.error('❌ Failed to extract text from PDF');
      console.error('   Error:', pdfResult.error);
      return;
    }

    console.log('✅ Text Extraction Successful!');
    console.log('   Confidence:', `${pdfResult.confidence}%`);
    console.log('   Word Count:', pdfResult.wordCount);
    console.log('   Line Count:', pdfResult.lineCount);
    console.log('   Page Count:', pdfResult.pageCount);
    console.log('   Extraction Time:', `${extractionTime}ms`);
    console.log();
    console.log('📝 Extracted Text Preview:');
    console.log('-'.repeat(60));
    console.log(pdfResult.text.substring(0, 500));
    if (pdfResult.text.length > 500) {
      console.log('... (truncated)');
    }
    console.log();

    // Step 3: Validate PDF result
    console.log('Step 3: Validating extraction quality...');
    console.log('-'.repeat(60));
    const validation = validatePDFResult(pdfResult);
    console.log('✅ Validation Result:');
    console.log('   Valid:', validation.isValid);
    console.log('   Quality:', validation.quality);
    if (validation.warnings.length > 0) {
      console.log('   Warnings:');
      validation.warnings.forEach(warning => {
        console.log('   ⚠️ ', warning);
      });
    }
    console.log();

    // Step 4: Parse with Gemini AI
    console.log('Step 4: Parsing with Gemini AI (gemini-2.5-flash)...');
    console.log('-'.repeat(60));
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Error: GEMINI_API_KEY not found in .env file');
      console.log('   Please add your Gemini API key to the .env file');
      return;
    }

    const parseStartTime = Date.now();
    const parsedData = await parseReceiptWithGemini(pdfResult.text);
    const parseTime = Date.now() - parseStartTime;

    if (!parsedData.success) {
      console.log('⚠️  AI Parsing failed, using fallback:');
      if (parsedData.fallbackTransaction) {
        console.log('   Fallback Transaction:');
        console.log('   Name:', parsedData.fallbackTransaction.name);
        console.log('   Amount: ₹', parsedData.fallbackTransaction.amount);
        console.log('   Category:', parsedData.fallbackTransaction.category);
      }
      console.log();
      return;
    }

    console.log('✅ AI Parsing Successful!');
    console.log('   Parse Time:', `${parseTime}ms`);
    console.log('   Confidence:', parsedData.confidence);
    console.log();

    console.log('📊 Parsed Receipt Data:');
    console.log('-'.repeat(60));
    console.log('   Merchant:', parsedData.merchantName);
    console.log('   Total Amount: ₹', parsedData.totalAmount);
    console.log('   Date:', parsedData.date);
    console.log('   Time:', parsedData.time);
    console.log('   Payment Method:', parsedData.paymentMethod);
    console.log('   Transaction Count:', parsedData.transactions.length);
    console.log();

    // Step 5: Display extracted transactions
    console.log('💰 Extracted Transactions:');
    console.log('='.repeat(60));
    parsedData.transactions.forEach((txn, index) => {
      console.log(`\n${index + 1}. ${txn.name}`);
      console.log('   Amount: ₹', txn.amount);
      console.log('   Type:', txn.type);
      console.log('   Category:', txn.category);
      console.log('   Description:', txn.description || 'N/A');
      console.log('   Payment Method:', txn.paymentMethod);
      console.log('   Icon:', txn.icon);
      console.log('   Color:', txn.color);
      if (txn.notes) {
        console.log('   Notes:', txn.notes);
      }
    });
    console.log();

    // Step 6: Validate transaction data
    console.log('Step 5: Validating transaction data...');
    console.log('-'.repeat(60));
    const dataValidation = validateTransactionData(parsedData);
    console.log('✅ Data Validation Result:');
    console.log('   Valid:', dataValidation.isValid);
    console.log('   Quality:', dataValidation.quality);
    if (dataValidation.errors.length > 0) {
      console.log('   Errors:');
      dataValidation.errors.forEach(error => {
        console.log('   ❌', error);
      });
    }
    if (dataValidation.warnings.length > 0) {
      console.log('   Warnings:');
      dataValidation.warnings.forEach(warning => {
        console.log('   ⚠️ ', warning);
      });
    }
    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('📈 SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ PDF text extraction:', pdfResult.success ? 'Success' : 'Failed');
    console.log('✅ AI parsing:', parsedData.success ? 'Success' : 'Failed');
    console.log('✅ Transactions extracted:', parsedData.transactions.length);
    console.log('✅ Total processing time:', `${extractionTime + parseTime}ms`);
    console.log();
    console.log('🎉 Test completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
console.log('\n🚀 Starting PDF Receipt Scanner Test...\n');
testPDFExtraction()
  .then(() => {
    console.log('\n✅ All tests completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
