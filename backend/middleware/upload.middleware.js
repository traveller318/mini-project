const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Ensure upload directory exists
 */
const ensureUploadDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Configure storage for different file types
 */
const createStorage = (destination) => {
  ensureUploadDir(destination);
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Create unique filename: userId_timestamp_originalname
      const userId = req.user?._id || 'anonymous';
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
      
      const filename = `${userId}_${timestamp}_${sanitizedName}${ext}`;
      cb(null, filename);
    }
  });
};

/**
 * File filter for images only
 */
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

/**
 * File filter for documents (receipts, invoices, etc.)
 */
const documentFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDF, and Word documents are allowed.'), false);
  }
};

/**
 * Profile Picture Upload
 * Single image, max 5MB
 */
const uploadProfilePicture = multer({
  storage: createStorage('uploads/profiles'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('profileImage');

/**
 * Transaction Receipt Upload
 * Single document/image, max 10MB
 * Supports: images (JPEG, PNG, GIF, WebP) and PDF files
 */
const uploadReceipt = multer({
  storage: createStorage('uploads/receipts'),
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('receipt');

/**
 * Transaction Receipt/Bill PDF Upload
 * Single PDF file, max 15MB (PDFs can be larger)
 */
const uploadReceiptPDF = multer({
  storage: createStorage('uploads/receipts'),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB for PDFs
  }
}).single('receipt');

/**
 * Multiple Receipts Upload
 * Multiple documents/images, max 10MB each, max 5 files
 */
const uploadMultipleReceipts = multer({
  storage: createStorage('uploads/receipts'),
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Max 5 files
  }
}).array('receipts', 5);

/**
 * Document Upload (General purpose)
 * Single document, max 10MB
 */
const uploadDocument = multer({
  storage: createStorage('uploads/documents'),
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('document');

/**
 * Voice Recording Upload
 * Audio files, max 25MB
 */
const uploadVoiceRecording = multer({
  storage: createStorage('uploads/voice'),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'audio/m4a'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB
  }
}).single('voiceRecording');

/**
 * Error handler for multer upload errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size is too large',
        maxSize: '10MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded',
        maxFiles: 5
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    // Custom errors from file filter
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

/**
 * Helper function to delete uploaded file
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Helper function to delete multiple files
 */
const deleteFiles = (filePaths) => {
  const results = filePaths.map(deleteFile);
  return results.every(result => result);
};

module.exports = {
  uploadProfilePicture,
  uploadReceipt,
  uploadReceiptPDF,
  uploadMultipleReceipts,
  uploadDocument,
  uploadVoiceRecording,
  handleUploadError,
  deleteFile,
  deleteFiles
};
