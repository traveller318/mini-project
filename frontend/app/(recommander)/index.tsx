import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  getInvestmentRecommendations,
  getPersonalizedInsights,
  updateRiskProfile,
  Investment,
  Insight,
} from '../../services/investmentService';

const { width } = Dimensions.get('window');

const AIRecommendation = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<Investment[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [riskProfile, setRiskProfile] = useState<'Low' | 'Moderate' | 'High'>('Moderate');
  const [balance, setBalance] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Fetch data
  const fetchRecommendations = async () => {
    try {
      const response = await getInvestmentRecommendations();
      if (response.success && response.data) {
        setRecommendations(response.data.recommendations);
        setInsights(response.data.insights);
        setRiskProfile(response.data.riskProfile as 'Low' | 'Moderate' | 'High');
        setBalance(response.data.balance);
      }
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    
    // Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  const handleUpdateRiskProfile = async (newProfile: 'Low' | 'Moderate' | 'High') => {
    try {
      setUpdatingProfile(true);
      const response = await updateRiskProfile(newProfile);
      if (response.success && response.data) {
        setRiskProfile(response.data.riskProfile as 'Low' | 'Moderate' | 'High');
        setRecommendations(response.data.recommendations);
        setModalVisible(false);
        // Refresh to get new insights
        fetchRecommendations();
      }
    } catch (error: any) {
      console.error('Error updating risk profile:', error);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const getRiskColor = (profile: string) => {
    switch (profile) {
      case 'Low':
        return '#10b981';
      case 'High':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getInvestmentIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'trending-up-outline': 'trending-up-outline',
      'shield-checkmark-outline': 'shield-checkmark-outline',
      'water-outline': 'water-outline',
      'analytics-outline': 'analytics-outline',
      'business-outline': 'business-outline',
      'globe-outline': 'globe-outline',
      'logo-ethereum': 'logo-bitcoin',
      'rocket-outline': 'rocket-outline',
      'diamond-outline': 'diamond-outline',
      'trophy': 'trophy-outline',
      'pie-chart-outline': 'pie-chart-outline',
      'checkmark-circle-outline': 'checkmark-circle-outline',
      'information-circle-outline': 'information-circle-outline',
    };
    return iconMap[iconName] || 'cash-outline';
  };

  if (loading) {
    return (
      <LinearGradient colors={['#e0f2fe', '#bae6fd', '#7dd3fc']} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="text-sky-700 mt-4 font-semibold">Loading AI Recommendations...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient colors={['#e0f2fe', '#bae6fd', '#7dd3fc']} className="flex-1">
        {/* Header */}
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="px-6 pt-4 pb-6"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <TouchableOpacity onPress={() => router.back()} className="mb-2">
                <Ionicons name="arrow-back" size={28} color="#0c4a6e" />
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-sky-900">AI Investment</Text>
              <Text className="text-xl font-bold text-sky-900">Recommendations</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-sky-700 font-medium">Available Balance</Text>
              <Text className="text-2xl font-bold text-sky-900">₹{balance.toLocaleString()}</Text>
            </View>
          </View>

          {/* Risk Profile Selector */}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="mt-4 bg-white/80 rounded-2xl p-4 flex-row justify-between items-center"
            
          >
            <View className="flex-row items-center">
              <View
                style={{ backgroundColor: getRiskColor(riskProfile) }}
                className="w-12 h-12 rounded-full justify-center items-center mr-3"
              >
                <Ionicons name="shield-checkmark" size={24} color="white" />
              </View>
              <View>
                <Text className="text-sm text-gray-600">Risk Profile</Text>
                <Text className="text-lg font-bold text-gray-900">{riskProfile} Risk</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284c7" />
          }
        >
          {/* Insights Section */}
          {insights.length > 0 && (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Text className="text-xl font-bold text-sky-900 px-6 mb-4">
                💡 Personalized Insights
              </Text>
              {insights.map((insight, index) => (
                <View key={index} className="mx-4 mb-4">
                  <LinearGradient
                    colors={(insight.gradient.length > 0 ? insight.gradient : ['#3b82f6', '#1d4ed8']) as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 20,
                      padding: 16,
                      shadowColor: insight.color,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.25,
                      shadowRadius: 10,
                      elevation: 8,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View
                        style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                        className="rounded-2xl p-3 mr-3"
                      >
                        <Ionicons name={getInvestmentIcon(insight.icon) as any} size={28} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-sm font-medium leading-6">
                          {insight.message}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Recommendations Section */}
          <Animated.View style={{ opacity: fadeAnim }} className="mt-4">
            <Text className="text-xl font-bold text-sky-900 px-6 mb-4">
              🎯 Recommended For You
            </Text>

            {recommendations.length === 0 ? (
              <View className="mx-4 bg-white/80 rounded-2xl p-8 items-center">
                <Ionicons name="information-circle-outline" size={64} color="#64748b" />
                <Text className="text-gray-700 text-center mt-4 font-medium">
                  No recommendations available at the moment.
                </Text>
                <Text className="text-gray-500 text-center mt-2 text-sm">
                  Try adjusting your risk profile or increase your balance.
                </Text>
              </View>
            ) : (
              recommendations.map((investment, index) => (
                <View key={investment.id} className="mx-4 mb-4">
                  <View
                    className="bg-white rounded-3xl overflow-hidden"
                    style={{
                      shadowColor: investment.color,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.2,
                      shadowRadius: 10,
                      elevation: 8,
                    }}
                  >
                    {/* Header with gradient */}
                    <LinearGradient
                      colors={[investment.color, investment.color + 'dd']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="p-4"
                    >
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center flex-1">
                          <View
                            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                            className="rounded-2xl p-3 mr-3"
                          >
                            <Ionicons name={getInvestmentIcon(investment.icon) as any} size={32} color="white" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-white text-lg font-bold" numberOfLines={2}>
                              {investment.name}
                            </Text>
                            <View className="flex-row items-center mt-1">
                              <View
                                style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                                className="px-2 py-1 rounded-full"
                              >
                                <Text className="text-white text-xs font-bold uppercase">
                                  {investment.type.replace('_', ' ')}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        
                        {/* Confidence Badge */}
                        <View
                          style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                          className="rounded-xl px-3 py-2"
                        >
                          <Text className="text-white text-xs font-medium">Confidence</Text>
                          <Text className="text-white text-lg font-bold">{investment.confidence}%</Text>
                        </View>
                      </View>
                    </LinearGradient>

                    {/* Content */}
                    <View className="p-4">
                      <Text className="text-gray-700 text-sm mb-3 leading-5">
                        {investment.description}
                      </Text>

                      {/* Performance */}
                      <View className="bg-sky-50 rounded-xl p-3 mb-3 flex-row items-center">
                        <Ionicons name="trending-up" size={20} color="#0284c7" />
                        <Text className="text-sky-900 font-bold ml-2 flex-1">
                          {investment.performance}
                        </Text>
                      </View>

                      {/* Min Investment */}
                      <View className="flex-row items-center mb-4">
                        <Ionicons name="cash-outline" size={18} color="#64748b" />
                        <Text className="text-gray-600 text-sm ml-2">
                          Min. Investment: <Text className="font-bold">₹{investment.minInvestment.toLocaleString()}</Text>
                        </Text>
                      </View>

                      {/* Action Button */}
                      {/* <TouchableOpacity
                        style={{ backgroundColor: investment.color }}
                        className="rounded-2xl py-4 items-center"
                        activeOpacity={0.8}
                      >
                        <Text className="text-white font-bold text-base">{investment.buttonText}</Text>
                      </TouchableOpacity> */}
                    </View>
                  </View>
                </View>
              ))
            )}
          </Animated.View>

          <View className="h-8" />
        </ScrollView>

        {/* Risk Profile Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-900">Select Risk Profile</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={32} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Risk Options */}
              {(['Low', 'Moderate', 'High'] as const).map((profile) => (
                <TouchableOpacity
                  key={profile}
                  onPress={() => handleUpdateRiskProfile(profile)}
                  disabled={updatingProfile}
                  className={`mb-4 rounded-2xl p-4 flex-row items-center ${
                    riskProfile === profile ? 'bg-sky-100' : 'bg-gray-50'
                  }`}
                  style={{
                    borderWidth: riskProfile === profile ? 2 : 0,
                    borderColor: getRiskColor(profile),
                  }}
                >
                  <View
                    style={{ backgroundColor: getRiskColor(profile) }}
                    className="w-12 h-12 rounded-full justify-center items-center mr-4"
                  >
                    <Ionicons
                      name={
                        profile === 'Low'
                          ? 'shield-checkmark'
                          : profile === 'High'
                          ? 'rocket'
                          : 'analytics'
                      }
                      size={24}
                      color="white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">{profile} Risk</Text>
                    <Text className="text-sm text-gray-600">
                      {profile === 'Low'
                        ? 'Safe investments with stable returns'
                        : profile === 'High'
                        ? 'High-potential, high-volatility options'
                        : 'Balanced mix of risk and return'}
                    </Text>
                  </View>
                  {riskProfile === profile && (
                    <Ionicons name="checkmark-circle" size={28} color={getRiskColor(profile)} />
                  )}
                </TouchableOpacity>
              ))}

              {updatingProfile && (
                <View className="mt-4 items-center">
                  <ActivityIndicator size="small" color="#0284c7" />
                  <Text className="text-gray-600 mt-2">Updating...</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default AIRecommendation;