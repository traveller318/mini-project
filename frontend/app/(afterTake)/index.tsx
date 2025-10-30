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
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from 'toastify-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scanReceipt, saveExtractedTransactions } from '@/services/transactionService';

const { width, height } = Dimensions.get('window');

// Category options with icons
const categories = {
  income: [
    { name: 'Salary', icon: 'cash-outline' },
    { name: 'Business', icon: 'briefcase-outline' },
    { name: 'Investment', icon: 'trending-up-outline' },
    { name: 'Freelance', icon: 'laptop-outline' },
    { name: 'Gift', icon: 'gift-outline' },
    { name: 'Other', icon: 'ellipsis-horizontal-outline' }
  ],
  expense: [
    { name: 'Food', icon: 'fast-food-outline' },
    { name: 'Transport', icon: 'car-outline' },
    { name: 'Shopping', icon: 'cart-outline' },
    { name: 'Entertainment', icon: 'game-controller-outline' },
    { name: 'Bills', icon: 'receipt-outline' },
    { name: 'Health', icon: 'medical-outline' },
    { name: 'Education', icon: 'school-outline' },
    { name: 'Travel', icon: 'airplane-outline' },
    { name: 'Groceries', icon: 'basket-outline' },
    { name: 'Rent', icon: 'home-outline' },
    { name: 'Other', icon: 'ellipsis-horizontal-outline' }
  ]
};

const AfterImageClickedPage = () => {
  const params = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [extractedTransactions, setExtractedTransactions] = useState<any[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');
  const [isAddingToDatabase, setIsAddingToDatabase] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editForm, setEditForm] = useState({
    transactionType: 'debit' as 'credit' | 'debit',
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    selectedCategory: categories.expense[0],
    date: new Date(),
    isRecurring: false,
    frequency: 'monthly' as 'weekly' | 'monthly' | 'custom'
  });

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

  const handleEditTransaction = (transactionId: string) => {
    const transaction = extractedTransactions.find(t => t.id === transactionId);
    if (transaction) {
      setEditingTransaction(transaction);
      const txnType = transaction.type as 'income' | 'expense';
      setEditForm({
        transactionType: txnType === 'income' ? 'credit' : 'debit',
        type: txnType,
        amount: Math.abs(transaction.amount).toString(),
        description: transaction.name,
        selectedCategory: categories[txnType].find((c: any) => c.name === transaction.category) || categories[txnType][0],
        date: new Date(),
        isRecurring: false,
        frequency: 'monthly'
      });
      setIsEditModalVisible(true);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to remove this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setExtractedTransactions(prev => prev.filter(t => t.id !== transactionId));
            Toast.success('🗑️ Transaction removed', 'top');
          }
        }
      ]
    );
  };

  const handleAddToTransactions = async () => {
    if (extractedTransactions.length === 0) {
      Toast.error('❌ No transactions to add', 'top');
      return;
    }

    try {
      setIsAddingToDatabase(true);
      
      // Format transactions for the backend
      const formattedTransactions = extractedTransactions.map(txn => ({
        name: txn.name,
        description: txn.description || txn.name,
        amount: Math.abs(txn.amount),
        type: txn.type,
        category: txn.category,
        icon: txn.icon || 'ellipsis-horizontal-outline',
        color: txn.color || '#6B7280',
        date: txn.date || new Date().toISOString(),
        timestamp: txn.timestamp || new Date().toISOString(),
        paymentMethod: txn.paymentMethod || 'other',
        notes: txn.notes || '',
        metadata: {
          source: 'scanned',
          merchantName: merchantName || 'Unknown',
          ...txn.metadata
        },
        receipt: {
          hasReceipt: true,
          imageUri: receiptImage,
          fileName: fileName || '',
          fileSize: fileSize ? parseInt(fileSize) : 0,
          scannedData: {
            merchantName: merchantName || 'Unknown',
            totalAmount: Math.abs(txn.amount),
            ocrConfidence: txn.ocrConfidence || 0,
            date: txn.date || new Date().toISOString()
          }
        }
      }));

      console.log('📤 Saving transactions to database...', formattedTransactions);

      const response = await saveExtractedTransactions(
        formattedTransactions,
        receiptImage,
        merchantName
      );

      if (response.success) {
        Toast.success(`✅ ${response.data.totalSaved} transaction(s) added successfully!`, 'top');
        
        // Navigate to transactions after a brief delay
        setTimeout(() => {
          router.push('/(tabs)/Transactions');
        }, 1000);
      } else {
        throw new Error(response.message || 'Failed to save transactions');
      }
    } catch (error: any) {
      console.error('❌ Error saving transactions:', error);
      Toast.error(`❌ ${error.response?.data?.message || 'Failed to save transactions'}`, 'top');
    } finally {
      setIsAddingToDatabase(false);
    }
  };

  const TransactionItem = ({ item }: { item: any }) => (
    <View className="bg-white mb-3 p-5 rounded-2xl shadow-sm border border-gray-50">
      {/* Action Icons - Top Right */}
      <View className="absolute top-2 right-2 flex-row items-center z-10">
        <TouchableOpacity 
          onPress={() => handleEditTransaction(item.id)}
          className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-2"
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={14} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDeleteTransaction(item.id)}
          className="w-8 h-8 bg-red-50 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="trash" size={14} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center mr-4">
            <Ionicons name={item.icon as any} size={24} color="#374151" />
          </View>
          <View className="flex-1 pr-16">
            <Text className="font-semibold text-gray-800 text-base">{item.name}</Text>
            <Text className="text-gray-500 text-sm">{formatTransactionDate(item.date || item.timestamp)}</Text>
          </View>
        </View>
        <View className="items-end mt-6">
          <Text className={`font-bold text-lg ${
            item.type === 'income' ? 'text-green-500' : 'text-red-500'
          }`}>
            {item.type === 'income' ? '+' : '-'} ₹{Math.abs(item.amount).toLocaleString()}
          </Text>
          <Text className="text-gray-400 text-xs">{item.category}</Text>
        </View>
      </View>
    </View>
  );

  const formatTransactionDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const diffTime = today.getTime() - transactionDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const timeStr = date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      if (diffDays === 0) {
        return `Today at ${timeStr}`;
      } else if (diffDays === 1) {
        return `Yesterday at ${timeStr}`;
      } else if (diffDays < 7) {
        return `${date.toLocaleDateString('en-IN', { weekday: 'short' })} at ${timeStr}`;
      } else {
        return date.toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short',
          year: 'numeric'
        });
      }
    } catch (error) {
      return dateString;
    }
  };

  const handleScanImage = async () => {
    if (!imageUri) {
      Toast.error('❌ No image to scan', 'top');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('📸 Starting receipt scan...');
      Toast.info('🔍 Scanning receipt...', 'top');

      // Call the backend API to scan the receipt
      const response = await scanReceipt(imageUri);

      console.log('📥 Scan response:', response);

      if (response.success && response.data?.extractedTransactions) {
        const { extractedTransactions, receiptImage: imgPath, merchantName: merchant } = response.data;

        // Store receipt info
        setReceiptImage(imgPath || imageUri);
        setMerchantName(merchant || 'Unknown Merchant');

        // Format transactions for display
        const formattedTransactions = extractedTransactions.map((txn: any, index: number) => ({
          id: `ext_${Date.now()}_${index}`,
          name: txn.name || txn.description || 'Unknown Item',
          description: txn.description || txn.name,
          category: txn.category || 'Other',
          amount: txn.amount || 0,
          type: txn.type || 'expense',
          icon: txn.icon || 'ellipsis-horizontal-outline',
          color: txn.color || '#6B7280',
          date: txn.date || new Date().toISOString(),
          timestamp: txn.timestamp || new Date().toISOString(),
          paymentMethod: txn.paymentMethod || 'other',
          notes: txn.notes || '',
          ocrConfidence: response.data.ocrConfidence || 0,
          metadata: {
            merchantName: merchant || 'Unknown',
            totalAmount: response.data.totalAmount || 0,
            ...txn.metadata
          }
        }));

        setExtractedTransactions(formattedTransactions);
        setShowTransactions(true);
        
        // Show success message
        Toast.success(`🎉 Receipt scanned! Found ${formattedTransactions.length} transaction(s)`, 'top');
        
        // Show warnings if any
        if (response.data.warnings && response.data.warnings.length > 0) {
          setTimeout(() => {
            Toast.warn(`⚠️ ${response.data.warnings[0]}`, 'top');
          }, 1500);
        }
      } else {
        throw new Error(response.message || 'Failed to extract transactions from receipt');
      }
    } catch (error: any) {
      console.error('❌ Scan error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to scan receipt';
      Toast.error(`❌ ${errorMessage}`, 'top');
      
      // If scan fails, offer to retry or go back
      Alert.alert(
        'Scan Failed',
        'Unable to extract data from the receipt. The image may be unclear or the receipt format is not supported.',
        [
          { text: 'Try Again', onPress: () => handleScanImage() },
          { text: 'Retake Photo', onPress: () => router.back() }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
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

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setEditForm(prev => ({
      ...prev,
      type: newType,
      transactionType: newType === 'income' ? 'credit' : 'debit',
      selectedCategory: newType === 'income' ? categories.income[0] : categories.expense[0]
    }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEditForm(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newDate = new Date(editForm.date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setEditForm(prev => ({ ...prev, date: newDate }));
    }
  };

  const handleSaveEdit = () => {
    if (!editForm.amount || !editForm.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const updatedTransactions = extractedTransactions.map(t => 
      t.id === editingTransaction.id 
        ? {
            ...t,
            name: editForm.description,
            description: editForm.description,
            category: editForm.selectedCategory.name,
            icon: editForm.selectedCategory.icon,
            amount: parseFloat(editForm.amount),
            type: editForm.type,
            date: editForm.date.toISOString(),
            timestamp: editForm.date.toISOString(),
            isRecurring: editForm.isRecurring,
            recurringDetails: editForm.isRecurring ? {
              frequency: editForm.frequency,
              startDate: editForm.date.toISOString()
            } : null
          }
        : t
    );

    setExtractedTransactions(updatedTransactions);
    setIsEditModalVisible(false);
    setEditingTransaction(null);
    Toast.success('✅ Transaction updated successfully!', 'top');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
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
              disabled={isProcessing || showTransactions}
              className={`flex-1 py-4 rounded-2xl items-center shadow-lg ${
                isProcessing || showTransactions ? 'bg-blue-400' : 'bg-blue-500'
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

        {/* Extracted Transactions List */}
        {showTransactions && extractedTransactions.length > 0 && (
          <View className="px-6 mt-6">
            <View className="bg-white rounded-2xl p-4 shadow-lg mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-800 text-lg font-bold">Extracted Transactions</Text>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-700 text-xs font-semibold">
                    {extractedTransactions.length} items
                  </Text>
                </View>
              </View>
              <Text className="text-gray-500 text-sm">
                Review the transactions below and click "Add to Transactions" to save them.
              </Text>
            </View>

            {/* Transaction Cards */}
            {extractedTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} item={transaction} />
            ))}

            {/* Add to Transactions Button */}
            <TouchableOpacity 
              onPress={handleAddToTransactions}
              disabled={isAddingToDatabase || extractedTransactions.length === 0}
              className={`py-4 rounded-2xl items-center shadow-lg mt-4 mb-6 ${
                isAddingToDatabase || extractedTransactions.length === 0 ? 'bg-green-400' : 'bg-green-500'
              }`}
            >
              {isAddingToDatabase ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Saving...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Add {extractedTransactions.length} Transaction{extractedTransactions.length > 1 ? 's' : ''} to Main List
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Transaction Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-3xl p-6 max-h-[90%] w-[90%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">Edit Transaction</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Transaction Type Selector */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Transaction Type</Text>
                <View className="flex-row bg-gray-100 rounded-2xl p-1">
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-xl ${editForm.transactionType === 'credit' ? 'bg-green-500' : ''}`}
                    onPress={() => handleTypeChange('income')}
                  >
                    <Text className={`text-center font-semibold ${editForm.transactionType === 'credit' ? 'text-white' : 'text-gray-600'}`}>
                      Credit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-xl ${editForm.transactionType === 'debit' ? 'bg-red-500' : ''}`}
                    onPress={() => handleTypeChange('expense')}
                  >
                    <Text className={`text-center font-semibold ${editForm.transactionType === 'debit' ? 'text-white' : 'text-gray-600'}`}>
                      Debit
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amount */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Amount</Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <Text className="text-xl font-bold text-gray-700 mr-2">₹</Text>
                  <TextInput
                    className="flex-1 text-lg font-semibold text-gray-800"
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={editForm.amount}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, amount: text }))}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Name/Description</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <TextInput
                    className="text-base text-gray-800"
                    placeholder="e.g., Lunch at cafe"
                    value={editForm.description}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Category */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Category</Text>
                <TouchableOpacity
                  className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex-row items-center justify-between"
                  onPress={() => setShowCategoryModal(true)}
                >
                  <View className="flex-row items-center">
                    <Ionicons name={editForm.selectedCategory.icon as any} size={20} color="#374151" />
                    <Text className="text-gray-800 ml-2">{editForm.selectedCategory.name}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Date & Time */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Date & Time</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex-row items-center justify-between"
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text className="text-gray-800">{formatDate(editForm.date)}</Text>
                    <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex-row items-center justify-between"
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text className="text-gray-800">{formatTime(editForm.date)}</Text>
                    <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recurring Transaction */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-base font-semibold text-gray-800">Recurring Transaction</Text>
                    <Text className="text-xs text-gray-500 mt-1">Set this transaction to repeat</Text>
                  </View>
                  <TouchableOpacity
                    className={`w-14 h-8 rounded-full p-1 ${editForm.isRecurring ? 'bg-blue-500' : 'bg-gray-300'}`}
                    onPress={() => setEditForm(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
                  >
                    <View className={`w-6 h-6 rounded-full bg-white ${editForm.isRecurring ? 'ml-auto' : ''}`} />
                  </TouchableOpacity>
                </View>

                {editForm.isRecurring && (
                  <View className="flex-row gap-2">
                    {(['weekly', 'monthly', 'custom'] as const).map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        className={`flex-1 py-2 rounded-xl border ${editForm.frequency === freq ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'}`}
                        onPress={() => setEditForm(prev => ({ ...prev, frequency: freq }))}
                      >
                        <Text className={`text-center text-sm ${editForm.frequency === freq ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                className="bg-blue-500 rounded-2xl py-4 mt-4 mb-4"
                onPress={handleSaveEdit}
              >
                <Text className="text-white text-center text-lg font-bold">Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-3xl p-6 max-h-[80%] w-[90%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-3">
                {categories[editForm.type].map((category) => (
                  <TouchableOpacity
                    key={category.name}
                    className={`px-4 py-3 rounded-xl border-2 flex-row items-center ${
                      editForm.selectedCategory.name === category.name
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    onPress={() => {
                      setEditForm(prev => ({ ...prev, selectedCategory: category }));
                      setShowCategoryModal(false);
                    }}
                  >
                    <Ionicons name={category.icon as any} size={20} color={editForm.selectedCategory.name === category.name ? '#3B82F6' : '#374151'} />
                    <Text className={`ml-2 font-medium ${editForm.selectedCategory.name === category.name ? 'text-blue-600' : 'text-gray-700'}`}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={editForm.date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={editForm.date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      </SafeAreaView>
    </LinearGradient>
  );
};

export default AfterImageClickedPage;