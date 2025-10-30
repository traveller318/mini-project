const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Extract text from PDF file
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<Object>} - Extracted text data with metadata
 */
const extractTextFromPDF = async (pdfPath) => {
  try {
    console.log(`📄 Starting PDF text extraction for: ${pdfPath}`);
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    // Read PDF file as buffer
    const dataBuffer = fs.readFileSync(pdfPath);

    // Parse PDF and extract text using PDFParse class
    const { PDFParse } = pdfParse;
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();

    const extractedText = result.text?.trim() || '';
    const pageCount = result.total || 0;
    const info = {};

    console.log(`✅ PDF extraction completed`);
    console.log(`📝 Extracted text length: ${extractedText.length} characters`);
    console.log(`📄 Pages: ${pageCount}`);

    // Clean up extracted text - remove extra whitespaces and normalize
    const cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Calculate confidence based on text quality
    const confidence = calculateTextConfidence(cleanedText);

    return {
      success: true,
      text: cleanedText,
      rawText: extractedText,
      confidence,
      wordCount: cleanedText.split(/\s+/).filter(word => word.length > 0).length,
      lineCount: cleanedText.split('\n').filter(line => line.trim().length > 0).length,
      pageCount,
      metadata: {
        title: info.Title || '',
        author: info.Author || '',
        creator: info.Creator || '',
        producer: info.Producer || '',
        creationDate: info.CreationDate || '',
        modificationDate: info.ModDate || ''
      }
    };

  } catch (error) {
    console.error('❌ PDF Extraction Error:', error.message);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
};

/**
 * Calculate confidence score for extracted text
 * @param {string} text - Extracted text
 * @returns {number} - Confidence score (0-100)
 */
const calculateTextConfidence = (text) => {
  let confidence = 0;

  // Base confidence if text exists
  if (text.length > 0) {
    confidence = 40;
  }

  // Increase confidence based on text length
  if (text.length > 50) confidence += 10;
  if (text.length > 200) confidence += 10;
  if (text.length > 500) confidence += 10;

  // Check for common receipt/bill patterns
  const patterns = [
    /total/i,
    /amount/i,
    /date/i,
    /₹|rs\.?|inr/i,
    /\d{1,3}(,\d{3})*(\.\d{2})?/,  // Currency amounts
    /\d{2}[-/]\d{2}[-/]\d{2,4}/,   // Dates
    /invoice|receipt|bill/i
  ];

  patterns.forEach(pattern => {
    if (pattern.test(text)) {
      confidence += 5;
    }
  });

  // Cap at 100
  return Math.min(confidence, 100);
};

/**
 * Extract text from multiple PDF files
 * @param {Array<string>} pdfPaths - Array of PDF file paths
 * @returns {Promise<Array<Object>>} - Array of extraction results
 */
const extractTextFromMultiplePDFs = async (pdfPaths) => {
  try {
    console.log(`📄 Processing ${pdfPaths.length} PDF files...`);
    
    const results = await Promise.all(
      pdfPaths.map(async (pdfPath, index) => {
        try {
          console.log(`Processing PDF ${index + 1}/${pdfPaths.length}`);
          return await extractTextFromPDF(pdfPath);
        } catch (error) {
          console.error(`Error processing PDF ${index + 1}:`, error.message);
          return {
            success: false,
            text: '',
            error: error.message
          };
        }
      })
    );

    const successfulResults = results.filter(r => r.success);
    console.log(`✅ Successfully processed ${successfulResults.length}/${pdfPaths.length} PDFs`);

    return results;

  } catch (error) {
    console.error('❌ Batch PDF Extraction Error:', error.message);
    throw new Error(`Batch PDF extraction failed: ${error.message}`);
  }
};

/**
 * Validate PDF extraction result quality
 * @param {Object} pdfResult - PDF extraction result object
 * @returns {Object} - Validation result with warnings
 */
const validatePDFResult = (pdfResult) => {
  const warnings = [];
  
  if (!pdfResult.success) {
    return {
      isValid: false,
      warnings: ['PDF text extraction failed'],
      quality: 'poor'
    };
  }

  // Check confidence level
  if (pdfResult.confidence < 50) {
    warnings.push('Low confidence level detected. PDF may not contain readable text or may be scanned images.');
  }

  // Check text length
  if (pdfResult.text.length < 20) {
    warnings.push('Very little text extracted. PDF may contain mostly images or be corrupted.');
  }

  // Check word count
  if (pdfResult.wordCount < 10) {
    warnings.push('Few words detected. PDF may not contain proper text content.');
  }

  // Check if PDF has multiple pages
  if (pdfResult.pageCount > 5) {
    warnings.push('PDF has multiple pages. Only content from all pages will be analyzed.');
  }

  // Determine quality
  let quality = 'good';
  if (pdfResult.confidence < 60 || pdfResult.wordCount < 15) {
    quality = 'fair';
  }
  if (pdfResult.confidence < 50 || pdfResult.wordCount < 10) {
    quality = 'poor';
  }

  return {
    isValid: pdfResult.text.length > 0,
    warnings,
    quality,
    confidence: pdfResult.confidence
  };
};

/**
 * Check if file is a valid PDF
 * @param {string} filePath - Path to file
 * @returns {boolean} - True if file is PDF
 */
const isPDFFile = (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.pdf';
  } catch (error) {
    return false;
  }
};

/**
 * Get PDF file information without full text extraction
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<Object>} - PDF metadata
 */
const getPDFInfo = async (pdfPath) => {
  try {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const { PDFParse } = pdfParse;
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getInfo();

    return {
      success: true,
      pageCount: result.total || 0,
      metadata: result.info || {},
      version: ''
    };

  } catch (error) {
    console.error('❌ PDF Info Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  extractTextFromPDF,
  extractTextFromMultiplePDFs,
  validatePDFResult,
  isPDFFile,
  getPDFInfo,
  calculateTextConfidence
};
