const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadReceipt, uploadReceiptPDF } = require('../middleware/upload.middleware');

// All routes are protected
router.use(protect);

// Get transactions
router.get('/', transactionController.getAllTransactions);
router.get('/by-category', transactionController.getTransactionsByCategory);

// Create, update, delete
router.post('/', transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

// OCR + AI Receipt Scanning
router.post('/scan-receipt', uploadReceipt, transactionController.scanReceipt);
router.post('/scan-receipt-pdf', uploadReceiptPDF, transactionController.scanReceiptPDF);
router.post('/save-extracted', transactionController.saveExtractedTransactions);

// AI Category Suggestion
router.post('/suggest-category', transactionController.suggestCategory);

module.exports = router;
