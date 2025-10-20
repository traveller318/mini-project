import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { upcomingBillsAndSubscriptions } from '../../data/data';
// import * as ImagePicker from 'expo-image-picker'; // Optional: install expo-image-picker for logo uploads

const { width } = Dimensions.get('window');

interface Subscription {
  id: number;
  name: string;
  icon: string;
  logo: string;
  amount: number;
  frequency: string;
  dueDate: string;
  daysUntilDue: number;
  category: string;
  startDate?: string;
  endDate?: string;
}

const SubscriptionScreen = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(upcomingBillsAndSubscriptions);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Entertainment',
    amount: '',
    startDate: '',
    endDate: '',
    logo: null as string | null
  });

  // Get marked dates for calendar
  const getMarkedDates = () => {
    const marked: any = {};
    const today = new Date().toISOString().split('T')[0];
    
    // Mark today
    marked[today] = {
      selected: true,
      selectedColor: '#2563eb',
      selectedTextColor: 'white'
    };

    subscriptions.forEach(sub => {
      const dueDate = convertToDateString(sub.dueDate);
      if (dueDate && dueDate !== today) {
        marked[dueDate] = {
          marked: true,
          dotColor: getDotColor(sub.daysUntilDue),
          customStyles: {
            container: {
              backgroundColor: getDotColor(sub.daysUntilDue),
              borderRadius: 16,
            },
            text: {
              color: 'white',
              fontWeight: 'bold'
            },
          }
        };
      }
    });

    return marked;
  };

  const convertToDateString = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  };

  const getDotColor = (daysUntilDue: number) => {
    if (daysUntilDue < 3) return '#EF4444'; // Red
    if (daysUntilDue <= 7) return '#F59E0B'; // Amber
    return '#10B981'; // Green
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      category: 'Entertainment',
      amount: '',
      startDate: '',
      endDate: '',
      logo: null
    });
    setSelectedSubscription(null);
    setShowAddModal(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowAddModal(false);
    });
  };

  const pickImage = async () => {
    // For now, just use the first letter of the company name as logo
    // To enable image upload, install expo-image-picker: npm install expo-image-picker
    Alert.alert(
      'Logo Upload', 
      'Logo upload feature requires expo-image-picker.\nFor now, the first letter of the company name will be used as the logo.',
      [{ text: 'OK' }]
    );
  };

  const handleSave = () => {
    if (!formData.name || !formData.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newSubscription: Subscription = {
      id: Date.now(),
      name: formData.name,
      icon: getCategoryIcon(formData.category),
      logo: formData.logo || formData.name.charAt(0).toLowerCase(),
      amount: parseInt(formData.amount),
      frequency: 'mo',
      dueDate: formData.endDate || new Date().toDateString(),
      daysUntilDue: calculateDaysUntilDue(formData.endDate),
      category: formData.category,
      startDate: formData.startDate,
      endDate: formData.endDate
    };

    setSubscriptions(prev => [...prev, newSubscription]);
    closeModal();
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Entertainment': 'musical-notes',
      'Bills': 'receipt',
      'EMI': 'home',
      'Other': 'ellipsis-horizontal'
    };
    return icons[category] || 'ellipsis-horizontal';
  };

  const calculateDaysUntilDue = (dateString: string) => {
    if (!dateString) return 30;
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const deleteSubscription = (id: number) => {
    Alert.alert(
      'Delete Subscription',
      'Are you sure you want to delete this subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setSubscriptions(prev => prev.filter(sub => sub.id !== id))
        }
      ]
    );
  };

  const renderSubscriptionCard = (item: Subscription, index: number) => {
    return (
      <View 
        key={item.id}
        className="bg-white rounded-2xl p-3 shadow-sm"
        style={{ 
          width: (width - 40) / 2,
          marginBottom: 12,
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
            {item.logo && item.logo.length === 1 ? (
              <Text className="text-blue-600 font-bold text-lg">{item.logo.toUpperCase()}</Text>
            ) : (
              <Ionicons name={item.icon as any} size={20} color="#2563eb" />
            )}
          </View>
          <View className="flex-row">
            <TouchableOpacity 
              onPress={() => deleteSubscription(item.id)}
              className="w-8 h-8 rounded-full bg-red-50 items-center justify-center ml-1"
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text className="text-gray-900 font-semibold text-base mb-1" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-gray-500 text-xs mb-2">{item.category}</Text>
        
        <Text className="text-blue-600 font-bold text-lg mb-2">
          ₹{item.amount}/{item.frequency}
        </Text>
        
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-400 text-xs">Due: {item.dueDate.split(',')[0]}</Text>
          <View className={`px-2 py-1 rounded-full ${
            item.daysUntilDue < 3 ? 'bg-red-100' : 
            item.daysUntilDue <= 7 ? 'bg-amber-100' : 'bg-green-100'
          }`}>
            <Text className={`text-xs font-medium ${
              item.daysUntilDue < 3 ? 'text-red-600' : 
              item.daysUntilDue <= 7 ? 'text-amber-600' : 'text-green-600'
            }`}>
              {item.daysUntilDue}d
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#e0f2fe', '#bae6fd', '#7dd3fc']} className="flex-1">
      <Stack.Screen options={{ 
        headerTitle: "Bills & Subscriptions", 
        headerStyle: { backgroundColor: '#e0f2fe' },
        headerTitleStyle: { color: '#1e3a8a', fontWeight: 'bold' },
        headerShadowVisible: false
      }} />
      
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-4 pt-4 pb-2">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-blue-900 mb-1">📅 Calendar</Text>
                <Text className="text-gray-600">
                  View all your upcoming subscriptions, EMIs, and bills.
                </Text>
              </View>
              <TouchableOpacity 
                onPress={openAddModal}
                className="bg-blue-500 px-4 py-2 rounded-full shadow-lg"
                style={{
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="add" size={18} color="white" />
                  <Text className="text-white font-semibold ml-1">Add</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Calendar */}
          <View className="mx-4 mb-6">
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden"
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 6
              }}
            >
              <Calendar
                markedDates={getMarkedDates()}
                theme={{
                  backgroundColor: 'white',
                  calendarBackground: 'white',
                  textSectionTitleColor: '#2563eb',
                  selectedDayBackgroundColor: '#2563eb',
                  selectedDayTextColor: 'white',
                  todayTextColor: '#2563eb',
                  dayTextColor: '#374151',
                  textDisabledColor: '#9CA3AF',
                  dotColor: '#2563eb',
                  selectedDotColor: 'white',
                  arrowColor: '#2563eb',
                  monthTextColor: '#1e3a8a',
                  indicatorColor: '#2563eb',
                  textDayFontFamily: 'Poppins-Regular',
                  textMonthFontFamily: 'Poppins-SemiBold',
                  textDayHeaderFontFamily: 'Poppins-Medium',
                  textDayFontSize: 14,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 12
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12
                }}
              />
            </View>
          </View>

          {/* Monthly Total */}
          <View className="mx-4 p-4 bg-white rounded-2xl shadow-sm mb-6"
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <Text className="text-gray-500 text-base mb-1">Total Monthly Recurring</Text>
            <Text className="text-blue-900 font-bold text-3xl">
              ₹{subscriptions.reduce((sum, item) => sum + item.amount, 0)}
            </Text>
          </View>

          {/* Subscriptions Grid */}
          <View className="px-4 mb-6">
            <Text className="text-xl font-bold text-blue-900 mb-4">Your Subscriptions</Text>
            <View className="flex-row flex-wrap justify-between">
              {subscriptions.map((item, index) => renderSubscriptionCard(item, index))}
            </View>
          </View>
        </ScrollView>

        {/* Add Subscription Modal */}
        <Modal
          visible={showAddModal}
          transparent={true}
          animationType="none"
          onRequestClose={closeModal}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <Animated.View 
              style={{ opacity: fadeAnim }}
              className="bg-white rounded-3xl mx-4 p-6 w-11/12 max-w-md"
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-blue-900">Add Subscription</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Logo Upload */}
                <TouchableOpacity 
                  onPress={pickImage}
                  className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-4 self-center"
                >
                  {formData.logo ? (
                    <Text className="text-blue-600 font-bold text-2xl">
                      {formData.name.charAt(0).toUpperCase()}
                    </Text>
                  ) : (
                    <Ionicons name="camera" size={24} color="#2563eb" />
                  )}
                </TouchableOpacity>

                {/* Company Name */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">Company Name *</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="Enter company name"
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  />
                </View>

                {/* Subscription Type */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">Subscription Type</Text>
                  <View className="flex-row flex-wrap">
                    {['Entertainment', 'Bills', 'EMI', 'Other'].map(type => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setFormData(prev => ({ ...prev, category: type }))}
                        className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                          formData.category === type ? 'bg-blue-500' : 'bg-gray-100'
                        }`}
                      >
                        <Text className={`${
                          formData.category === type ? 'text-white' : 'text-gray-600'
                        }`}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Amount */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">Amount *</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                    keyboardType="numeric"
                  />
                </View>

                {/* Start Date */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">Start Date</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="YYYY-MM-DD"
                    value={formData.startDate}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, startDate: text }))}
                  />
                </View>

                {/* End Date */}
                <View className="mb-6">
                  <Text className="text-gray-700 font-medium mb-2">End Date</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="YYYY-MM-DD"
                    value={formData.endDate}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, endDate: text }))}
                  />
                </View>

                {/* Buttons */}
                <View className="flex-row justify-between">
                  <TouchableOpacity 
                    onPress={closeModal}
                    className="flex-1 py-3 rounded-xl bg-gray-100 mr-2 items-center"
                  >
                    <Text className="text-gray-600 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleSave}
                    className="flex-1 py-3 rounded-xl bg-blue-500 ml-2 items-center"
                  >
                    <Text className="text-white font-semibold">Save Subscription</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SubscriptionScreen;
