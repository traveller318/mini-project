import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Toast } from 'toastify-react-native';
import { userData, allTransactions, transactionCategories } from '../../data/data';
import TabNavigation from '../../components/TabNavigation';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

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

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
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

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleScanPress = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Toast.error('📷 Camera permission required to scan receipts', 'top');
        return;
      }

      // Show loading toast while preparing camera
      Toast.info('📸 Opening camera...', 'top');

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Navigate to afterTake screen with the image data
        router.push({
          pathname: '/(afterTake)',
          params: {
            imageUri: asset.uri,
            fileName: asset.fileName || 'captured_image.jpg',
            fileSize: asset.fileSize?.toString() || '0',
            width: asset.width?.toString() || '0',
            height: asset.height?.toString() || '0'
          }
        });
      }
    } catch (error) {
      console.log('Camera Error: ', error);
      Toast.error('❌ Unable to access camera. Please try again.', 'top');
    }
  };

  const handleUploadPress = async () => {
    try {
      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets[0]) {
        const doc = result.assets[0];
        
        // Show success toast
        Toast.success('📄 Document uploaded successfully!', 'top');
        
        // Navigate to afterDocUpload screen with document data
        router.push({
          pathname: '/(afterDocUpload)' as any,
          params: {
            docUri: doc.uri,
            fileName: doc.name,
            fileSize: doc.size?.toString() || '0',
            mimeType: doc.mimeType || 'application/pdf'
          }
        });
      }
    } catch (error: any) {
      console.log('Document Picker Error: ', error);
      Toast.error('❌ Unable to pick document. Please try again.', 'top');
    }
  };

  const ActionButton = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className="items-center mx-4">
      <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-lg">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text className="text-gray-600 text-xs mt-2 font-medium">{label}</Text>
    </TouchableOpacity>
  );

  const handleEditTransaction = (transactionId: string) => {
    const transaction = allTransactions.find(t => t.id.toString() === transactionId.toString());
    if (transaction) {
      setEditingTransaction(transaction);
      const txnType = transaction.type as 'income' | 'expense';
      const categoryList = txnType === 'income' ? categories.income : categories.expense;
      const foundCategory = categoryList.find((c: any) => c.name === transaction.category) || categoryList[0];
      
      setEditForm({
        transactionType: txnType === 'income' ? 'credit' : 'debit',
        type: txnType,
        amount: Math.abs(transaction.amount).toString(),
        description: transaction.name,
        selectedCategory: foundCategory,
        date: new Date(),
        isRecurring: false,
        frequency: 'monthly'
      });
      setIsEditModalVisible(true);
    } else {
      console.log('Transaction not found:', transactionId);
      Toast.error('Transaction not found', 'top');
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete transaction:', transactionId);
    Toast.info('Delete functionality coming soon!', 'top');
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

    // Update the transaction in the data
    // Note: In a real app, this would update the backend/database
    setIsEditModalVisible(false);
    Toast.success('✅ Transaction updated successfully!', 'top');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const TransactionItem = ({ item }: { item: any }) => (
    <View className="bg-white mx-4 mb-3 p-4 rounded-2xl shadow-sm border border-gray-50">
      {/* Action Icons - Top Right */}
      <View className="absolute top-2 right-2 flex-row items-center z-10">
        <TouchableOpacity 
          onPress={() => handleEditTransaction(item.id.toString())}
          className="w-7 h-7 bg-blue-50 rounded-full items-center justify-center mr-1.5"
          activeOpacity={0.7}
        >
          <Text className="text-xs">✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDeleteTransaction(item.id.toString())}
          className="w-7 h-7 bg-red-50 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <Text className="text-xs">🗑️</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
            <Text className="text-lg">{item.icon}</Text>
          </View>
          <View className="flex-1 pr-14">
            <Text className="font-semibold text-gray-800 text-base">{item.name}</Text>
            <Text className="text-gray-500 text-sm">{item.timestamp}</Text>
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

  const CategoryItem = ({ category }: { category: any }) => {
    const isExpanded = expandedCategories.includes(category.name);
    
    return (
      <View className="bg-white mx-4 mb-3 rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <TouchableOpacity 
          onPress={() => toggleCategory(category.name)}
          className="p-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1">
            <View 
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: category.color + '20' }}
            >
              <Text className="text-lg">{category.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800 text-base">{category.name}</Text>
              <Text className="text-gray-500 text-sm">{category.transactions.length} transactions</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className={`font-bold text-lg ${
              category.totalAmount >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {category.totalAmount >= 0 ? '+' : ''} ₹{category.totalAmount.toLocaleString()}
            </Text>
            <Text className="text-gray-400 text-xs">
              {isExpanded ? '▲' : '▼'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View className="border-t border-gray-100">
            {category.transactions.map((transaction: any) => (
              <View key={transaction.id} className="px-4 py-3 border-b border-gray-50 last:border-b-0">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-sm">{transaction.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-700 text-sm">{transaction.name}</Text>
                      <Text className="text-gray-400 text-xs">{transaction.date}</Text>
                    </View>
                  </View>
                  <Text className={`font-semibold text-sm ${
                    transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} ₹{Math.abs(transaction.amount).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#e0f2fe", "#bae6fd", "#7dd3fc"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="pb-8">
          <View className="pt-5 pb-6">
            <Text className="text-center text-gray-800 text-xl font-bold">Transactions</Text>
          </View>

          {/* Total Balance Section */}
          <View className="px-6 pb-4">
            <View className="bg-white rounded-2xl p-4 shadow-lg">
              <View className="items-center mb-4">
                <Text className="text-gray-500 text-xs mb-1">Total Balance</Text>
                <Text className="text-gray-800 text-2xl font-bold">₹ 2,548.00</Text>
                <Text className="text-gray-400 text-xs mt-1">as of today</Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-around items-center">
                <ActionButton 
                  icon="➕" 
                  label="Add" 
                  onPress={() => router.push('/(addTransaction)')} 
                />
                <ActionButton 
                  icon="📷" 
                  label="Scan" 
                  onPress={handleScanPress} 
                />
                <ActionButton 
                  icon="📄" 
                  label="Upload" 
                  onPress={handleUploadPress} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* White Container Section with Tabs and Content */}
        <View 
          className="bg-white shadow-lg"
          style={{
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            marginTop: -10,
            flex: 1,
            paddingBottom: 0,
            marginBottom: -50
          }}
        >
          {/* Tab Navigation */}
          <TabNavigation
            tabs={[
              { key: 'transactions', label: 'Transactions' },
              { key: 'groups', label: 'Groups' }
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Tab Content */}
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {activeTab === 'transactions' ? (
              // Transactions Tab Content
              <View className="pb-4">
                {allTransactions.length === 0 ? (
                  <View className="items-center justify-center py-20">
                    <Text className="text-gray-400 text-base">No transactions yet</Text>
                  </View>
                ) : (
                  allTransactions.map((transaction) => (
                    <TransactionItem key={transaction.id} item={transaction} />
                  ))
                )}
              </View>
            ) : (
              // Groups Tab Content
              <View className="pb-4">
                {transactionCategories.length === 0 ? (
                  <View className="items-center justify-center py-20">
                    <Text className="text-gray-400 text-base">No categories yet</Text>
                  </View>
                ) : (
                  transactionCategories.map((category) => (
                    <CategoryItem key={category.name} category={category} />
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>

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
}