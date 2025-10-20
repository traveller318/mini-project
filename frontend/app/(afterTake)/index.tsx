import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from 'toastify-react-native';

const { width, height } = Dimensions.get('window');

const AfterImageClickedPage = () => {
  const params = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const imageUri = params.imageUri as string;
  const fileName = params.fileName as string;
  const fileSize = params.fileSize as string;
  const imageWidth = params.width as string;
  const imageHeight = params.height as string;

  const EditingTool = ({ 
    icon, 
    label, 
    isSelected, 
    onPress 
  }: { 
    icon: keyof typeof Ionicons.glyphMap; 
    label: string; 
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity 
      onPress={onPress} 
      className={`items-center mx-2 p-3 rounded-2xl w-20 h-20 ${
        isSelected ? 'bg-blue-500' : 'bg-white'
      } shadow-lg`}
    >
      <Ionicons 
        name={icon} 
        size={24} 
        color={isSelected ? 'white' : '#374151'} 
      />
      <Text className={`text-xs mt-1 font-medium text-center ${
        isSelected ? 'text-white' : 'text-gray-600'
      }`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const handleToolSelect = (tool: string) => {
    setSelectedTool(selectedTool === tool ? null : tool);
  };

  const handleScanImage = () => {
    setIsProcessing(true);

    // Simulate image processing with OCR/text recognition
    setTimeout(() => {
      setIsProcessing(false);
      
      // Show success toast
      Toast.success('🎉 Receipt scanned successfully! Data extracted and saved.', 'top');
      
      // Navigate to transactions after a brief delay
      setTimeout(() => {
        router.push('/(tabs)/Transactions');
      }, 1000);
    }, 2500);
  };

  const handleBack = () => {
    Alert.alert(
      'Discard Photo?',
      'Are you sure you want to go back? The captured photo will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          onPress: () => {
            Toast.warn('📷 Photo discarded', 'top');
            router.back();
          }, 
          style: 'destructive' 
        }
      ]
    );
  };

  if (!imageUri) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-lg">No image to display</Text>
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="pb-4">
          <View className="pt-5 pb-4 px-6">
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={handleBack}
                className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg"
              >
                <Ionicons name="arrow-back" size={20} color="#374151" />
              </TouchableOpacity>
              <Text className="text-gray-800 text-xl font-bold ml-4">Edit Photo</Text>
            </View>
          </View>
        </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Image Display Section */}
        <View className="px-4 mt-4">
          <View className="bg-white rounded-3xl p-3 shadow-lg">
            <View className="items-center">
              <View 
                className="rounded-2xl overflow-hidden shadow-lg"
                style={{
                  width: width - 40,
                  height: (width - 40) * 1.3,
                  maxHeight: height * 0.6,
                }}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: '100%',
                    height: '100%',
                    opacity: brightness,
                  }}
                  resizeMode="cover"
                />
                {/* Overlay for better visual feedback */}
                <View className="absolute inset-0 border-2 border-blue-200 rounded-2xl pointer-events-none" />
              </View>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View className="px-6 mt-6">
          <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <View className="flex-row items-center mb-2">
              <Ionicons name="bulb-outline" size={20} color="#3B82F6" />
              <Text className="text-blue-700 font-semibold ml-2">Pro Tips</Text>
            </View>
            <Text className="text-blue-600 text-sm leading-relaxed">
              • Ensure the receipt is well-lit and flat{'\n'}
              • Include all text and amounts in the frame{'\n'}
              • Use editing tools to enhance clarity before scanning
            </Text>
          </View>
        </View>

        {/* Editing Tools */}
        <View className="px-6 mt-6">
          <Text className="text-gray-800 text-lg font-bold mb-4">Editing Tools</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            <EditingTool
              icon="crop"
              label="Crop"
              isSelected={selectedTool === 'crop'}
              onPress={() => handleToolSelect('crop')}
            />
            <EditingTool
              icon="color-filter"
              label="Filter"
              isSelected={selectedTool === 'filter'}
              onPress={() => handleToolSelect('filter')}
            />
            <EditingTool
              icon="sunny"
              label="Brightness"
              isSelected={selectedTool === 'brightness'}
              onPress={() => handleToolSelect('brightness')}
            />
            <EditingTool
              icon="contrast"
              label="Contrast"
              isSelected={selectedTool === 'contrast'}
              onPress={() => handleToolSelect('contrast')}
            />
            <EditingTool
              icon="refresh-outline"
              label="Rotate"
              isSelected={selectedTool === 'rotate'}
              onPress={() => handleToolSelect('rotate')}
            />
            <EditingTool
              icon="text"
              label="Text"
              isSelected={selectedTool === 'text'}
              onPress={() => handleToolSelect('text')}
            />
          </ScrollView>

          {/* Tool Options */}
          {selectedTool && (
            <View className="bg-white rounded-2xl p-4 shadow-lg mb-6">
              <Text className="text-gray-700 font-semibold mb-3 capitalize">
                {selectedTool} Options
              </Text>
              <View className="items-center">
                <Text className="text-gray-500 text-sm">
                  {selectedTool === 'crop' && 'Drag corners to crop the image'}
                  {selectedTool === 'filter' && 'Apply filters to enhance your image'}
                  {selectedTool === 'brightness' && 'Adjust image brightness'}
                  {selectedTool === 'contrast' && 'Modify image contrast'}
                  {selectedTool === 'rotate' && 'Rotate image by 90° increments'}
                  {selectedTool === 'text' && 'Add text annotations to your image'}
                </Text>
                <TouchableOpacity 
                  onPress={() => setSelectedTool(null)}
                  className="mt-3 bg-blue-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white text-sm font-medium">Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="px-6 mt-4">
          <View className="flex-row justify-between">
            <TouchableOpacity 
              onPress={() => router.back()}
              disabled={isProcessing}
              className={`flex-1 py-4 rounded-2xl items-center mr-3 ${
                isProcessing ? 'bg-gray-100' : 'bg-gray-200'
              }`}
            >
              <View className="flex-row items-center">
                <Ionicons 
                  name="camera-outline" 
                  size={20} 
                  color={isProcessing ? '#9CA3AF' : '#374151'} 
                />
                <Text className={`font-semibold text-lg ml-2 ${
                  isProcessing ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  Retake
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleScanImage}
              disabled={isProcessing}
              className={`flex-1 py-4 rounded-2xl items-center shadow-lg ${
                isProcessing ? 'bg-blue-400' : 'bg-blue-500'
              }`}
            >
              {isProcessing ? (
                <View className="flex-row items-center">
                  <ActivityIndicator
                    size="small"
                    color="white"
                  />
                  <Text className="text-white font-semibold text-lg ml-2">Scanning...</Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="scan-outline" size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">Scan Receipt</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Progress indicator when processing */}
          {isProcessing && (
            <View className="mt-4 bg-white rounded-xl p-4 shadow-lg">
              <View className="flex-row items-center justify-center">
                <ActivityIndicator
                  size="large"
                  color="#3B82F6"
                />
              </View>
              <Text className="text-center text-gray-600 text-sm mt-2">
                Extracting text and analyzing receipt data...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AfterImageClickedPage;