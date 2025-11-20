import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  useAudioRecorder, 
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync
} from 'expo-audio';
import LottieView from 'lottie-react-native';
import { processVoiceRecording, handleQuickQuestion } from '../../services/voiceService';

const { width, height } = Dimensions.get('window');

export default function VoiceAgent() {
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Initialize audio recorder with WAV format (supported by Gemini)
  // Using custom recording options to force WAV format
  const recordingOptions = {
    ...RecordingPresets.HIGH_QUALITY,
    extension: '.wav',
    outputFormat: 'wav',
    audioEncoder: 'lpcm', // Linear PCM for WAV
  };
  
  const audioRecorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder);
  
  // Initialize audio player for playback
  const audioPlayer = useAudioPlayer(recordingUri || null);
  const playerStatus = useAudioPlayerStatus(audioPlayer);
  
  // Animation references
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);
  const recordingStartTime = useRef<number>(0);

  // Pulse animation for microphone
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Glow animation for active recording
  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    glowAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const startRecording = async () => {
    try {
      // Request recording permissions
      const { granted } = await requestRecordingPermissionsAsync();
      
      if (!granted) {
        Alert.alert('Permission Denied', 'Permission to access microphone was denied');
        return;
      }

      // Reset previous responses
      setAiResponse(null);
      setTranscription(null);

      // Set audio mode for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      console.log('Starting recording..');
      recordingStartTime.current = Date.now();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      
      // Start animations
      startPulseAnimation();
      startGlowAnimation();
      
      // Start Lottie animation
      if (lottieRef.current) {
        lottieRef.current.play();
      }
      
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording..');
    
    // Stop animations
    stopAnimations();
    
    // Stop Lottie animation
    if (lottieRef.current) {
      lottieRef.current.pause();
    }
    
    try {
      await audioRecorder.stop();
      
      const uri = audioRecorder.uri;
      console.log('Recording stopped and stored at', uri);
      
      // Calculate recording duration
      const duration = (Date.now() - recordingStartTime.current) / 1000;
      setRecordingDuration(duration);
      
      if (uri) {
        setRecordingUri(uri);
        
        // Reset audio mode
        await setAudioModeAsync({
          allowsRecording: false,
        });
        
        // Process the recording with AI
        await processRecordingWithAI(uri, duration);
      } else {
        throw new Error('No recording URI');
      }
      
    } catch (error: any) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', error.message || 'Failed to stop recording');
    }
  };

  const processRecordingWithAI = async (uri: string, duration: number) => {
    try {
      setIsProcessing(true);
      console.log('🤖 Processing with AI...');

      // Call the voice service
      const response = await processVoiceRecording(uri, duration);

      console.log('✅ AI Response received:', response.data);

      // Update UI with results
      setTranscription(response.data.transcription);
      setAiResponse(response.data.response);

      // Show success with response
      

    } catch (error: any) {
      console.error('❌ AI Processing error:', error);
      Alert.alert(
        'Processing Error',
        error.message || 'Failed to process your voice request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicPress = () => {
    if (recorderState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playRecording = () => {
    if (!recordingUri) return;
    
    try {
      audioPlayer.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play recording', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const stopPlayback = () => {
    try {
      audioPlayer.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to stop playback', error);
    }
  };

  const handleQuickQuestionPress = async (question: string) => {
    try {
      setIsProcessing(true);
      setAiResponse(null);
      setTranscription(question);

      console.log('⚡ Processing quick question:', question);

      // Call the quick question API
      const response = await handleQuickQuestion(question);

      console.log('✅ Quick question response:', response.data);

      // Update UI with results
      setAiResponse(response.data.response);

    } catch (error: any) {
      console.error('❌ Quick question error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to process your question. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Update playing state based on player status
    if (playerStatus.playing) {
      setIsPlaying(true);
    } else if (playerStatus.didJustFinish) {
      setIsPlaying(false);
    }
  }, [playerStatus.playing, playerStatus.didJustFinish]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      // Audio recorder and player are automatically cleaned up by the hooks
    };
  }, []);

  const quickQuestions = [
    "Show spending report",
    "This month's budget of food",
    "Recent transactions",
    "Upcoming bills",
  ];

  return (
    <LinearGradient
      colors={["#e0f2fe", "#bae6fd", "#7dd3fc"]}
      style={{ flex: 1 }}
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-8">
          
          {/* Quick Questions Section */}
          <View className="mb-8 mt-8">
            <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
              Quick Questions
            </Text>
            <View className="flex-row flex-wrap justify-between px-2">
              {quickQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleQuickQuestionPress(question)}
                  disabled={isProcessing}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 20,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 12,
                    width: '48%',
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  activeOpacity={0.8}
                >
                  <Text className="text-sm font-medium text-gray-700 text-center" numberOfLines={2}>
                    {question}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AI Response Display */}
          {(aiResponse || transcription) && (
            <View className="mb-8 bg-white rounded-3xl p-6 shadow-lg mx-4">
              {transcription && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-500 mb-2">You said:</Text>
                  <Text className="text-base text-gray-700 italic">"{transcription}"</Text>
                </View>
              )}
              {aiResponse && (
                <View>
                  <Text className="text-sm font-semibold text-gray-500 mb-2">AI Response:</Text>
                  <Text className="text-base text-gray-800 leading-6">{aiResponse}</Text>
                </View>
              )}
            </View>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <View className="mb-8 bg-white rounded-3xl p-6 shadow-lg mx-4">
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#0ea5e9" />
                <Text className="ml-3 text-base text-gray-600">Processing your request...</Text>
              </View>
            </View>
          )}

          {/* Main Voice Interface */}
          <View className="items-center justify-center">
          
          {/* Lottie Waveform Animation */}
          {recorderState.isRecording && (
            <View className="items-center justify-center mb-6">
              <LottieView
                ref={lottieRef}
                source={require('../../assets/finic.json')}
                style={{
                  width: 250,
                  height: 100,
                }}
                loop={true}
                autoPlay={false}
              />
            </View>
          )}

          {/* Status Text */}
          <Text className="text-base text-gray-600 text-center mx-8 leading-6 mb-8">
            {isProcessing
              ? "AI is analyzing your request..."
              : recorderState.isRecording 
              ? "Recording your voice... Tap the button again to stop"
              : "Or ask me anything by tapping the microphone below"
            }
          </Text>
          
          {/* Microphone Button with Animations */}
          <View className="relative items-center justify-center mb-8">
            
            {/* Outer Glow Effect */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(14, 165, 233, 0)', 'rgba(14, 165, 233, 0.3)']
                }),
                transform: [{ 
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2]
                  })
                }]
              }}
            />
            
            {/* Microphone Button */}
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }]
              }}
            >
              <TouchableOpacity
                onPress={handleMicPress}
                disabled={isProcessing}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: recorderState.isRecording ? '#ef4444' : isProcessing ? '#cbd5e1' : '#ffffff',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8,
                  opacity: isProcessing ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#0ea5e9" />
                ) : (
                  <Ionicons 
                    name={recorderState.isRecording ? "stop" : "mic"} 
                    size={28} 
                    color={recorderState.isRecording ? '#ffffff' : '#0ea5e9'} 
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Play Recording Button */}
          {/* {recordingUri && (
            <TouchableOpacity
              onPress={isPlaying ? stopPlayback : playRecording}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 20,
                paddingVertical: 12,
                paddingHorizontal: 20,
                marginTop: 16,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
              }}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center space-x-3">
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={20} 
                  color="#0ea5e9" 
                />
                <Text className="text-base font-semibold text-gray-800">
                  {isPlaying ? "Stop Recording" : "Play Recording"}
                </Text>
              </View>
            </TouchableOpacity>
          )} */}
        </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}