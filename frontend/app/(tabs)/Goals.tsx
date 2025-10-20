import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

const { width } = Dimensions.get('window');

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  estimatedCompletion: string;
  isMainGoal: boolean;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 6500,
      monthlyContribution: 500,
      estimatedCompletion: '2025-07-15',
      isMainGoal: true,
    },
    {
      id: '2',
      name: 'Vacation Fund',
      targetAmount: 5000,
      currentAmount: 2300,
      monthlyContribution: 300,
      estimatedCompletion: '2025-12-01',
      isMainGoal: false,
    },
    {
      id: '3',
      name: 'New Car',
      targetAmount: 25000,
      currentAmount: 8500,
      monthlyContribution: 800,
      estimatedCompletion: '2026-08-15',
      isMainGoal: false,
    },
    {
      id: '4',
      name: 'Home Deposit',
      targetAmount: 50000,
      currentAmount: 15000,
      monthlyContribution: 1200,
      estimatedCompletion: '2027-03-01',
      isMainGoal: false,
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isContributeModalVisible, setIsContributeModalVisible] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<Goal | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    monthlyContribution: '',
    estimatedCompletion: '',
  });
  const [contributionData, setContributionData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0], // Default to today
  });

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

  const makeMainGoal = (goalId: string) => {
    setGoals(prevGoals =>
      prevGoals.map(goal => ({
        ...goal,
        isMainGoal: goal.id === goalId,
      }))
    );
  };

  const addNewGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.currentAmount || !newGoal.monthlyContribution) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount),
      monthlyContribution: parseFloat(newGoal.monthlyContribution),
      estimatedCompletion: newGoal.estimatedCompletion || new Date().toISOString().split('T')[0],
      isMainGoal: goals.length === 0,
    };

    setGoals(prevGoals => [...prevGoals, goal]);
    setNewGoal({
      name: '',
      targetAmount: '',
      currentAmount: '',
      monthlyContribution: '',
      estimatedCompletion: '',
    });
    setIsModalVisible(false);
  };

  const openContributeModal = (goal: Goal) => {
    setSelectedGoalForContribution(goal);
    setContributionData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsContributeModalVisible(true);
    
    // Animate modal appearance
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

  const contributeToGoal = () => {
    if (!contributionData.amount || !selectedGoalForContribution) {
      Alert.alert('Error', 'Please enter a contribution amount');
      return;
    }

    const contributionAmount = parseFloat(contributionData.amount);
    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid contribution amount');
      return;
    }

    setGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === selectedGoalForContribution.id
          ? { ...goal, currentAmount: goal.currentAmount + contributionAmount }
          : goal
      )
    );

    closeContributeModal();
    Alert.alert('Success', `Successfully contributed ${formatCurrency(contributionAmount)} to ${selectedGoalForContribution.name}!`);
  };

  const contributeToMainGoal = () => {
    if (mainGoal) {
      openContributeModal(mainGoal);
    }
  };

  const monthlyProgress = mainGoal ? (mainGoal.currentAmount % mainGoal.monthlyContribution) / mainGoal.monthlyContribution : 0;

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
            onPress={() => setIsModalVisible(true)}
            className="bg-white rounded-full p-3 shadow-md"
          >
            <Ionicons name="add" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Main Goal Card */}
        {mainGoal && (
          <View className="mx-6 mb-8 bg-white rounded-3xl p-6 shadow-lg">
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
            <View className="mb-6">
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
            </View>

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
              {otherGoals.map((goal, index) => (
                <View key={goal.id} className="bg-white rounded-2xl p-4 shadow-md relative" style={{ width: (width - 60) / 2 }}>
                  {/* Contribute Button */}
                  <TouchableOpacity
                    onPress={() => openContributeModal(goal)}
                    className="absolute top-3 right-3 w-7 h-7 bg-blue-100 rounded-full items-center justify-center z-10"
                  >
                    <Ionicons name="add" size={16} color="#2563eb" />
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
                    onPress={() => makeMainGoal(goal.id)}
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

        {/* Insights Section */}
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
                  Great Progress!
                </Text>
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-xs">
                  You're ahead of schedule on 2 of your goals
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
                  Achievement Unlocked
                </Text>
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-xs">
                  Consistent Saver - 3 months in a row!
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
                  Savings Tip
                </Text>
                <Text style={{ fontFamily: 'Poppins-Regular' }} className="text-gray-600 text-xs">
                  Consider increasing your Emergency Fund by 10%
                </Text>
              </View>
            </View>
          </View>
        </View>

         <View style={{ height: 60 }} />
      </ScrollView>

      {/* New Goal Modal */}
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
                New Saving Goal
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
                  Estimated Completion
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
                  onPress={addNewGoal}
                  className="flex-1 py-3 rounded-xl bg-blue-500 ml-2 items-center"
                >
                  <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-white">Save Goal</Text>
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
                <View className="mb-6">
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

                {/* Buttons */}
                <View className="flex-row justify-between">
                  <TouchableOpacity 
                    onPress={closeContributeModal}
                    className="flex-1 py-3 rounded-xl bg-gray-100 mr-2 items-center"
                  >
                    <Text style={{ fontFamily: 'Poppins-SemiBold' }} className="text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={contributeToGoal}
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