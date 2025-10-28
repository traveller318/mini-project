const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voice.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadVoiceRecording } = require('../middleware/upload.middleware');

// All routes are protected
router.use(protect);

// Voice interactions
router.post('/record', uploadVoiceRecording, voiceController.saveVoiceRecording);
router.get('/result/:id', voiceController.getVoiceResult);
router.post('/query', voiceController.processVoiceQuery);
router.get('/history', voiceController.getVoiceHistory);

module.exports = router;
