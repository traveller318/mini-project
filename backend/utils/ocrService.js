const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

/**
 * Extract text from image using TesseractJS OCR
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} - OCR result with text and confidence
 */
const extractTextFromImage = async (imagePath) => {
  try {
    console.log(`📸 Starting OCR processing for: ${imagePath}`);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Perform OCR using Tesseract
    const result = await Tesseract.recognize(
      imagePath,
      'eng', // Language: English
      {
        logger: (info) => {
          // Log progress
          if (info.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      }
    );

    const extractedText = result.data.text.trim();
    const confidence = result.data.confidence;

    console.log(`✅ OCR completed with ${confidence.toFixed(2)}% confidence`);
    console.log(`📝 Extracted text length: ${extractedText.length} characters`);

    // Clean up extracted text - remove extra whitespaces and normalize
    const cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return {
      success: true,
      text: cleanedText,
      rawText: extractedText,
      confidence,
      wordCount: cleanedText.split(/\s+/).length,
      lineCount: cleanedText.split('\n').length
    };

  } catch (error) {
    console.error('❌ OCR Error:', error.message);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

/**
 * Extract text from multiple images
 * @param {Array<string>} imagePaths - Array of image paths
 * @returns {Promise<Array<Object>>} - Array of OCR results
 */
const extractTextFromMultipleImages = async (imagePaths) => {
  try {
    console.log(`📸 Processing ${imagePaths.length} images...`);
    
    const results = await Promise.all(
      imagePaths.map(async (imagePath, index) => {
        try {
          console.log(`Processing image ${index + 1}/${imagePaths.length}`);
          return await extractTextFromImage(imagePath);
        } catch (error) {
          console.error(`Error processing image ${index + 1}:`, error.message);
          return {
            success: false,
            text: '',
            error: error.message
          };
        }
      })
    );

    const successfulResults = results.filter(r => r.success);
    console.log(`✅ Successfully processed ${successfulResults.length}/${imagePaths.length} images`);

    return results;

  } catch (error) {
    console.error('❌ Batch OCR Error:', error.message);
    throw new Error(`Batch OCR processing failed: ${error.message}`);
  }
};

/**
 * Preprocess image for better OCR results (optional enhancement)
 * This is a placeholder for future image preprocessing
 */
const preprocessImage = async (imagePath) => {
  // Future enhancements could include:
  // - Image rotation correction
  // - Contrast enhancement
  // - Noise removal
  // - Binarization
  // - Deskewing
  
  // For now, return original path
  return imagePath;
};

/**
 * Validate OCR result quality
 * @param {Object} ocrResult - OCR result object
 * @returns {Object} - Validation result with warnings
 */
const validateOCRResult = (ocrResult) => {
  const warnings = [];
  
  if (!ocrResult.success) {
    return {
      isValid: false,
      warnings: ['OCR processing failed'],
      quality: 'poor'
    };
  }

  // Check confidence level
  if (ocrResult.confidence < 50) {
    warnings.push('Low confidence level detected. Image quality may be poor.');
  }

  // Check text length
  if (ocrResult.text.length < 10) {
    warnings.push('Very little text extracted. Ensure the image is clear and contains readable text.');
  }

  // Check word count
  if (ocrResult.wordCount < 5) {
    warnings.push('Few words detected. Image may be too blurry or poorly lit.');
  }

  // Determine quality
  let quality = 'good';
  if (ocrResult.confidence < 60 || ocrResult.wordCount < 10) {
    quality = 'fair';
  }
  if (ocrResult.confidence < 50 || ocrResult.wordCount < 5) {
    quality = 'poor';
  }

  return {
    isValid: ocrResult.text.length > 0,
    warnings,
    quality,
    confidence: ocrResult.confidence
  };
};

module.exports = {
  extractTextFromImage,
  extractTextFromMultipleImages,
  preprocessImage,
  validateOCRResult
};
