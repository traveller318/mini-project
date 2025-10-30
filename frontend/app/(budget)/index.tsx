import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { Toast } from 'toastify-react-native';
import { router } from 'expo-router';
import {
  getAllBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetOverview,
  checkBudgetAlerts,
  Budget as ApiBudget,
  BudgetOverview,
  BudgetAlert,
} from '../../services/budgetService';

const { width } = Dimensions.get('window');

interface Budget extends ApiBudget {}

// Budget categories with icons
const budgetCategories = [
  { name: 'Food', icon: 'fast-food-outline', color: '#f59e0b' },
  { name: 'Transport', icon: 'car-outline', color: '#3b82f6' },
  { name: 'Shopping', icon: 'cart-outline', color: '#ec4899' },
  { name: 'Entertainment', icon: 'game-controller-outline', color: '#8b5cf6' },
  { name: 'Bills', icon: 'receipt-outline', color: '#ef4444' },
  { name: 'Health', icon: 'medical-outline', color: '#10b981' },
  { name: 'Education', icon: 'school-outline', color: '#6366f1' },
  { name: 'Travel', icon: 'airplane-outline', color: '#14b8a6' },
  { name: 'Groceries', icon: 'basket-outline', color: '#84cc16' },
  { name: 'Rent', icon: 'home-outline', color: '#f97316' },
  { name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6b7280' },
];

// Period options
const periodOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<BudgetOverview['overview'] | null>(null);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBudgetForEdit, setSelectedBudgetForEdit] = useState<Budget | null>(null);
  
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  
  const [newBudget, setNewBudget] = useState({
    name: '',
    description: '',
    category: 'Food',
    limit: '',
    period: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
    startDate: '',
    endDate: '',
    color: '#3B82F6',
    icon: 'wallet-outline',
  });

  // Fetch budgets on mount
  useEffect(() => {
    fetchBudgets();
    fetchBudgetOverview();
    fetchBudgetAlerts();
  }, [selectedPeriod]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await getAllBudgets({ period: selectedPeriod });
      if (response.success && response.data?.budgets) {
        setBudgets(response.data.budgets);
      }
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      Toast.error(error.message || 'Failed to fetch budgets', 'top');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBudgetOverview = async () => {
    try {
      const response = await getBudgetOverview(selectedPeriod);
      if (response.success && response.data?.overview) {
        setOverview(response.data.overview);
      }
    } catch (error: any) {
      console.error('Error fetching budget overview:', error);
    }
  };

  const fetchBudgetAlerts = async () => {
    try {
      const response = await checkBudgetAlerts();
      if (response.success && response.data?.alerts) {
        setAlerts(response.data.alerts);
      }
    } catch (error: any) {
      console.error('Error fetching budget alerts:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBudgets();
    fetchBudgetOverview();
    fetchBudgetAlerts();
  };

  const calculateProgress = (spent: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((spent / limit) * 100, 100);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedBudgetForEdit(null);
    setNewBudget({
      name: '',
      description: '',
      category: 'Food',
      limit: '',
      period: 'monthly',
      startDate: '',
      endDate: '',
      color: '#3B82F6',
      icon: 'wallet-outline',
    });
    setIsModalVisible(true);
  };

  const openEditModal = (budget: Budget) => {
    setIsEditMode(true);
    setSelectedBudgetForEdit(budget);
    setNewBudget({
      name: budget.name,
      description: budget.description || '',
      category: budget.category,
      limit: budget.limit.toString(),
      period: budget.period,
      startDate: budget.startDate.split('T')[0],
      endDate: budget.endDate.split('T')[0],
      color: budget.color || '#3B82F6',
      icon: budget.icon || 'wallet-outline',
    });
    setIsModalVisible(true);
  };

  const handleSaveBudget = async () => {
    try {
      // Validation
      if (!newBudget.name.trim()) {
        Toast.error('Please enter a budget name', 'top');
        return;
      }
      if (!newBudget.limit || parseFloat(newBudget.limit) <= 0) {
        Toast.error('Please enter a valid budget limit', 'top');
        return;
      }

      const budgetData = {
        name: newBudget.name,
        description: newBudget.description,
        category: newBudget.category,
        limit: parseFloat(newBudget.limit),
        period: newBudget.period,
        startDate: newBudget.startDate || undefined,
        endDate: newBudget.endDate || undefined,
        color: newBudget.color,
        icon: newBudget.icon,
      };

      if (isEditMode && selectedBudgetForEdit) {
        // Update existing budget
        const response = await updateBudget(selectedBudgetForEdit._id, budgetData);
        if (response.success) {
          Toast.success('Budget updated successfully!', 'top');
          fetchBudgets();
          fetchBudgetOverview();
        }
      } else {
        // Create new budget
        const response = await createBudget(budgetData);
        if (response.success) {
          Toast.success('Budget created successfully!', 'top');
          fetchBudgets();
          fetchBudgetOverview();
        }
      }

      setIsModalVisible(false);
    } catch (error: any) {
      console.error('Save Budget Error:', error);
      Toast.error(error.message || 'Failed to save budget', 'top');
    }
  };

  const handleDeleteBudget = (budgetId: string) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteBudget(budgetId);
              if (response.success) {
                Toast.success('Budget deleted successfully!', 'top');
                fetchBudgets();
                fetchBudgetOverview();
              }
            } catch (error: any) {
              console.error('Delete Budget Error:', error);
              Toast.error(error.message || 'Failed to delete budget', 'top');
            }
          },
        },
      ]
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return '#10b981'; // green
    if (percentage < 75) return '#f59e0b'; // yellow
    if (percentage < 90) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getCategoryIcon = (category: string) => {
    const cat = budgetCategories.find(c => c.name.toLowerCase() === category.toLowerCase());
    return cat ? cat.icon : 'wallet-outline';
  };

  const getCategoryColor = (category: string) => {
    const cat = budgetCategories.find(c => c.name.toLowerCase() === category.toLowerCase());
    return cat ? cat.color : '#3B82F6';
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1 justify-center items-center"
      >
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 mt-4">
          Loading budgets...
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#e0f2fe" />
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-12 pb-6">
          <View>
            <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-3xl text-gray-800">
              Budgets
            </Text>
            <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-sm">
              Track your spending
            </Text>
          </View>
          <View className="flex-row" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white rounded-full p-3 shadow-md"
            >
              <Ionicons name="arrow-back" size={24} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openAddModal}
              className="bg-white rounded-full p-3 shadow-md"
            >
              <Ionicons name="add" size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Selector */}
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {periodOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSelectedPeriod(option.value as any)}
                  className={`px-4 py-2 rounded-full ${
                    selectedPeriod === option.value ? 'bg-blue-500' : 'bg-white'
                  }`}
                >
                  <Text
                    style={{ fontFamily: 'Poppins-Medium' }}
                    className={`text-sm ${
                      selectedPeriod === option.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Budget Overview Card */}
        {overview && (
          <View className="mx-6 mb-6 bg-white rounded-3xl p-6 shadow-lg">
            <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-xl text-gray-800 mb-4">
              Overview
            </Text>
            
            <View className="items-center mb-6">
              <Progress.Circle
                size={140}
                progress={overview.overallPercentage / 100}
                thickness={12}
                color={getProgressColor(overview.overallPercentage)}
                unfilledColor="#e5f4ff"
                borderWidth={0}
                showsText={true}
                formatText={() => `${overview.overallPercentage}%`}
                textStyle={{ 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  color: getProgressColor(overview.overallPercentage) 
                }}
              />
              <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-600 text-sm mt-4">
                Overall Budget Usage
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <View className="flex-1">
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-xs mb-1">
                  Total Limit
                </Text>
                <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-gray-800 text-lg">
                  {formatCurrency(overview.totalLimit)}
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-xs mb-1">
                  Total Spent
                </Text>
                <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-red-600 text-lg">
                  {formatCurrency(overview.totalSpent)}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-xs mb-1">
                  Remaining
                </Text>
                <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-green-600 text-lg">
                  {formatCurrency(overview.totalRemaining)}
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-xs mb-1">
                  At Risk
                </Text>
                <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-orange-600 text-lg">
                  {overview.categoriesAtRisk}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Budget Alerts */}
        {alerts.length > 0 && (
          <View className="mx-6 mb-6">
            <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-lg text-gray-800 mb-3">
              ⚠️ Budget Alerts
            </Text>
            {alerts.map((alert, index) => (
              <View key={index} className="bg-red-50 border border-red-200 rounded-xl p-4 mb-2">
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-red-800 text-sm">
                      {alert.budgetName}
                    </Text>
                    <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-red-600 text-xs">
                      {alert.currentPercentage}% spent ({formatCurrency(alert.spent)} / {formatCurrency(alert.limit)})
                    </Text>
                  </View>
                  <View className="bg-red-100 rounded-full px-3 py-1">
                    <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-red-700 text-xs">
                      {alert.threshold}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Budget Cards */}
        {budgets.length > 0 ? (
          <View className="px-6 mb-8">
            <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-xl text-gray-800 mb-4">
              Your Budgets
            </Text>
            
            {budgets.map((budget) => {
              const percentage = calculateProgress(budget.spent, budget.limit);
              const progressColor = getProgressColor(percentage);
              const categoryIcon = getCategoryIcon(budget.category);
              const categoryColor = getCategoryColor(budget.category);

              return (
                <View key={budget._id} className="bg-white rounded-2xl p-5 mb-4 shadow-md">
                  {/* Edit and Delete Icons - Top Right */}
                  <View className="absolute top-1 right-3 flex-row z-10" style={{ gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => openEditModal(budget)}
                      className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center"
                    >
                      <Ionicons name="pencil" size={14} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteBudget(budget._id)}
                      className="w-6 h-6 bg-red-100 rounded-full items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={14} color="#dc2626" />
                    </TouchableOpacity>
                  </View>

                  {/* Header */}
                  <View className="flex-row items-center mb-4">
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      <Ionicons name={categoryIcon as any} size={24} color={categoryColor} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-gray-800 text-base">
                        {budget.name}
                      </Text>
                      <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-xs">
                        {budget.category} • {budget.period}
                      </Text>
                    </View>
                    <View 
                      className="px-3 py-1 rounded-full"
                      style={{ 
                        backgroundColor: budget.status === 'active' ? '#10b98120' : 
                                       budget.status === 'exceeded' ? '#ef444420' : '#6b728020' 
                      }}
                    >
                      <Text 
                        style={{ fontFamily: 'Poppins-Medium' }}
                        className={`text-xs ${
                          budget.status === 'active' ? 'text-green-600' : 
                          budget.status === 'exceeded' ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        {budget.status}
                      </Text>
                    </View>
                  </View>

                  {/* Progress */}
                  <View className="mb-3">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm">
                        {formatCurrency(budget.spent)} of {formatCurrency(budget.limit)}
                      </Text>
                      <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: progressColor }}>
                        {Math.round(percentage)}%
                      </Text>
                    </View>
                    <Progress.Bar
                      progress={percentage / 100}
                      width={null}
                      height={8}
                      color={progressColor}
                      unfilledColor="#e5f4ff"
                      borderWidth={0}
                      borderRadius={4}
                    />
                  </View>

                  {/* Footer */}
                  <View className="flex-row justify-between items-center">
                    <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-xs">
                      Remaining: {formatCurrency(budget.limit - budget.spent)}
                    </Text>
                    <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-xs">
                      {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          // Empty State
          <View className="px-6 items-center justify-center" style={{ marginTop: 100 }}>
            <Ionicons name="wallet-outline" size={80} color="#94a3b8" />
            <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-gray-600 text-xl mt-4 mb-2">
              No Budgets Yet
            </Text>
            <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-sm text-center mb-6">
              Create your first budget to start tracking your spending
            </Text>
            <TouchableOpacity
              onPress={openAddModal}
              className="bg-blue-500 rounded-xl py-3 px-8"
            >
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-white">
                Create Budget
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* New/Edit Budget Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-3xl mx-6 p-6 w-11/12 max-w-md max-h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-xl text-gray-800">
                {isEditMode ? 'Edit Budget' : 'New Budget'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Budget Name */}
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Budget Name *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="e.g., Monthly Food Budget"
                  value={newBudget.name}
                  onChangeText={(text) => setNewBudget({ ...newBudget, name: text })}
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
              </View>
              
              {/* Description */}
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Description
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="What's this budget for?"
                  value={newBudget.description}
                  onChangeText={(text) => setNewBudget({ ...newBudget, description: text })}
                  style={{ fontFamily: 'Poppins-Regular' }}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Category */}
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Category *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row" style={{ gap: 8 }}>
                    {budgetCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat.name}
                        onPress={() => setNewBudget({ ...newBudget, category: cat.name })}
                        className={`px-4 py-2 rounded-full flex-row items-center ${
                          newBudget.category === cat.name ? 'bg-blue-500' : 'bg-gray-100'
                        }`}
                        style={{ gap: 6 }}
                      >
                        <Ionicons 
                          name={cat.icon as any} 
                          size={16} 
                          color={newBudget.category === cat.name ? '#fff' : cat.color} 
                        />
                        <Text
                          style={{ fontFamily: 'Poppins-Medium' }}
                          className={`text-sm ${
                            newBudget.category === cat.name ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* Budget Limit */}
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Budget Limit (₹) *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="10000"
                  value={newBudget.limit}
                  onChangeText={(text) => setNewBudget({ ...newBudget, limit: text })}
                  keyboardType="numeric"
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
              </View>

              {/* Period */}
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Period *
                </Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {periodOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setNewBudget({ ...newBudget, period: option.value as any })}
                      className={`px-4 py-2 rounded-full ${
                        newBudget.period === option.value ? 'bg-blue-500' : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        style={{ fontFamily: 'Poppins-Medium' }}
                        className={`text-sm ${
                          newBudget.period === option.value ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Start Date */}
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Start Date (Optional)
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="YYYY-MM-DD"
                  value={newBudget.startDate}
                  onChangeText={(text) => setNewBudget({ ...newBudget, startDate: text })}
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
              </View>
              
              {/* End Date */}
              <View className="mb-6">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  End Date (Optional)
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="YYYY-MM-DD"
                  value={newBudget.endDate}
                  onChangeText={(text) => setNewBudget({ ...newBudget, endDate: text })}
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
              </View>
              
              {/* Buttons */}
              <View className="flex-row justify-between">
                <TouchableOpacity 
                  onPress={() => setIsModalVisible(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 mr-2 items-center"
                >
                  <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSaveBudget}
                  className="flex-1 py-3 rounded-xl bg-blue-500 ml-2 items-center"
                >
                  <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-white">
                    {isEditMode ? 'Update Budget' : 'Create Budget'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
    </LinearGradient>
  );
}
