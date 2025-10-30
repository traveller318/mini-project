import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Alert,
  Dimensions,
  ScrollView 
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

const { width, height } = Dimensions.get('window');

export default function VoiceAgent() {
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Initialize audio recorder with high quality settings
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  
  // Initialize audio player for playback
  const audioPlayer = useAudioPlayer(recordingUri || null);
  const playerStatus = useAudioPlayerStatus(audioPlayer);
  
  // Animation references
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);

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

      // Set audio mode for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      console.log('Starting recording..');
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
      
      if (uri) {
        setRecordingUri(uri);
      }
      
      // Reset audio mode
      await setAudioModeAsync({
        allowsRecording: false,
      });
      
      // Show success notification
      Alert.alert('Success', 'Recording captured successfully!');
      
      // Simulate AI processing
      setTimeout(() => {
        Alert.alert('Processing', 'AI is processing your request...');
      }, 1000);
      
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording');
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

  const handleSpendingReport = () => {
    Alert.alert('Info', 'Generating spending report...');
    // Navigate to spending report or trigger action
  };

  const handleSetBudget = () => {
    Alert.alert('Info', 'Opening budget settings...');
    // Navigate to budget settings or trigger action
  };

  const handleQuestion = (question: string) => {
    Alert.alert('Question', `You asked: "${question}"`);
    // Handle the specific question
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
                  onPress={() => handleQuestion(question)}
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
            {recorderState.isRecording 
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
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: recorderState.isRecording ? '#ef4444' : '#ffffff',
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
                }}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={recorderState.isRecording ? "stop" : "mic"} 
                  size={28} 
                  color={recorderState.isRecording ? '#ffffff' : '#0ea5e9'} 
                />
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