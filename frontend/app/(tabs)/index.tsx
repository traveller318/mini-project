import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardData, DashboardData } from '../../services/userService';
import { getAllTransactions } from '../../services/transactionService';

const Dashboard = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [progressAnims, setProgressAnims] = useState<Animated.Value[]>([]);
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await getDashboardData();
      
      if (response.success && response.data) {
        setDashboardData(response.data);
        
        // Initialize progress animations for goals
        const anims = response.data.savingGoals.map(() => new Animated.Value(0));
        setProgressAnims(anims);
        
        // Start animations
        anims.forEach((anim, index) => {
          const goal = response.data!.savingGoals[index];
          const progress = goal.current / goal.target;
          Animated.timing(anim, {
            toValue: progress,
            duration: 1000 + index * 200,
            useNativeDriver: false,
          }).start();
        });
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Fetch data
    fetchDashboardData();
  }, []);

  // Re-fetch dashboard data when screen comes into focus (helps after creating/updating subscriptions)
  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
      // no cleanup needed
      return () => {};
    }, [])
  );

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const Header = () => (
    <View className="flex-row justify-between items-center px-6 pt-4 pb-6">
      <TouchableOpacity 
        onPress={() => router.push('/(userProfile)')}
        className="flex-row items-center"
      >
        <View className="w-12 h-12 rounded-full bg-blue-600 mr-3 justify-center items-center">
          <Text className="text-white font-bold text-lg">
            {dashboardData?.userData?.name?.substring(0, 2).toUpperCase() || 'JD'}
          </Text>
        </View>
        <View>
          <Text className="text-gray-700 text-sm">Hello, welcome back!</Text>
          <Text className="text-gray-800 font-semibold text-lg">
            {dashboardData?.userData?.name || 'User'}
          </Text>
        </View>
      </TouchableOpacity>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity 
          onPress={() => router.push('/(subscription)')}
          className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
        >
          <Ionicons name="card-outline" size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/(budget)')}
          className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
        >
          <Ionicons name="wallet-outline" size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/(recommander)')}
          className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
        >
          <Ionicons name="bulb-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const CashFlowSummary = () => {
    if (!dashboardData?.userData) return null;

    // Calculate total income and expenses from real transaction data
    const totalIncome = dashboardData.userData.income.amount;
    const totalExpenses = dashboardData.userData.expense.amount;
    const netSavings = totalIncome - totalExpenses;

    return (
      <Animated.View 
        style={{ opacity: fadeAnim }}
        className="mx-4 mb-4 p-4 rounded-xl bg-white/95 backdrop-blur-lg border border-white/30 shadow-xl"
      >
        <Text className="text-gray-700 text-lg font-semibold mb-4 text-center">Cash Flow Summary</Text>
        
        {/* Single row layout for all three items */}
        <View className="flex-row justify-between items-center">
          {/* Total Income */}
          <View className="flex-1 items-center px-2">
            <View className="w-12 h-12 bg-green-100 rounded-full justify-center items-center mb-2">
              <Ionicons name="trending-up" size={20} color="#10B981" />
            </View>
            <Text className="text-gray-600 text-xs mb-1 text-center" numberOfLines={1}>Income</Text>
            <Text className="text-green-600 text-base font-bold text-center" numberOfLines={1}>
              +₹{totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Text>
          </View>

          {/* Divider */}
          <View className="w-px h-16 bg-gray-200 mx-2" />

          {/* Total Expenses */}
          <View className="flex-1 items-center px-2">
            <View className="w-12 h-12 bg-red-100 rounded-full justify-center items-center mb-2">
              <Ionicons name="trending-down" size={20} color="#EF4444" />
            </View>
            <Text className="text-gray-600 text-xs mb-1 text-center" numberOfLines={1}>Expenses</Text>
            <Text className="text-red-600 text-base font-bold text-center" numberOfLines={1}>
              -₹{totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Text>
          </View>

          {/* Divider */}
          <View className="w-px h-16 bg-gray-200 mx-2" />

          {/* Net Savings */}
          <View className="flex-1 items-center px-2">
            <View className={`w-12 h-12 rounded-full justify-center items-center mb-2 ${netSavings >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <Ionicons 
                name={netSavings >= 0 ? "wallet" : "warning"} 
                size={20} 
                color={netSavings >= 0 ? "#3B82F6" : "#F59E0B"} 
              />
            </View>
            <Text className="text-gray-600 text-xs mb-1 text-center" numberOfLines={1}>Net Savings</Text>
            <Text className={`text-base font-bold text-center ${netSavings >= 0 ? 'text-blue-600' : 'text-orange-600'}`} numberOfLines={1}>
              {netSavings >= 0 ? '+' : ''}₹{netSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const SavingGoals = () => {
    const renderGoalCard = ({ item, index }: { item: any; index: number }) => {
      const progress = item.current / item.target;
      const progressWidth = progressAnims[index];

      return (
        <View className="w-56 p-3 mr-3 bg-white rounded-xl shadow-lg">
          <Text className="font-semibold text-gray-800 mb-1 text-sm">{item.title}</Text>
          <Text className="text-xl font-bold text-gray-900 mb-1">
            ₹{item.current.toLocaleString()}
          </Text>
          <Text className="text-gray-500 text-xs mb-2">
            of ₹{item.target.toLocaleString()}
          </Text>
          
          <View className="h-2 bg-gray-200 rounded-full mb-2">
            <Animated.View 
              className="h-2 rounded-full"
              style={{
                backgroundColor: item.color || '#3B82F6',
                width: progressWidth ? progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }) : '0%'
              }}
            />
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-gray-600">
              {Math.round(progress * 100)}%
            </Text>
            <Text className="text-xs text-gray-600">
              ₹{(item.target - item.current).toLocaleString()} left
            </Text>
          </View>
        </View>
      );
    };

    const goals = dashboardData?.savingGoals || [];

    return (
      <View className="mb-4">
        <View className="flex-row justify-between items-center px-4 mb-3">
          <Text className="text-gray-800 text-lg font-semibold">Saving Goals</Text>
        </View>
        
        {goals.length === 0 ? (
          // Show empty state
          <View className="mx-4 p-6 bg-white rounded-xl shadow-sm items-center">
            <Ionicons name="flag-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-3 text-center text-sm">
              No saving goals yet
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/Goals')}
              className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white text-sm font-medium">Create Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={goals}
            renderItem={renderGoalCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        )}
      </View>
    );
  };

  const RecentActivity = () => {
    const renderTransaction = ({ item }: { item: any }) => (
      <View className="flex-row items-center justify-between py-3 px-4 bg-white mx-4 mb-2 rounded-lg shadow-sm">
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center mr-3">
            <Ionicons name={item.icon || 'cash-outline'} size={16} color="#6B7280" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-900 text-sm" numberOfLines={1}>{item.name}</Text>
            <Text className="text-xs text-gray-500" numberOfLines={1}>{item.category} • {new Date(item.timestamp).toLocaleDateString()}</Text>
          </View>
        </View>
        <Text className={`font-semibold text-sm ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
          {item.type === 'income' ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString()}
        </Text>
      </View>
    );

    const transactions = dashboardData?.recentTransactions?.slice(0, 4) || [];

    return (
      <View className="mb-4">
        <View className="flex-row justify-between items-center px-4 mb-3">
          <Text className="text-gray-800 text-lg font-semibold">Recent Activity</Text>
        </View>
        
        {transactions.length === 0 ? (
          // Show empty state
          <View className="mx-4 p-6 bg-white rounded-xl shadow-sm items-center">
            <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-3 text-center text-sm">
              No recent transactions
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(addTransaction)')}
              className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white text-sm font-medium">Add Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
      </View>
    );
  };

  const UpcomingBillsAndSubscriptions = () => {
    const screenWidth = Dimensions.get('window').width;
    const router = useRouter();

    // Get due date color based on days until due
    const getDueDateColor = (daysUntilDue: number) => {
      if (daysUntilDue < 3) return 'text-red-500 bg-red-100'; // Red for <3 days
      if (daysUntilDue <= 7) return 'text-amber-500 bg-amber-100'; // Yellow/Amber for 3-7 days
      return 'text-green-500 bg-green-100'; // Green for >7 days
    };

    // Get logo/icon color based on days until due
    const getDueDateColorOnly = (daysUntilDue: number) => {
      if (daysUntilDue < 3) return '#EF4444'; // Red for <3 days
      if (daysUntilDue <= 7) return '#F59E0B'; // Yellow/Amber for 3-7 days
      return '#10B981'; // Green for >7 days
    };
    
    const renderSubscriptionCard = (item: any, index: number) => {
      const dueDateClass = getDueDateColor(item.daysUntilDue);
      const iconColor = getDueDateColorOnly(item.daysUntilDue);
      const cardWidth = (screenWidth - 32) / 2; // Account for reduced padding and gap
      
      return (
        <View 
          key={index}
          className="bg-white rounded-xl p-3 shadow-lg"
          style={{ width: cardWidth, minHeight: 140 }}
        >
          {/* Header with icon and service name */}
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-2">
              <Ionicons name={item.icon || 'card-outline'} size={18} color={iconColor} />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-gray-500 text-xs" numberOfLines={1}>
                {item.category}
              </Text>
            </View>
          </View>
          
          {/* Amount */}
          <View className="mb-5 flex-row items-center justify-between">
            <View className="flex-row items-baseline">
              <Text className="text-gray-900 font-bold text-lg">
                ₹{item.amount}
              </Text>
              <Text className="text-gray-500 text-xs ml-0.5">
                /{item.frequency}
              </Text>
            </View>
          </View>
          
          {/* Due date and actions */}
          <View className="flex-row justify-between items-center">
            <View className={`py-1 px-2 rounded-full ${dueDateClass} flex-1 mr-2`}>
              <Text className="text-xs font-medium text-center" numberOfLines={1}>
                Due in {item.daysUntilDue}d
              </Text>
            </View>
            <View className="flex-row">
              <TouchableOpacity className="w-6 h-6 rounded-full bg-gray-100 mr-1 items-center justify-center">
                <Ionicons name="notifications-outline" size={12} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="close-outline" size={12} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    };

    // Show all subscriptions (no limit)
    const gridData = dashboardData?.upcomingBillsAndSubscriptions || [];
    
    return (
      <View className="mb-6">
        <View className="flex-row justify-between items-center px-4 mb-3">
          <Text className="text-gray-800 text-lg font-semibold">Bills & Subscriptions</Text>
          <TouchableOpacity onPress={() => router.push('/(subscription)')}>
            <Text className="text-blue-600 text-sm font-medium">View All</Text>
          </TouchableOpacity>
        </View>
        
        {gridData.length === 0 ? (
          // Show empty state when no subscriptions
          <View className="mx-4 p-6 bg-white rounded-xl shadow-sm items-center">
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-3 text-center text-sm">
              No upcoming bills or subscriptions
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(subscription)')}
              className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white text-sm font-medium">Add Subscription</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Show grid when subscriptions exist
          <View className="px-3">
            <View className="flex-row flex-wrap justify-between">
              {gridData.map((item: any, index: number) => (
                <View key={index} className="w-[49%] mb-2">
                  {renderSubscriptionCard(item, index)}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <LinearGradient
        colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-700 mt-4 text-base">Loading dashboard...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Error state
  if (error) {
    return (
      <LinearGradient
        colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-gray-800 mt-4 text-lg font-semibold text-center">
            Failed to load dashboard
          </Text>
          <Text className="text-gray-600 mt-2 text-sm text-center">
            {error}
          </Text>
          <TouchableOpacity 
            onPress={fetchDashboardData}
            className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
        >
          <Header />
          <CashFlowSummary />
          <SavingGoals />
          <RecentActivity />
          {/* Add extra padding at the bottom for the navbar */}
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Dashboard;