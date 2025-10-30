const express = require('express');
const router = express.Router();
const voiceAgentController = require('../controllers/voiceAgent.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadVoiceRecording } = require('../middleware/upload.middleware');

// All routes require authentication
router.use(protect);

/**
 * POST /api/v1/voice-agent/process
 * Main voice agent endpoint - processes uploaded audio file
 * Transcribes, understands intent, executes API, returns natural language response
 */
router.post('/process', uploadVoiceRecording, voiceAgentController.handleVoiceAgent);

/**
 * POST /api/v1/voice-agent/quick-question
 * Handle predefined quick questions (text-based, no audio)
 * For the quick question buttons in the UI
 */
router.post('/quick-question', voiceAgentController.handleQuickQuestion);

module.exports = router;
