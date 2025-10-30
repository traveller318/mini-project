import { API_BASE_URL, getAuthToken } from '../config/api';

/**
 * Voice Service - Handles voice agent API calls
 */

interface VoiceProcessResponse {
  success: boolean;
  message: string;
  data: {
    interactionId: string;
    transcription: string;
    intent: string;
    response: string;
    confidence: number;
    processingTime: number;
    apiData: any;
  };
}

interface QuickQuestionResponse {
  success: boolean;
  message: string;
  data: {
    interactionId: string;
    question: string;
    intent: string;
    response: string;
    apiData: any;
  };
}

/**
 * Process voice recording with AI agent
 * @param audioUri - Local URI of the recorded audio file
 * @param duration - Duration of recording in seconds
 * @returns Promise with AI response
 */
export const processVoiceRecording = async (
  audioUri: string,
  duration: number = 0
): Promise<VoiceProcessResponse> => {
  try {
    console.log('🎤 Processing voice recording...');
    console.log('📍 Audio URI:', audioUri);

    // Get auth token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    // Create FormData for multipart upload
    const formData = new FormData();
    
    // Determine file extension and MIME type based on URI
    let fileName = 'recording.m4a';
    let mimeType = 'audio/mp4';
    
    if (audioUri.includes('.m4a') || audioUri.includes('.caf')) {
      // iOS typically uses .caf or .m4a format
      fileName = `recording_${Date.now()}.m4a`;
      mimeType = 'audio/mp4';
    } else if (audioUri.includes('.wav')) {
      fileName = `recording_${Date.now()}.wav`;
      mimeType = 'audio/wav';
    } else if (audioUri.includes('.mp3')) {
      fileName = `recording_${Date.now()}.mp3`;
      mimeType = 'audio/mpeg';
    } else if (audioUri.includes('.aac')) {
      fileName = `recording_${Date.now()}.aac`;
      mimeType = 'audio/aac';
    } else if (audioUri.includes('.webm')) {
      fileName = `recording_${Date.now()}.webm`;
      mimeType = 'audio/webm';
    } else {
      // Default to m4a for unknown formats (common on mobile)
      fileName = `recording_${Date.now()}.m4a`;
      mimeType = 'audio/mp4';
    }

    console.log('📁 File details:', { fileName, mimeType });

    // Append audio file
    formData.append('voiceRecording', {
      uri: audioUri,
      type: mimeType,
      name: fileName,
    } as any);

    // Append duration
    formData.append('duration', duration.toString());

    console.log('📤 Uploading to voice agent...');

    // Make API request
    const response = await fetch(`${API_BASE_URL}/voice-agent/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Note: Do NOT set Content-Type header, let the browser set it with boundary
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to process voice recording');
    }

    console.log('✅ Voice processing successful');
    console.log('💬 Response:', result.data.response);

    return result;

  } catch (error: any) {
    console.error('❌ Voice processing error:', error);
    throw new Error(error.message || 'Failed to process voice recording');
  }
};

/**
 * Handle quick questions (text-based, no audio)
 * @param question - The quick question text
 * @param type - Type of quick question
 * @returns Promise with response
 */
export const handleQuickQuestion = async (
  question: string,
  type?: string
): Promise<QuickQuestionResponse> => {
  try {
    console.log('⚡ Processing quick question:', question);

    // Get auth token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    // Make API request
    const response = await fetch(`${API_BASE_URL}/voice-agent/quick-question`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        type,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to process quick question');
    }

    console.log('✅ Quick question processed');
    console.log('💬 Response:', result.data.response);

    return result;

  } catch (error: any) {
    console.error('❌ Quick question error:', error);
    throw new Error(error.message || 'Failed to process quick question');
  }
};

/**
 * Get voice interaction history
 * @param page - Page number
 * @param limit - Items per page
 * @returns Promise with history
 */
export const getVoiceHistory = async (page: number = 1, limit: number = 20) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${API_BASE_URL}/voice/history?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch voice history');
    }

    return result;

  } catch (error: any) {
    console.error('❌ Voice history error:', error);
    throw new Error(error.message || 'Failed to fetch voice history');
  }
};
