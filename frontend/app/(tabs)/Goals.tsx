import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { Toast } from 'toastify-react-native';
import {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
  setMainGoal as setMainGoalAPI,
  Goal as ApiGoal,
} from '../../services/goalService';

const { width } = Dimensions.get('window');

interface Goal {
  _id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  estimatedCompletion: string;
  isMainGoal: boolean;
  category?: string;
  color?: string;
  icon?: string;
  status?: string;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGoalForEdit, setSelectedGoalForEdit] = useState<Goal | null>(null);
  
  const [isContributeModalVisible, setIsContributeModalVisible] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<Goal | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    monthlyContribution: '',
    estimatedCompletion: '',
    category: 'other',
    color: '#3B82F6',
  });
  
  const [contributionData, setContributionData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  // Fetch goals on mount
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await getAllGoals();
      if (response.success && response.data?.goals) {
        setGoals(response.data.goals);
      }
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      Toast.error(error.message || 'Failed to fetch goals', 'top');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const mainGoal = goals.find(goal => goal.isMainGoal) || goals[0];
  const otherGoals = goals.filter(goal => !goal.isMainGoal);

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const makeMainGoal = async (goalId: string) => {
    try {
      const response = await setMainGoalAPI(goalId);
      if (response.success) {
        await fetchGoals();
        Toast.success('Main goal updated successfully', 'top');
      }
    } catch (error: any) {
      console.error('Error setting main goal:', error);
      Toast.error(error.message || 'Failed to set main goal', 'top');
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedGoalForEdit(null);
    setNewGoal({
      name: '',
      description: '',
      targetAmount: '',
      currentAmount: '',
      monthlyContribution: '',
      estimatedCompletion: '',
      category: 'other',
      color: '#3B82F6',
    });
    setIsModalVisible(true);
  };

  const openEditModal = (goal: Goal) => {
    setIsEditMode(true);
    setSelectedGoalForEdit(goal);
    setNewGoal({
      name: goal.name,
      description: goal.description || '',
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      monthlyContribution: goal.monthlyContribution.toString(),
      estimatedCompletion: goal.estimatedCompletion.split('T')[0],
      category: goal.category || 'other',
      color: goal.color || '#3B82F6',
    });
    setIsModalVisible(true);
  };

  const handleSaveGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.monthlyContribution || !newGoal.estimatedCompletion) {
      Toast.error('Please fill in all required fields', 'top');
      return;
    }

    try {
      const goalData = {
        name: newGoal.name,
        description: newGoal.description,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: parseFloat(newGoal.currentAmount || '0'),
        monthlyContribution: parseFloat(newGoal.monthlyContribution),
        estimatedCompletion: newGoal.estimatedCompletion,
        category: newGoal.category,
        color: newGoal.color,
      };

      if (isEditMode && selectedGoalForEdit) {
        // Update existing goal
        const response = await updateGoal(selectedGoalForEdit._id, goalData);
        if (response.success) {
          Toast.success('Goal updated successfully', 'top');
          await fetchGoals();
        }
      } else {
        // Create new goal
        const response = await createGoal(goalData);
        if (response.success) {
          Toast.success('Goal created successfully', 'top');
          await fetchGoals();
          
          // If this is the first goal, set it as main goal automatically
          if (goals.length === 0 && response.data?.goal?._id) {
            await setMainGoalAPI(response.data.goal._id);
            await fetchGoals();
          }
        }
      }

      setIsModalVisible(false);
    } catch (error: any) {
      console.error('Error saving goal:', error);
      Toast.error(error.message || 'Failed to save goal', 'top');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteGoal(goalId);
              if (response.success) {
                Toast.success('Goal deleted successfully', 'top');
                await fetchGoals();
              }
            } catch (error: any) {
              console.error('Error deleting goal:', error);
              Toast.error(error.message || 'Failed to delete goal', 'top');
            }
          },
        },
      ]
    );
  };

  const openContributeModal = (goal: Goal) => {
    setSelectedGoalForContribution(goal);
    setContributionData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setIsContributeModalVisible(true);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeContributeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsContributeModalVisible(false);
      setSelectedGoalForContribution(null);
    });
  };

  const handleContribute = async () => {
    if (!contributionData.amount || !selectedGoalForContribution) {
      Toast.error('Please enter a contribution amount', 'top');
      return;
    }

    const contributionAmount = parseFloat(contributionData.amount);
    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      Toast.error('Please enter a valid contribution amount', 'top');
      return;
    }

    try {
      const response = await contributeToGoal(selectedGoalForContribution._id, {
        amount: contributionAmount,
        date: contributionData.date,
        note: contributionData.note,
        source: 'manual',
      });

      if (response.success) {
        Toast.success(`Successfully contributed ${formatCurrency(contributionAmount)} to ${selectedGoalForContribution.name}!`, 'top');
        await fetchGoals();
        closeContributeModal();
      }
    } catch (error: any) {
      console.error('Error contributing:', error);
      Toast.error(error.message || 'Failed to add contribution', 'top');
    }
  };

  const contributeToMainGoal = () => {
    if (mainGoal) {
      openContributeModal(mainGoal);
    }
  };

  const monthlyProgress = mainGoal ? (mainGoal.currentAmount % mainGoal.monthlyContribution) / mainGoal.monthlyContribution : 0;

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
          Loading goals...
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
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-12 pb-6">
          <Text style={{ fontFamily: 'Poppins-Bold' }} className="text-3xl text-gray-800">
            Saving Goals
          </Text>
          <TouchableOpacity
            onPress={openAddModal}
            className="bg-white rounded-full p-3 shadow-md"
          >
            <Ionicons name="add" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Main Goal Card */}
        {mainGoal && (
          <View className="mx-6 mb-8 bg-white rounded-3xl p-6 shadow-lg">
            {/* Edit and Delete Icons */}
            <View className="absolute top-4 right-4 flex-row z-10" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => openEditModal(mainGoal)}
                className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center"
              >
                <Ionicons name="pencil" size={14} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteGoal(mainGoal._id)}
                className="w-8 h-8 bg-red-100 rounded-full items-center justify-center"
              >
                <Ionicons name="trash-outline" size={14} color="#dc2626" />
              </TouchableOpacity>
            </View>

            <View className="items-center mb-6">
              <View className="relative items-center justify-center mb-4">
                <Progress.Circle
                  size={120}
                  progress={calculateProgress(mainGoal.currentAmount, mainGoal.targetAmount) / 100}
                  thickness={8}
                  color="#2563eb"
                  unfilledColor="#e5f4ff"
                  borderWidth={0}
                  showsText={true}
                  formatText={() => `${Math.round(calculateProgress(mainGoal.currentAmount, mainGoal.targetAmount))}%`}
                  textStyle={{ fontSize: 18, fontWeight: 'bold', color: '#2563eb' }}
                />
              </View>
              
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-xl text-gray-800 mb-2">
                {mainGoal.name}
              </Text>
              
              {mainGoal.description && (
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-xs mb-2 text-center">
                  {mainGoal.description}
                </Text>
              )}
              
              <View className="items-center">
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-sm">
                  {formatCurrency(mainGoal.currentAmount)} of {formatCurrency(mainGoal.targetAmount)}
                </Text>
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-xs mt-1">
                  Monthly: {formatCurrency(mainGoal.monthlyContribution)}
                </Text>
              </View>
            </View>

            {/* Monthly Progress */}
            {/* <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm">
                  This Month's Progress
                </Text>
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-blue-600 text-sm">
                  {Math.round(monthlyProgress * 100)}%
                </Text>
              </View>
              <Progress.Bar
                progress={monthlyProgress}
                width={null}
                height={8}
                color="#60a5fa"
                unfilledColor="#e5f4ff"
                borderWidth={0}
                borderRadius={4}
              />
            </View> */}

            {/* Contribute Button */}
            <TouchableOpacity onPress={contributeToMainGoal}>
              <LinearGradient
                colors={['#dbeafe', '#bfdbfe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-xl py-3 px-6"
              >
                <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-blue-700 text-center text-base">
                  Contribute Now
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Other Goals */}
        {otherGoals.length > 0 && (
          <View className="px-6 mb-8">
            <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-xl text-gray-800 mb-4">
              Other Goals
            </Text>
            
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              {otherGoals.map((goal) => (
                <View key={goal._id} className="bg-white rounded-2xl p-4 shadow-md relative" style={{ width: (width - 60) / 2 }}>
                  {/* Edit and Delete Icons - Top Left */}
                  <View className="absolute top-2 left-1 flex-row z-10" style={{ gap: 4 }}>
                    <TouchableOpacity
                      onPress={() => openEditModal(goal)}
                      className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center"
                    >
                      <Ionicons name="pencil" size={12} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteGoal(goal._id)}
                      className="w-6 h-6 bg-red-100 rounded-full items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={12} color="#dc2626" />
                    </TouchableOpacity>
                  </View>

                  {/* Contribute Button - Top Right */}
                  <TouchableOpacity
                    onPress={() => openContributeModal(goal)}
                    className="absolute top-2 right-3 w-6 h-6 bg-green-100 rounded-full items-center justify-center z-10"
                  >
                    <Ionicons name="add" size={16} color="#059669" />
                  </TouchableOpacity>

                  <View className="items-center mb-3 mt-2">
                    <Progress.Circle
                      size={60}
                      progress={calculateProgress(goal.currentAmount, goal.targetAmount) / 100}
                      thickness={6}
                      color="#3b82f6"
                      unfilledColor="#e5f4ff"
                      borderWidth={0}
                      showsText={true}
                      formatText={() => `${Math.round(calculateProgress(goal.currentAmount, goal.targetAmount))}%`}
                      textStyle={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6' }}
                    />
                  </View>
                  
                  <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-800 text-sm text-center mb-2">
                    {goal.name}
                  </Text>
                  
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-xs text-center mb-3">
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => makeMainGoal(goal._id)}
                    className="bg-blue-50 rounded-lg py-2 px-3"
                  >
                    <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-blue-600 text-xs text-center">
                      Make Main Goal
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <View className="px-6 items-center justify-center" style={{ marginTop: 100 }}>
            <Ionicons name="wallet-outline" size={80} color="#94a3b8" />
            <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-gray-600 text-xl mt-4 mb-2">
              No Goals Yet
            </Text>
            <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-sm text-center mb-6">
              Create your first saving goal to start tracking your progress
            </Text>
            <TouchableOpacity
              onPress={openAddModal}
              className="bg-blue-500 rounded-xl py-3 px-8"
            >
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-white">
                Create Goal
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Insights Section */}
        {goals.length > 0 && (
          <View className="px-6 pb-8">
            <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-xl text-gray-800 mb-4">
              Insights
            </Text>
            
            <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-center">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <Ionicons name="trending-up" size={20} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-800 text-sm">
                    Total Goals: {goals.length}
                  </Text>
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-xs">
                    Active goals: {goals.filter(g => g.status === 'active').length}
                  </Text>
                </View>
              </View>
            </View>
            
            <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-center">
                <View className="bg-blue-100 rounded-full p-2 mr-3">
                  <Ionicons name="trophy" size={20} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-800 text-sm">
                    Total Saved
                  </Text>
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-xs">
                    {formatCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
                  </Text>
                </View>
              </View>
            </View>
            
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center">
                <View className="bg-yellow-100 rounded-full p-2 mr-3">
                  <Ionicons name="bulb" size={20} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-800 text-sm">
                    Monthly Commitment
                  </Text>
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-xs">
                    {formatCurrency(goals.reduce((sum, g) => sum + g.monthlyContribution, 0))}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* New/Edit Goal Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-3xl mx-6 p-6 w-11/12 max-w-md max-h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-xl text-gray-800">
                {isEditMode ? 'Edit Goal' : 'New Saving Goal'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Goal Name *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="e.g., Emergency Fund"
                  value={newGoal.name}
                  onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
              </View>
              
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Description
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="What's this goal for?"
                  value={newGoal.description}
                  onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
                  style={{ fontFamily: 'Poppins-Regular' }}
                  multiline
                  numberOfLines={2}
                />
              </View>
              
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Target Amount *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="10000"
                  value={newGoal.targetAmount}
                  onChangeText={(text) => setNewGoal({ ...newGoal, targetAmount: text })}
                  keyboardType="numeric"
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
              </View>
              
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Current Amount *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="0"
                  value={newGoal.currentAmount}
                  onChangeText={(text) => setNewGoal({ ...newGoal, currentAmount: text })}
                  keyboardType="numeric"
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
              </View>
              
              <View className="mb-4">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Monthly Contribution *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="500"
                  value={newGoal.monthlyContribution}
                  onChangeText={(text) => setNewGoal({ ...newGoal, monthlyContribution: text })}
                  keyboardType="numeric"
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
              </View>
              
              <View className="mb-6">
                <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                  Estimated Completion *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  placeholder="2025-12-31"
                  value={newGoal.estimatedCompletion}
                  onChangeText={(text) => setNewGoal({ ...newGoal, estimatedCompletion: text })}
                  style={{ fontFamily: 'Poppins-Regular' }}
                />
              </View>
              
              <View className="flex-row justify-between">
                <TouchableOpacity 
                  onPress={() => setIsModalVisible(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 mr-2 items-center"
                >
                  <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSaveGoal}
                  className="flex-1 py-3 rounded-xl bg-blue-500 ml-2 items-center"
                >
                  <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-white">
                    {isEditMode ? 'Update Goal' : 'Save Goal'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        visible={isContributeModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeContributeModal}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <Animated.View 
            style={{ opacity: fadeAnim }}
            className="bg-white rounded-3xl mx-6 p-6 w-11/12 max-w-md"
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-xl text-gray-800">
                Contribute to Goal
              </Text>
              <TouchableOpacity onPress={closeContributeModal}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedGoalForContribution && (
              <View className="mb-6">
                <View className="items-center mb-4">
                  <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-2">
                    <Ionicons name="wallet" size={24} color="#2563eb" />
                  </View>
                  <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-800 text-lg">
                    {selectedGoalForContribution.name}
                  </Text>
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-sm">
                    Current: {formatCurrency(selectedGoalForContribution.currentAmount)} / {formatCurrency(selectedGoalForContribution.targetAmount)}
                  </Text>
                </View>

                {/* Contribution Amount */}
                <View className="mb-4">
                  <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                    Contribution Amount *
                  </Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="Enter amount"
                    value={contributionData.amount}
                    onChangeText={(text) => setContributionData({ ...contributionData, amount: text })}
                    keyboardType="numeric"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  />
                </View>

                {/* Date of Contribution */}
                <View className="mb-4">
                  <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                    Date of Contribution
                  </Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="YYYY-MM-DD"
                    value={contributionData.date}
                    onChangeText={(text) => setContributionData({ ...contributionData, date: text })}
                    style={{ fontFamily: 'Poppins-Regular' }}
                  />
                  <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-500 text-xs mt-1">
                    Default is today's date
                  </Text>
                </View>

                {/* Note */}
                <View className="mb-6">
                  <Text style={{ fontFamily: 'Poppins-Medium' }} className="text-gray-700 text-sm mb-2">
                    Note (Optional)
                  </Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="Add a note..."
                    value={contributionData.note}
                    onChangeText={(text) => setContributionData({ ...contributionData, note: text })}
                    style={{ fontFamily: 'Poppins-Regular' }}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Buttons */}
                <View className="flex-row justify-between">
                  <TouchableOpacity 
                    onPress={closeContributeModal}
                    className="flex-1 py-3 rounded-xl bg-gray-100 mr-2 items-center"
                  >
                    <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleContribute}
                    className="flex-1 py-3 rounded-xl bg-blue-500 ml-2 items-center"
                  >
                    <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-white">Contribute</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
      
    </LinearGradient>
  );
}