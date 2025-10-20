import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  StatusBar
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

// Mock data for investment recommendations
const getRecommendationsBasedOnRiskAndBalance = (riskLevel: 'Low' | 'Moderate' | 'High', balance: number) => {
  if (riskLevel === 'Low') {
    return [
      {
        id: 1,
        name: 'HDFC Balanced Advantage SIP',
        description: 'Best suited for low-risk investors',
        performance: 'Projected 8% annual growth',
        buttonText: 'Start SIP',
        confidence: 85,
        icon: 'trending-up-outline',
        color: '#10b981'
      },
      {
        id: 2,
        name: 'SBI Debt Fund Plus',
        description: 'Stable returns with minimal risk',
        performance: '+5.2% growth YTD',
        buttonText: 'Invest Now',
        confidence: 90,
        icon: 'shield-checkmark-outline',
        color: '#3b82f6'
      },
      {
        id: 3,
        name: 'Axis Liquid Fund',
        description: 'High liquidity for emergency funds',
        performance: 'Projected 4% annual return',
        buttonText: 'Start SIP',
        confidence: 78,
        icon: 'water-outline',
        color: '#06b6d4'
      }
    ]
  } else if (riskLevel === 'Moderate') {
    return [
      {
        id: 1,
        name: 'HDFC Mid Cap Opportunities',
        description: 'Best suited for moderate-risk investors',
        performance: 'Projected 12% annual growth',
        buttonText: 'Invest Now',
        confidence: 82,
        icon: 'analytics-outline',
        color: '#f59e0b'
      },
      {
        id: 2,
        name: 'JSW Infrastructure Ltd.',
        description: 'Strong fundamentals in infrastructure',
        performance: '+18% growth in last 6 months',
        buttonText: 'Buy Stock',
        confidence: 75,
        icon: 'business-outline',
        color: '#8b5cf6'
      },
      {
        id: 3,
        name: 'Kotak Emerging Equity Fund',
        description: 'Diversified equity portfolio',
        performance: 'Projected 15% annual growth',
        buttonText: 'Start SIP',
        confidence: 88,
        icon: 'globe-outline',
        color: '#10b981'
      }
    ]
  } else { // High risk
    return [
      {
        id: 1,
        name: 'Ethereum (ETH)',
        description: 'High-potential cryptocurrency investment',
        performance: 'ROI +26% YTD',
        buttonText: 'Buy ETH',
        confidence: 70,
        icon: 'logo-ethereum',
        color: '#8b5cf6'
      },
      {
        id: 2,
        name: 'Motilal Oswal Nasdaq 100 ETF',
        description: 'Global tech exposure with high returns',
        performance: 'Projected 18% annual growth',
        buttonText: 'Invest Now',
        confidence: 85,
        icon: 'rocket-outline',
        color: '#ef4444'
      },
      {
        id: 3,
        name: 'HDFC Small Cap Fund',
        description: 'High-risk, high-return equity fund',
        performance: '+22% growth in last year',
        buttonText: 'Start SIP',
        confidence: 79,
        icon: 'diamond-outline',
        color: '#f59e0b'
      }
    ]
  }
}

const getRecommendationsBasedOnBalance = (balance: number) => {
  if (balance < 10000) {
    return [
      {
        id: 1,
        name: 'HDFC Balanced Advantage SIP',
        description: 'Best suited for low-risk investors',
        performance: 'Projected 8% annual growth',
        buttonText: 'Start SIP',
        confidence: 85,
        icon: 'trending-up-outline',
        color: '#10b981'
      },
      {
        id: 2,
        name: 'SBI Debt Fund Plus',
        description: 'Stable returns with minimal risk',
        performance: '+5.2% growth YTD',
        buttonText: 'Invest Now',
        confidence: 90,
        icon: 'shield-checkmark-outline',
        color: '#3b82f6'
      },
      {
        id: 3,
        name: 'Axis Liquid Fund',
        description: 'High liquidity for emergency funds',
        performance: 'Projected 4% annual return',
        buttonText: 'Start SIP',
        confidence: 78,
        icon: 'water-outline',
        color: '#06b6d4'
      }
    ]
  } else if (balance >= 10000 && balance <= 50000) {
    return [
      {
        id: 1,
        name: 'HDFC Mid Cap Opportunities',
        description: 'Best suited for moderate-risk investors',
        performance: 'Projected 12% annual growth',
        buttonText: 'Invest Now',
        confidence: 82,
        icon: 'analytics-outline',
        color: '#f59e0b'
      },
      {
        id: 2,
        name: 'JSW Infrastructure Ltd.',
        description: 'Strong fundamentals in infrastructure',
        performance: '+18% growth in last 6 months',
        buttonText: 'Buy Stock',
        confidence: 75,
        icon: 'business-outline',
        color: '#8b5cf6'
      },
      {
        id: 3,
        name: 'Kotak Emerging Equity Fund',
        description: 'Diversified equity portfolio',
        performance: 'Projected 15% annual growth',
        buttonText: 'Start SIP',
        confidence: 88,
        icon: 'globe-outline',
        color: '#10b981'
      }
    ]
  } else {
    return [
      {
        id: 1,
        name: 'Ethereum (ETH)',
        description: 'High-potential cryptocurrency investment',
        performance: 'ROI +26% YTD',
        buttonText: 'Buy ETH',
        confidence: 70,
        icon: 'logo-ethereum',
        color: '#8b5cf6'
      },
      {
        id: 2,
        name: 'Motilal Oswal Nasdaq 100 ETF',
        description: 'Global tech exposure with high returns',
        performance: 'Projected 18% annual growth',
        buttonText: 'Invest Now',
        confidence: 85,
        icon: 'rocket-outline',
        color: '#ef4444'
      },
      {
        id: 3,
        name: 'HDFC Small Cap Fund',
        description: 'High-risk, high-return equity fund',
        performance: '+22% growth in last year',
        buttonText: 'Start SIP',
        confidence: 79,
        icon: 'diamond-outline',
        color: '#f59e0b'
      }
    ]
  }
}

const getInsightBasedOnBalance = (balance: number) => {
  if (balance < 10000) {
    return {
      message: `You have ₹${balance.toLocaleString()} saved. Start with low-risk SIPs to build wealth steadily.`,
      icon: 'information-circle-outline',
      color: '#3b82f6'
    }
  } else if (balance >= 10000 && balance <= 50000) {
    return {
      message: `You have ₹${balance.toLocaleString()} surplus this month. Consider auto-investing in diversified funds.`,
      icon: 'checkmark-circle-outline',
      color: '#10b981'
    }
  } else {
    return {
      message: `Great! ₹${balance.toLocaleString()} gives you access to premium investment options. Diversify your portfolio.`,
      icon: 'star-outline',
      color: '#f59e0b'
    }
  }
}

// Circular Progress Component
const CircularProgress = ({ percentage, size = 50 }: { percentage: number, size?: number }) => {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
  
  return (
    <View className="items-center justify-center">
      <View 
        style={{ width: size, height: size }} 
        className="items-center justify-center"
      >
        <View 
          style={{ 
            width: size - 4, 
            height: size - 4,
            borderRadius: (size - 4) / 2,
            borderWidth: 3,
            borderColor: '#e5e7eb'
          }}
          className="absolute"
        />
        <View 
          style={{ 
            width: size - 4, 
            height: size - 4,
            borderRadius: (size - 4) / 2,
            borderWidth: 3,
            borderColor: '#3b82f6',
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: `${(percentage * 3.6) - 90}deg` }]
          }}
          className="absolute"
        />
        <Text 
          style={{ fontFamily: 'Poppins-SemiBold' }} 
          className="text-xs text-gray-700"
        >
          {percentage}%
        </Text>
      </View>
    </View>
  )
}

// AI Insights Carousel Component
const AIInsightsCarousel = ({ 
  balance, 
  riskLevel 
}: { 
  balance: number, 
  riskLevel: 'Low' | 'Moderate' | 'High' 
}) => {
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const getPersonalizedInsights = (balance: number, riskLevel: string) => {
    const baseInsights = [
      {
        message: `You could reach your car goal 2 months earlier by auto-investing ₹2,000 more monthly.`,
        icon: 'car-outline',
        color: '#10b981',
        gradient: ['#10b981', '#059669']
      },
      {
        message: `Your portfolio is 70% in equities. Consider diversifying with bonds.`,
        icon: 'pie-chart-outline',
        color: '#f59e0b',
        gradient: ['#f59e0b', '#d97706']
      },
      {
        message: `You're on track for 14% projected annual growth with your current investments.`,
        icon: 'trending-up-outline',
        color: '#3b82f6',
        gradient: ['#3b82f6', '#1d4ed8']
      }
    ]

    // Add balance-specific insights
    if (balance > 50000) {
      baseInsights.push({
        message: `With ₹${balance.toLocaleString()}, you can access premium investment options with higher returns.`,
        icon: 'diamond-outline',
        color: '#8b5cf6',
        gradient: ['#8b5cf6', '#7c3aed']
      })
    }

    // Add risk-specific insights
    if (riskLevel === 'Low') {
      baseInsights.push({
        message: `As a conservative investor, consider adding 20% mid-cap funds for better growth.`,
        icon: 'shield-checkmark-outline',
        color: '#10b981',
        gradient: ['#10b981', '#059669']
      })
    } else if (riskLevel === 'High') {
      baseInsights.push({
        message: `Your aggressive approach could yield 18-22% returns, but ensure emergency funds.`,
        icon: 'rocket-outline',
        color: '#ef4444',
        gradient: ['#ef4444', '#dc2626']
      })
    }

    return baseInsights
  }

  const insights = getPersonalizedInsights(balance, riskLevel)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      
      setTimeout(() => {
        setCurrentInsightIndex((prevIndex) => 
          (prevIndex + 1) % insights.length
        )
        setIsTransitioning(false)
      }, 300) // Half of transition duration
      
    }, 5000) // Change insight every 5 seconds

    return () => clearInterval(interval)
  }, [insights.length])

  const currentInsight = insights[currentInsightIndex]

  return (
    <View className="mx-4 mb-6">
      <View className="flex-row items-center justify-between mb-4 px-2">
        <Text 
          style={{ fontFamily: 'Poppins-SemiBold' }} 
          className="text-lg text-blue-600"
        >
          AI Insights
        </Text>
        <View className="flex-row items-center bg-white/80 px-3 py-1 rounded-full">
          <Ionicons name="sparkles" size={16} color="#f59e0b" />
          <Text 
            style={{ fontFamily: 'Poppins-Medium' }} 
            className="text-xs text-gray-700 ml-1"
          >
            {currentInsightIndex + 1} of {insights.length}
          </Text>
        </View>
      </View>

      <View className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200">
        {/* Animated Content Container */}
        <View 
          className={`${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          style={{
            transform: [{ scale: isTransitioning ? 0.95 : 1 }]
          }}
        >
          <View className="flex-row items-start">
            <View className="mr-4">
              <LinearGradient
                colors={[currentInsight.gradient[0], currentInsight.gradient[1]]}
                className="w-14 h-14 rounded-2xl items-center justify-center"
              >
                <Ionicons 
                  name={currentInsight.icon as any} 
                  size={24} 
                  color="white" 
                />
              </LinearGradient>
            </View>
            
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <View 
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: currentInsight.color }}
                />
                <Text 
                  style={{ fontFamily: 'Poppins-SemiBold' }} 
                  className="text-xs text-gray-500 uppercase tracking-wider"
                >
                  SMART INSIGHT
                </Text>
              </View>
              
              <Text 
                style={{ fontFamily: 'Poppins-Medium' }} 
                className="text-gray-800 text-base leading-7"
              >
                {currentInsight.message}
              </Text>
            </View>
          </View>
        </View>

        {/* Enhanced Progress Indicators */}
        <View className="flex-row justify-center mt-6 space-x-2">
          {insights.map((insight, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setIsTransitioning(true)
                setTimeout(() => {
                  setCurrentInsightIndex(index)
                  setIsTransitioning(false)
                }, 150)
              }}
              className={`rounded-full ${
                index === currentInsightIndex 
                  ? 'h-2 w-8' 
                  : 'h-2 w-2'
              }`}
              style={{
                backgroundColor: index === currentInsightIndex 
                  ? currentInsight.color 
                  : '#e5e7eb',
                marginRight: index < insights.length - 1 ? 8 : 0
              }}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity className="mt-4 rounded-2xl overflow-hidden">
          <LinearGradient
            colors={[currentInsight.gradient[0], currentInsight.gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-3 px-4 flex-row items-center justify-center"
          >
            <Ionicons name="arrow-forward-outline" size={16} color="white" />
            <Text 
              style={{ fontFamily: 'Poppins-SemiBold' }} 
              className="text-white text-sm ml-2"
            >
              Learn More
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const InvestmentRecommendationsScreen = () => {
  const [savedBalance, setSavedBalance] = useState(25000) // Mock balance
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Moderate' | 'High'>('Moderate')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [insight, setInsight] = useState<any>({})

  const updateRecommendations = (risk: 'Low' | 'Moderate' | 'High', balance: number) => {
    const userRecommendations = getRecommendationsBasedOnRiskAndBalance(risk, balance)
    const userInsight = getInsightBasedOnBalance(balance)
    
    setRecommendations(userRecommendations)
    setInsight(userInsight)
  }

  useEffect(() => {
    updateRecommendations(riskLevel, savedBalance)
  }, [savedBalance, riskLevel])

// Risk Profile Component
const RiskProfileSection = ({ 
  riskLevel, 
  setRiskLevel 
}: { 
  riskLevel: 'Low' | 'Moderate' | 'High', 
  setRiskLevel: (level: 'Low' | 'Moderate' | 'High') => void 
}) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return '#10b981'
      case 'Moderate': return '#f59e0b'
      case 'High': return '#ef4444'
      default: return '#3b82f6'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Low': return 'shield-checkmark-outline'
      case 'Moderate': return 'analytics-outline'
      case 'High': return 'rocket-outline'
      default: return 'analytics-outline'
    }
  }

  return (
    <View className="bg-white/30 rounded-2xl p-4 mx-6 mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text 
          style={{ fontFamily: 'Poppins-SemiBold' }} 
          className="text-lg text-gray-800"
        >
          Risk Profile
        </Text>
        <View className="flex-row items-center">
          <Ionicons 
            name={getRiskIcon(riskLevel) as any} 
            size={20} 
            color={getRiskColor(riskLevel)} 
          />
          <Text 
            style={{ 
              fontFamily: 'Poppins-SemiBold',
              color: getRiskColor(riskLevel)
            }} 
            className="ml-2 text-base"
          >
            {riskLevel}
          </Text>
        </View>
      </View>

      {/* Risk Level Selector */}
      <View className="flex-row justify-between">
        {['Low', 'Moderate', 'High'].map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => setRiskLevel(level as 'Low' | 'Moderate' | 'High')}
            className={`flex-1 mx-1 py-3 rounded-2xl ${
              riskLevel === level ? 'bg-blue-500' : 'bg-white/50'
            }`}
          >
            <Text 
              style={{ fontFamily: 'Poppins-Medium' }} 
              className={`text-center text-sm ${
                riskLevel === level ? 'text-white' : 'text-gray-700'
              }`}
            >
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text 
        style={{ fontFamily: 'Poppins-Regular' }} 
        className="text-xs text-gray-600 mt-3 text-center"
      >
        {riskLevel === 'Low' && 'Conservative investments with stable returns'}
        {riskLevel === 'Moderate' && 'Balanced mix of safety and growth potential'}
        {riskLevel === 'High' && 'Aggressive investments for maximum returns'}
      </Text>
    </View>
  )
}

const RecommendationCard = ({ item }: { item: any }) => (
    <View className="bg-white rounded-3xl p-6 mb-4 mx-4 shadow-lg shadow-gray-200">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text 
            style={{ fontFamily: 'Poppins-SemiBold' }} 
            className="text-lg text-gray-800 mb-1"
          >
            {item.name}
          </Text>
          <Text 
            style={{ fontFamily: 'Poppins-Regular' }} 
            className="text-sm text-gray-600"
          >
            {item.description}
          </Text>
        </View>
        <View className="ml-4">
          <CircularProgress percentage={item.confidence} size={60} />
        </View>
      </View>

      <View className="flex-row items-center mb-4">
        <Ionicons name={item.icon as any} size={20} color={item.color} />
        <Text 
          style={{ fontFamily: 'Poppins-Medium', color: item.color }} 
          className="ml-2 text-sm"
        >
          {item.performance}
        </Text>
      </View>

      <TouchableOpacity className="rounded-2xl overflow-hidden">
        <LinearGradient
          colors={['#1E90FF', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="h-12 rounded-2xl items-center justify-center"
        >
          <Text 
            style={{ fontFamily: 'Poppins-SemiBold' }} 
            className="text-white text-base"
          >
            {item.buttonText}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

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
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header Section */}
        <View className="px-6 pt-12 pb-6">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text 
                style={{ fontFamily: 'Poppins-Bold' }} 
                className="text-2xl text-blue-600 mb-1"
              >
                Automated Investment
              </Text>
              <Text 
                style={{ fontFamily: 'Poppins-Bold' }} 
                className="text-2xl text-blue-600 mb-2"
              >
                Recommendations
              </Text>
              <Text 
                style={{ fontFamily: 'Poppins-Regular' }} 
                className="text-gray-600 text-base"
              >
                Smart suggestions tailored to your goals.
              </Text>
            </View>
          
          </View>

          {/* Balance Display */}
          <View className="bg-white/30 rounded-2xl p-4 mt-4">
            <Text 
              style={{ fontFamily: 'Poppins-Regular' }} 
              className="text-gray-700 text-sm mb-1"
            >
              Available Balance
            </Text>
            <Text 
              style={{ fontFamily: 'Poppins-Bold' }} 
              className="text-2xl text-blue-600"
            >
              ₹{savedBalance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Risk Profile Section */}
        <RiskProfileSection 
          riskLevel={riskLevel} 
          setRiskLevel={setRiskLevel} 
        />

        {/* Recommendations Section */}
        <View className="mb-6">
          <Text 
            style={{ fontFamily: 'Poppins-SemiBold' }} 
            className="text-lg text-gray-800 px-6 mb-4"
          >
            Recommended for You
          </Text>
          
          {recommendations.map((item) => (
            <RecommendationCard key={item.id} item={item} />
          ))}
        </View>

        {/* AI Insights Carousel Section */}
        <AIInsightsCarousel balance={savedBalance} riskLevel={riskLevel} />

      </ScrollView>
    </LinearGradient>
  )
}

export default InvestmentRecommendationsScreen