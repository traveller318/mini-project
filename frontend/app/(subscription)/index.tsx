import React, { useState, useEffect } from 'react';
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
  Animated,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from 'toastify-react-native';
import {
  getAllSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  recordPayment,
  getCalendarData,
  Subscription as ApiSubscription,
} from '../../services/subscriptionService';

const { width } = Dimensions.get('window');

interface Subscription {
  _id: string;
  name: string;
  icon?: string;
  logo?: string;
  amount: number;
  frequency: string;
  dueDate: string;
  nextDueDate?: string;
  daysUntilDue?: number;
  category: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  color?: string;
}

const SubscriptionScreen = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [calendarData, setCalendarData] = useState<any>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    note: '',
  });
  const [showDateDetailModal, setShowDateDetailModal] = useState(false);
  const [selectedDateSubscriptions, setSelectedDateSubscriptions] = useState<Subscription[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Entertainment',
    amount: '',
    frequency: 'monthly',
    startDate: '',
    endDate: '',
    dueDate: '',
    description: '',
    logo: null as string | null,
    color: '#3B82F6'
  });

  // Fetch subscriptions on mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await getAllSubscriptions();
      if (response.success && response.data?.subscriptions) {
        setSubscriptions(response.data.subscriptions);
      }
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      Toast.error(error.message || 'Failed to fetch subscriptions', 'top');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCalendarDataForMonth = async (month: number, year: number) => {
    try {
      const response = await getCalendarData(month, year);
      if (response.success && response.data?.calendarData) {
        setCalendarData(response.data.calendarData);
      }
    } catch (error: any) {
      console.error('Error fetching calendar data:', error);
    }
  };

  // Get marked dates for calendar
  const getMarkedDates = () => {
    const marked: any = {};
    const today = new Date().toISOString().split('T')[0];
    
    // Mark today
    marked[today] = {
      selected: true,
      selectedColor: '#2563eb',
      selectedTextColor: 'white',
      marked: true,
      dotColor: '#2563eb'
    };

    subscriptions.forEach(sub => {
      const startDate = sub.startDate ? new Date(sub.startDate) : new Date(sub.dueDate);
      const endDate = sub.endDate ? new Date(sub.endDate) : null;
      const dueDay = new Date(sub.dueDate).getDate();
      
      // Calculate all recurring dates from start to end (or next 12 months if no end date)
      const maxDate = endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1));
      const currentDate = new Date(startDate);
      
      // Set the day to the due date day
      currentDate.setDate(dueDay);
      
      while (currentDate <= maxDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        const daysUntilDue = Math.ceil((currentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateString === today) {
          // Don't override today's marking, just add dot
          marked[dateString] = {
            ...marked[dateString],
            marked: true,
            dotColor: getDotColor(daysUntilDue)
          };
        } else {
          marked[dateString] = {
            marked: true,
            dotColor: getDotColor(daysUntilDue),
            customStyles: {
              container: {
                backgroundColor: getDotColor(daysUntilDue),
                borderRadius: 16,
              },
              text: {
                color: 'white',
                fontWeight: 'bold'
              },
            }
          };
        }
        
        // Move to next month/week/year based on frequency
        switch (sub.frequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'quarterly':
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
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

  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleDayPress = (day: DateData) => {
    const selectedDateStr = day.dateString;
    setSelectedDate(selectedDateStr);
    
    // Find all subscriptions that are due on this date
    const subsForDate: Subscription[] = [];
    const selectedDateObj = new Date(selectedDateStr);
    const selectedDay = selectedDateObj.getDate();
    
    subscriptions.forEach(sub => {
      const startDate = sub.startDate ? new Date(sub.startDate) : new Date(sub.dueDate);
      const endDate = sub.endDate ? new Date(sub.endDate) : null;
      const dueDay = new Date(sub.dueDate).getDate();
      
      // Check if this subscription is due on the selected date
      if (selectedDay === dueDay) {
        // Check if the selected date is within the subscription period
        const maxDate = endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        
        if (selectedDateObj >= startDate && selectedDateObj <= maxDate) {
          // Check if it matches the frequency
          const monthsDiff = (selectedDateObj.getFullYear() - startDate.getFullYear()) * 12 + 
                            (selectedDateObj.getMonth() - startDate.getMonth());
          
          let isDue = false;
          switch (sub.frequency) {
            case 'daily':
              isDue = true;
              break;
            case 'weekly':
              const daysDiff = Math.floor((selectedDateObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              isDue = daysDiff % 7 === 0;
              break;
            case 'monthly':
              isDue = true;
              break;
            case 'quarterly':
              isDue = monthsDiff % 3 === 0;
              break;
            case 'yearly':
              isDue = monthsDiff % 12 === 0;
              break;
            default:
              isDue = true;
          }
          
          if (isDue) {
            subsForDate.push(sub);
          }
        }
      }
    });
    
    setSelectedDateSubscriptions(subsForDate);
    setShowDateDetailModal(true);
  };

  const closeDateDetailModal = () => {
    setShowDateDetailModal(false);
    setSelectedDateSubscriptions([]);
    setSelectedDate('');
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      category: 'Entertainment',
      amount: '',
      frequency: 'monthly',
      startDate: getTodayDateString(),
      endDate: '',
      dueDate: getTodayDateString(),
      description: '',
      logo: null,
      color: '#3B82F6'
    });
    setIsEditMode(false);
    setSelectedSubscription(null);
    setShowAddModal(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const openEditModal = (subscription: Subscription) => {
    setIsEditMode(true);
    setSelectedSubscription(subscription);
    setFormData({
      name: subscription.name,
      category: subscription.category,
      amount: subscription.amount.toString(),
      frequency: subscription.frequency,
      startDate: subscription.startDate ? new Date(subscription.startDate).toISOString().split('T')[0] : '',
      endDate: subscription.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : '',
      dueDate: new Date(subscription.dueDate).toISOString().split('T')[0],
      description: subscription.description || '',
      logo: subscription.logo || null,
      color: subscription.color || '#3B82F6'
    });
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

  const handleSave = async () => {
    if (!formData.name || !formData.amount || !formData.dueDate) {
      Toast.error('Please fill in all required fields', 'top');
      return;
    }

    // Validate date format
    const dueDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dueDateRegex.test(formData.dueDate)) {
      Toast.error('Due date must be in YYYY-MM-DD format', 'top');
      return;
    }

    // Validate that due date is a valid date
    const dueDate = new Date(formData.dueDate);
    if (isNaN(dueDate.getTime())) {
      Toast.error('Please enter a valid due date', 'top');
      return;
    }

    try {
      const subscriptionData: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        dueDate: formData.dueDate,
        logo: formData.logo || formData.name.charAt(0).toLowerCase(),
        color: formData.color,
        icon: getCategoryIcon(formData.category)
      };

      // Only add optional dates if they are valid
      if (formData.startDate && /^\d{4}-\d{2}-\d{2}$/.test(formData.startDate)) {
        const startDate = new Date(formData.startDate);
        if (!isNaN(startDate.getTime())) {
          subscriptionData.startDate = formData.startDate;
        }
      }

      if (formData.endDate && /^\d{4}-\d{2}-\d{2}$/.test(formData.endDate)) {
        const endDate = new Date(formData.endDate);
        if (!isNaN(endDate.getTime())) {
          subscriptionData.endDate = formData.endDate;
        }
      }

      if (isEditMode && selectedSubscription) {
        // Update existing subscription
        const response = await updateSubscription(selectedSubscription._id, subscriptionData);
        if (response.success) {
          Toast.success('Subscription updated successfully', 'top');
          await fetchSubscriptions();
        }
      } else {
        // Create new subscription
        const response = await createSubscription(subscriptionData);
        if (response.success) {
          Toast.success('Subscription created successfully', 'top');
          await fetchSubscriptions();
        }
      }

      closeModal();
    } catch (error: any) {
      console.error('Error saving subscription:', error);
      Toast.error(error.message || 'Failed to save subscription', 'top');
    }
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

  const handleDeleteSubscription = async (id: string) => {
    Alert.alert(
      'Delete Subscription',
      'Are you sure you want to delete this subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteSubscription(id);
              if (response.success) {
                Toast.success('Subscription deleted successfully', 'top');
                await fetchSubscriptions();
              }
            } catch (error: any) {
              console.error('Error deleting subscription:', error);
              Toast.error(error.message || 'Failed to delete subscription', 'top');
            }
          }
        }
      ]
    );
  };

  const openPaymentModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setPaymentData({
      amount: subscription.amount.toString(),
      note: '',
    });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedSubscription(null);
  };

  const handleRecordPayment = async () => {
    if (!paymentData.amount || !selectedSubscription) {
      Toast.error('Please enter a payment amount', 'top');
      return;
    }

    try {
      const response = await recordPayment(selectedSubscription._id, {
        amount: parseFloat(paymentData.amount),
        note: paymentData.note,
        status: 'success',
        paidOn: new Date().toISOString(),
      });

      if (response.success) {
        Toast.success('Payment recorded successfully', 'top');
        await fetchSubscriptions();
        closePaymentModal();
      }
    } catch (error: any) {
      console.error('Error recording payment:', error);
      Toast.error(error.message || 'Failed to record payment', 'top');
    }
  };

  const renderSubscriptionCard = (item: Subscription, index: number) => {
    const daysUntilDue = item.daysUntilDue || 0;
    const displayDate = item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : new Date(item.dueDate).toLocaleDateString();
    
    return (
      <View 
        key={item._id}
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
              <Ionicons name={(item.icon || 'ellipsis-horizontal') as any} size={20} color="#2563eb" />
            )}
          </View>
          <View className="flex-row">
            <TouchableOpacity 
              onPress={() => openEditModal(item)}
              className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-1"
            >
              <Ionicons name="pencil" size={14} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDeleteSubscription(item._id)}
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
          ₹{item.amount}/{item.frequency === 'monthly' ? 'mo' : item.frequency.substring(0, 2)}
        </Text>
        
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-400 text-xs">Due: {displayDate.split(',')[0]}</Text>
          <View className={`px-2 py-1 rounded-full ${
            daysUntilDue < 3 ? 'bg-red-100' : 
            daysUntilDue <= 7 ? 'bg-amber-100' : 'bg-green-100'
          }`}>
            <Text className={`text-xs font-medium ${
              daysUntilDue < 3 ? 'text-red-600' : 
              daysUntilDue <= 7 ? 'text-amber-600' : 'text-green-600'
            }`}>
              {daysUntilDue}d
            </Text>
          </View>
        </View>

        {/* Mark as Paid Button */}
        <TouchableOpacity 
          onPress={() => openPaymentModal(item)}
          className="bg-blue-500 rounded-xl py-2 items-center"
        >
          <Text className="text-white text-xs font-semibold">Mark as Paid</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#e0f2fe', '#bae6fd', '#7dd3fc']} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-700 mt-4">Loading subscriptions...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#e0f2fe', '#bae6fd', '#7dd3fc']} className="flex-1">
      <Stack.Screen options={{ 
        headerTitle: "Bills & Subscriptions", 
        headerStyle: { backgroundColor: '#e0f2fe' },
        headerTitleStyle: { color: '#1e3a8a', fontWeight: 'bold' },
        headerShadowVisible: false
      }} />
      
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchSubscriptions();
              }}
              tintColor="#2563eb"
              colors={["#2563eb"]}
            />
          }
        >
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
                onDayPress={handleDayPress}
                onMonthChange={(date: DateData) => {
                  fetchCalendarDataForMonth(date.month, date.year);
                }}
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
              ₹{subscriptions
                .filter(sub => sub.frequency === 'monthly')
                .reduce((sum, item) => sum + item.amount, 0)
                .toFixed(2)}
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''} total
            </Text>
          </View>

          {/* Subscriptions Grid */}
          <View className="px-4 mb-6">
            <Text className="text-xl font-bold text-blue-900 mb-4">Your Subscriptions</Text>
            {subscriptions.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 items-center justify-center" style={{ minHeight: 200 }}>
                <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 text-lg font-semibold mt-4">No Subscriptions Yet</Text>
                <Text className="text-gray-400 text-center mt-2">
                  Add your subscriptions to track them here
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {subscriptions.map((item, index) => renderSubscriptionCard(item, index))}
              </View>
            )}
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
                <Text className="text-xl font-bold text-blue-900">
                  {isEditMode ? 'Edit Subscription' : 'Add Subscription'}
                </Text>
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
                  {formData.logo || formData.name ? (
                    <Text className="text-blue-600 font-bold text-2xl">
                      {(formData.logo || formData.name.charAt(0)).toUpperCase()}
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

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">Description</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="Enter description (optional)"
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    multiline
                    numberOfLines={2}
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

                {/* Frequency */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">Frequency *</Text>
                  <View className="flex-row flex-wrap">
                    {[
                      { label: 'Daily', value: 'daily' },
                      { label: 'Weekly', value: 'weekly' },
                      { label: 'Monthly', value: 'monthly' },
                      { label: 'Quarterly', value: 'quarterly' },
                      { label: 'Yearly', value: 'yearly' }
                    ].map(freq => (
                      <TouchableOpacity
                        key={freq.value}
                        onPress={() => setFormData(prev => ({ ...prev, frequency: freq.value }))}
                        className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                          formData.frequency === freq.value ? 'bg-blue-500' : 'bg-gray-100'
                        }`}
                      >
                        <Text className={`${
                          formData.frequency === freq.value ? 'text-white' : 'text-gray-600'
                        }`}>
                          {freq.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Due Date */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-medium mb-2">Due Date *</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="YYYY-MM-DD (e.g., 2025-11-15)"
                    value={formData.dueDate}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, dueDate: text }))}
                  />
                  <Text className="text-gray-400 text-xs mt-1">Format: YYYY-MM-DD</Text>
                </View>

                {/* Start Date and End Date Side by Side */}
                <View className="flex-row mb-6">
                  {/* Start Date */}
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-700 font-medium mb-2">Start Date</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl px-3 py-3 text-gray-800"
                      placeholder="YYYY-MM-DD"
                      value={formData.startDate}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, startDate: text }))}
                    />
                  </View>

                  {/* End Date */}
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-700 font-medium mb-2">End Date</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl px-3 py-3 text-gray-800"
                      placeholder="YYYY-MM-DD"
                      value={formData.endDate}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, endDate: text }))}
                    />
                  </View>
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
                    <Text className="text-white font-semibold">
                      {isEditMode ? 'Update' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

        {/* Record Payment Modal */}
        <Modal
          visible={showPaymentModal}
          transparent={true}
          animationType="slide"
          onRequestClose={closePaymentModal}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-3xl mx-4 p-6 w-11/12 max-w-md">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-blue-900">Record Payment</Text>
                <TouchableOpacity onPress={closePaymentModal}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {selectedSubscription && (
                <>
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">Subscription</Text>
                    <View className="bg-gray-50 rounded-xl p-3">
                      <Text className="text-gray-900 font-semibold">{selectedSubscription.name}</Text>
                      <Text className="text-gray-500 text-sm">{selectedSubscription.category}</Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">Amount *</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                      placeholder="Enter amount"
                      value={paymentData.amount}
                      onChangeText={(text) => setPaymentData(prev => ({ ...prev, amount: text }))}
                      keyboardType="numeric"
                    />
                  </View>

                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">Note (Optional)</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                      placeholder="Add a note"
                      value={paymentData.note}
                      onChangeText={(text) => setPaymentData(prev => ({ ...prev, note: text }))}
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  <View className="flex-row justify-between">
                    <TouchableOpacity 
                      onPress={closePaymentModal}
                      className="flex-1 py-3 rounded-xl bg-gray-100 mr-2 items-center"
                    >
                      <Text className="text-gray-600 font-semibold">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleRecordPayment}
                      className="flex-1 py-3 rounded-xl bg-blue-500 ml-2 items-center"
                    >
                      <Text className="text-white font-semibold">Record Payment</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Date Detail Modal - Shows subscriptions due on selected date */}
        <Modal
          visible={showDateDetailModal}
          transparent={true}
          animationType="slide"
          onRequestClose={closeDateDetailModal}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6 max-h-[70%]">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-xl font-bold text-blue-900">
                    Subscriptions Due
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
                <TouchableOpacity onPress={closeDateDetailModal}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedDateSubscriptions.length === 0 ? (
                  <View className="items-center py-8">
                    <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
                    <Text className="text-gray-500 text-lg font-semibold mt-4">
                      No Subscriptions Due
                    </Text>
                    <Text className="text-gray-400 text-center mt-2">
                      No subscriptions are due on this date
                    </Text>
                  </View>
                ) : (
                  <View>
                    {selectedDateSubscriptions.map((sub) => (
                      <View 
                        key={sub._id}
                        className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-100"
                      >
                        <View className="flex-row items-start">
                          <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                            {sub.logo && sub.logo.length === 1 ? (
                              <Text className="text-blue-600 font-bold text-lg">
                                {sub.logo.toUpperCase()}
                              </Text>
                            ) : (
                              <Ionicons name={(sub.icon || 'ellipsis-horizontal') as any} size={20} color="#2563eb" />
                            )}
                          </View>
                          
                          <View className="flex-1">
                            <Text className="text-gray-900 font-semibold text-base mb-1">
                              {sub.name}
                            </Text>
                            <Text className="text-gray-500 text-xs mb-2">{sub.category}</Text>
                            
                            <View className="flex-row justify-between items-center">
                              <Text className="text-blue-600 font-bold text-lg">
                                ₹{sub.amount}
                              </Text>
                              <View className="bg-blue-100 px-3 py-1 rounded-full">
                                <Text className="text-blue-600 text-xs font-medium">
                                  {sub.frequency}
                                </Text>
                              </View>
                            </View>

                            {sub.description && (
                              <Text className="text-gray-500 text-xs mt-2">
                                {sub.description}
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Quick Action Button */}
                        <TouchableOpacity 
                          onPress={() => {
                            closeDateDetailModal();
                            openPaymentModal(sub);
                          }}
                          className="bg-blue-500 rounded-xl py-2 items-center mt-3"
                        >
                          <Text className="text-white text-sm font-semibold">Mark as Paid</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SubscriptionScreen;
