const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadReceipt } = require('../middleware/upload.middleware');

// All routes are protected
router.use(protect);

// Get transactions
router.get('/', transactionController.getAllTransactions);
router.get('/by-category', transactionController.getTransactionsByCategory);

// Create, update, delete
router.post('/', transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

// Scan receipt
router.post('/scan-receipt', uploadReceipt, transactionController.scanReceipt);

module.exports = router;
