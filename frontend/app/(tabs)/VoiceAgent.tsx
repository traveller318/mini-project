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
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

export default function VoiceAgent() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  
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
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setIsListening(true);
      
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
    
    if (!recording) return;
    
    setIsRecording(false);
    setIsListening(false);
    
    // Stop animations
    stopAnimations();
    
    // Stop Lottie animation
    if (lottieRef.current) {
      lottieRef.current.pause();
    }
    
    try {
      const uri = recording.getURI();
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      console.log('Recording stopped and stored at', uri);
      
      if (uri) {
        setRecordingUri(uri);
      }
      
      // Clear recording reference immediately after unloading
      setRecording(null);
      
      // Show success notification
      Alert.alert('Success', 'Recording captured successfully!');
      
      // Simulate AI processing (you can replace this with actual AI integration)
      setTimeout(() => {
        Alert.alert('Processing', 'AI is processing your request...');
      }, 1000);
      
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording');
      setRecording(null);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;
    
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(newSound);
      setIsPlaying(true);
      
      await newSound.playAsync();
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Failed to play recording', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error('Failed to stop playback', error);
      }
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
    // Cleanup on unmount
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch((error) => {
          console.log('Error unloading recording on cleanup:', error);
        });
      }
      if (sound) {
        sound.unloadAsync().catch((error) => {
          console.log('Error unloading sound on cleanup:', error);
        });
      }
    };
  }, [recording, sound]);

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
          {isRecording && (
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
            {isRecording 
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
                  backgroundColor: isRecording ? '#ef4444' : '#ffffff',
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
                  name={isRecording ? "stop" : "mic"} 
                  size={28} 
                  color={isRecording ? '#ffffff' : '#0ea5e9'} 
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