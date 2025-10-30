import React, { useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, Dimensions, Animated, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { StackedAreaChart, Grid, YAxis, XAxis } from 'react-native-svg-charts';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import * as shape from 'd3-shape';
import { useFocusEffect } from 'expo-router';
import insightsService from '../../services/insightsService';

const screenWidth = Dimensions.get('window').width;

interface InsightCardProps {
  title: string;
  description: string;
  icon: string;
  trend: 'positive' | 'negative' | 'warning' | 'neutral';
  index: number;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, description, icon, trend, index }) => {
  const getTrendColors = () => {
    switch (trend) {
      case 'positive':
        return {
          gradient: ['#10B981', '#059669', '#047857'] as const,
          bg: '#ECFDF5',
          iconBg: '#D1FAE5',
          accentColor: '#10B981',
          shadow: '#10B981'
        };
      case 'negative':
        return {
          gradient: ['#EF4444', '#DC2626', '#B91C1C'] as const,
          bg: '#FEF2F2',
          iconBg: '#FEE2E2',
          accentColor: '#EF4444',
          shadow: '#EF4444'
        };
      case 'warning':
        return {
          gradient: ['#F59E0B', '#D97706', '#B45309'] as const,
          bg: '#FFFBEB',
          iconBg: '#FEF3C7',
          accentColor: '#F59E0B',
          shadow: '#F59E0B'
        };
      default:
        return {
          gradient: ['#3B82F6', '#2563EB', '#1D4ED8'] as const,
          bg: '#EFF6FF',
          iconBg: '#DBEAFE',
          accentColor: '#3B82F6',
          shadow: '#3B82F6'
        };
    }
  };

  const colors = getTrendColors();

  return (
    <View className="mx-4 mb-4">
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 20,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View className="flex-row items-start mb-3">
          <View style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} className="rounded-3xl p-4 mr-4">
            <Text className="text-4xl">{icon}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} className="px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  {trend === 'positive' ? '↗ Good' : trend === 'negative' ? '↘ Alert' : trend === 'warning' ? '⚠ Warning' : 'ℹ Info'}
                </Text>
              </View>
            </View>
            <Text className="text-xl font-extrabold text-white mb-1">{title}</Text>
          </View>
        </View>
        
        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="rounded-2xl p-4">
          <Text className="text-white text-sm leading-6 font-medium">
            {description}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function Insights() {
  const scrollY = useRef(new Animated.Value(0)).current;

  // State for API data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [incomeProgression, setIncomeProgression] = useState<any[]>([]);
  const [incomeInsufficientData, setIncomeInsufficientData] = useState(false);
  const [spendingOverTime, setSpendingOverTime] = useState<any[]>([]);
  const [spendingMonth, setSpendingMonth] = useState('');
  const [totalSpent, setTotalSpent] = useState(0);
  const [categoryTrends, setCategoryTrends] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [categoryInsufficientData, setCategoryInsufficientData] = useState(false);
  const [healthScore, setHealthScore] = useState(0);
  const [healthBreakdown, setHealthBreakdown] = useState<any>({});
  const [insights, setInsights] = useState<any[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(15000); // Default budget

  // Fetch all insights data
  const fetchInsightsData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        expenseDistribution,
        incomeProgressionData,
        spendingData,
        categoryTrendsData,
        healthData,
        insightsData,
      ] = await Promise.all([
        insightsService.getExpenseDistribution(),
        insightsService.getIncomeProgression(7), // 7 months for salary progression
        insightsService.getSpendingOverTime(),
        insightsService.getCategoryTrends(6),
        insightsService.getFinancialHealthScore(),
        insightsService.getInsights(),
      ]);

      // Update expense distribution
      if (expenseDistribution.expenseData && expenseDistribution.expenseData.length > 0) {
        const formattedExpenseData = expenseDistribution.expenseData.map((item: any) => ({
          name: item.name,
          amount: item.amount,
          color: getDefaultCategoryColor(item.name), // Always use frontend color mapping
          percentage: item.percentage,
          legendFontColor: '#1e293b',
          legendFontSize: 12,
        }));
        setExpenseData(formattedExpenseData);
        setTotalExpense(expenseDistribution.totalExpense);
      }

      // Update income progression
      setIncomeProgression(incomeProgressionData.progressionData || []);
      setIncomeInsufficientData(incomeProgressionData.insufficientData || false);

      // Update spending over time
      if (spendingData.spendingData && spendingData.spendingData.length > 0) {
        setSpendingOverTime(spendingData.spendingData);
        setTotalSpent(spendingData.totalSpent);
        setSpendingMonth(spendingData.month);
      }

      // Update category trends
      setCategoryTrends(categoryTrendsData.trendData || []);
      setCategoryList(categoryTrendsData.categories || []);
      setCategoryInsufficientData(categoryTrendsData.insufficientData || false);

      // Update health score
      if (healthData.score !== undefined) {
        setHealthScore(healthData.score);
        setHealthBreakdown(healthData.breakdown || {});
        
        // Set budget from monthly income
        if (healthData.breakdown?.monthlyIncome) {
          setMonthlyBudget(healthData.breakdown.monthlyIncome * 0.8); // 80% of income as budget
        }
      }

      // Update insights
      if (insightsData.insights && insightsData.insights.length > 0) {
        console.log('✅ Insights received:', insightsData.insights.length, 'insights');
        console.log('Insights data:', JSON.stringify(insightsData.insights, null, 2));
        setInsights(insightsData.insights);
      } else {
        console.log('⚠️ No insights data received');
      }

      console.log('✅ Insights data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading insights:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get default colors for categories
  const getDefaultCategoryColor = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      'Food': '#FF6B6B',
      'Food & Drink': '#FF6B6B',
      'Shopping': '#8B5CF6',
      'Transport': '#F97316',
      'Entertainment': '#F59E0B',
      'Utilities': '#06B6D4',
      'Bills': '#6366F1',
      'Bills & Utilities': '#6366F1',
      'Health': '#EC4899',
      'Education': '#14B8A6',
      'Travel': '#10B981',
      'Groceries': '#84CC16',
      'Rent': '#A855F7',
      'Salary': '#22C55E',
      'Business': '#3B82F6',
      'Investment': '#06B6D4',
      'Freelance': '#8B5CF6',
      'Gift': '#EC4899',
      'Work': '#22C55E',
      'Other': '#6B7280',
      'Others': '#6B7280',
    };
    return colorMap[category] || '#A0A0A0';
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInsightsData();
    setRefreshing(false);
  };

  // Fetch data on component mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchInsightsData();
    }, [])
  );

  // Chart configurations
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 11,
      fontWeight: '600',
      fill: '#1e293b'
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e2e8f0',
      strokeWidth: 1
    }
  };

  // Prepare category trend data for stacked area chart
  const getCategoryKey = (category: string) => {
    return category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
  };

  const stackedData = categoryTrends.map(item => {
    const data: any = {};
    categoryList.forEach(category => {
      const key = getCategoryKey(category);
      data[key] = item[key] || 0;
    });
    return data;
  });

  // Map colors to match the categories
  const getCategoryColor = (category: string, index: number) => {
    const colorMapping: { [key: string]: string } = {
      'Food': '#FF6B6B',
      'Food & Drink': '#FF6B6B',
      'Shopping': '#8B5CF6',
      'Transport': '#F97316',
      'Entertainment': '#F59E0B',
      'Utilities': '#06B6D4',
      'Bills': '#6366F1',
      'Bills & Utilities': '#6366F1',
      'Health': '#EC4899',
      'Education': '#14B8A6',
      'Travel': '#10B981',
      'Groceries': '#84CC16',
      'Rent': '#A855F7',
    };
    return colorMapping[category] || ['#FF6B6B', '#8B5CF6', '#F97316', '#F59E0B', '#06B6D4', '#EC4899'][index % 6];
  };

  const colors = categoryList.map((cat, index) => getCategoryColor(cat, index));
  const keys = categoryList.map(cat => getCategoryKey(cat));

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#3B82F6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  // Loading state
  if (loading) {
    return (
      <LinearGradient
        colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
        className="flex-1 justify-center items-center"
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-slate-700 mt-4 text-base">Loading insights...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View className="px-6 pt-14 pb-6">
          <Text className="text-3xl font-bold text-slate-800 mb-1">Financial Insights</Text>
          <Text className="text-sm text-slate-600">Your spending patterns & growth analysis</Text>
        </View>

        {/* Spending Over Time Line Chart with Budget Line */}
        <View className="mx-4 mb-4 bg-white/90 rounded-3xl p-5 shadow-md">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-slate-800 mb-1">Spending Over Time</Text>
              <Text className="text-xs text-slate-500">{spendingMonth || 'Current month'}</Text>
            </View>
            {/* <View className="bg-gradient-to-r from-orange-100 to-orange-50 px-3 py-2 rounded-xl">
              <Text className="text-xs font-semibold text-orange-700">
                Day {spendingOverTime.length > 0 ? spendingOverTime[spendingOverTime.length - 1]?.day : new Date().getDate()}
              </Text>
            </View> */}
          </View>

          {spendingOverTime.length > 0 ? (
            <>
            {/* Stats Row */}
            <View className="flex-row justify-between mb-4 bg-slate-50 rounded-2xl p-3">
              <View className="flex-1 items-center">
                <Text className="text-xs text-slate-500 mb-1">Spent Till Date</Text>
                <Text className="text-lg font-bold text-slate-800">₹{totalSpent.toFixed(0)}</Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#e2e8f0' }} />
              <View className="flex-1 items-center">
                <Text className="text-xs text-slate-500 mb-1">Budget Used</Text>
                <Text className="text-lg font-bold text-orange-600">
                  {Math.round((totalSpent / monthlyBudget) * 100)}%
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#e2e8f0' }} />
              <View className="flex-1 items-center">
                <Text className="text-xs text-slate-500 mb-1">Remaining</Text>
                <Text className="text-lg font-bold text-green-600">
                  ₹{(monthlyBudget - totalSpent).toFixed(0)}
                </Text>
              </View>
            </View>
            
            <LineChart
              data={{
                labels: spendingOverTime.slice(0, 10).map(item => item.day.toString()),
                datasets: [
                  {
                    data: spendingOverTime.slice(0, 10).map(item => item.cumulative),
                    color: (opacity = 0.1) => `rgba(249, 115, 22, ${opacity})`,
                    strokeWidth: 3
                  },
                  {
                    data: Array(Math.min(10, spendingOverTime.length)).fill(monthlyBudget),
                    color: (opacity = 1) => `rgba(34, 197, 99, ${opacity})`,
                    strokeWidth: 2,
                    withDots: false
                  }
                ],
              }}
              width={screenWidth - 80}
              height={240}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#F97316',
                  fill: '#ffffff'
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: '#e2e8f0',
                  strokeWidth: 1
                }
              }}
              bezier
              style={{
                borderRadius: 16,
              }}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={true}
            />

            {/* Legend with colors */}
            <View className="flex-row justify-center items-center mt-3">
              <View className="flex-row items-center mr-6">
                <View className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
                <Text className="text-xs text-slate-600 font-medium">Your Spending</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                <Text className="text-xs text-slate-600 font-medium">Monthly Budget</Text>
              </View>
            </View>
            </>
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">📊</Text>
              <Text className="text-lg font-bold text-slate-800 mb-2">No Spending Data Yet</Text>
              <Text className="text-sm text-slate-500 text-center px-8">
                Start adding expense transactions to see your spending trends over time
              </Text>
            </View>
          )}
        </View>

        {/* Show first insight card */}
        {insights.length > 0 ? (
          insights[0] && (
            <InsightCard
              title={insights[0].title}
              description={insights[0].description}
              icon={insights[0].icon}
              trend={insights[0].type as 'positive' | 'negative' | 'warning' | 'neutral'}
              index={0}
            />
          )
        ) : (
          <InsightCard
            title="Start Your Financial Journey"
            description="Add transactions to get personalized insights about your spending habits, savings patterns, and financial health. We'll analyze your data and provide actionable recommendations."
            icon="💡"
            trend="neutral"
            index={0}
          />
        )}

        {/* Expense Domain Pie Chart */}
        <View className="mx-4 mb-4 bg-white/90 rounded-3xl p-5 shadow-md">
          <Text className="text-xl font-bold text-slate-800 mb-1">Expense Distribution</Text>
          <Text className="text-xs text-slate-500 mb-4">By category this month</Text>
          
          {expenseData.length > 0 ? (
            <>
            <View className="items-center">
              <PieChart
                data={expenseData}
                width={screenWidth - 60}
                height={240}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="72"
                absolute={false}
                hasLegend={false}
                center={[0, 0]}
              />
            </View>

            {/* Custom Legend */}
            <View className="mt-4 px-2">
              {expenseData.map((item, index) => (
                <View key={index} className="flex-row items-center justify-between mb-2 px-2">
                  <View className="flex-row items-center flex-1">
                    <View 
                      style={{ backgroundColor: item.color }} 
                      className="w-3 h-3 rounded-full mr-3"
                    />
                    <Text className="text-sm text-slate-700 font-medium flex-1" numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-slate-800 ml-2">
                    {item.percentage}%
                  </Text>
                </View>
              ))}
            </View>
            </>
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">🥧</Text>
              <Text className="text-lg font-bold text-slate-800 mb-2">No Expense Data</Text>
              <Text className="text-sm text-slate-500 text-center px-8">
                Add expense transactions to see how your spending is distributed across categories
              </Text>
            </View>
          )}
        </View>

        {/* Show second insight card */}
        {insights.length > 1 && insights[1] && (
          <InsightCard
            title={insights[1].title}
            description={insights[1].description}
            icon={insights[1].icon}
            trend={insights[1].type as 'positive' | 'negative' | 'warning' | 'neutral'}
            index={1}
          />
        )}

        {/* Income Progression Line Chart */}
        <View className="mx-4 mb-4 mt-2 bg-white/90 rounded-3xl p-5 shadow-md">
          <Text className="text-xl font-bold text-slate-800 mb-1">Income Progression</Text>
          <Text className="text-xs text-slate-500 mb-4">Monthly income over time</Text>
          
          {!incomeInsufficientData && incomeProgression.length > 0 ? (
            <LineChart
              data={{
                labels: incomeProgression.map(item => item.month),
                datasets: [{
                  data: incomeProgression.map(item => item.income),
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  strokeWidth: 3
                }]
              }}
              width={screenWidth - 80}
              height={220}
              chartConfig={{
                ...chartConfig,
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#3B82F6',
                  fill: '#ffffff'
                }
              }}
              bezier
              style={{
                borderRadius: 16,
              }}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={false}
              segments={4}
            />
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">💰</Text>
              <Text className="text-lg font-bold text-slate-800 mb-2">Insufficient Income Data</Text>
              <Text className="text-sm text-slate-500 text-center px-8">
                Add income transactions to track your earnings progression over time
              </Text>
            </View>
          )}
        </View>

        {/* Show third insight card */}
        {insights.length > 2 && insights[2] && (
          <InsightCard
            title={insights[2].title}
            description={insights[2].description}
            icon={insights[2].icon}
            trend={insights[2].type as 'positive' | 'negative' | 'warning' | 'neutral'}
            index={2}
          />
        )}

        {/* Financial Health Score */}
        <View className="mx-4 mb-4 mt-2 bg-white/90 rounded-3xl p-6 shadow-md">
          <Text className="text-xl font-bold text-slate-800 mb-1">Financial Health Score</Text>
          <Text className="text-xs text-slate-500 mb-6">Overall financial wellness indicator</Text>
          
          {healthScore > 0 && healthBreakdown.monthlyIncome > 0 ? (
            <View className="items-center justify-center py-4">
              <AnimatedCircularProgress
                size={200}
                width={18}
                fill={healthScore}
                tintColor={getHealthScoreColor(healthScore)}
                backgroundColor="#e2e8f0"
                rotation={0}
                lineCap="round"
                duration={2000}
              >
                {() => (
                  <View className="items-center">
                    <Text className="text-5xl font-bold text-slate-800">
                      {healthScore}
                    </Text>
                    <Text className="text-sm text-slate-500 mt-1">out of 100</Text>
                    <View className="mt-3 px-4 py-2 bg-blue-50 rounded-full">
                      <Text className="text-sm font-semibold" style={{ color: getHealthScoreColor(healthScore) }}>
                        {getHealthScoreLabel(healthScore)}
                      </Text>
                    </View>
                  </View>
                )}
              </AnimatedCircularProgress>
            </View>
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">❤️</Text>
              <Text className="text-lg font-bold text-slate-800 mb-2">Insufficient Data</Text>
              <Text className="text-sm text-slate-500 text-center px-8">
                Add income and expense transactions to calculate your financial health score
              </Text>
            </View>
          )}
        </View>

        {/* Show remaining insight cards */}
        {insights.slice(3).map((insight, index) => (
          <InsightCard
            key={index + 3}
            title={insight.title}
            description={insight.description}
            icon={insight.icon}
            trend={insight.type as 'positive' | 'negative' | 'warning' | 'neutral'}
            index={index + 3}
          />
        ))}

        {/* Category Trend Stacked Area Chart */}
        <View className="mx-4 mb-4 mt-2 bg-white/90 rounded-3xl p-5 shadow-md">
          <Text className="text-xl font-bold text-slate-800 mb-1">Category Trend</Text>
          <Text className="text-xs text-slate-500 mb-4">Major spending categories over time</Text>
          
          {!categoryInsufficientData && categoryTrends.length > 0 && categoryList.length > 0 ? (
            <>
              {/* Legend */}
              <View className="flex-row justify-center mb-4 flex-wrap">
                {categoryList.map((category, index) => (
                  <View key={index} className="flex-row items-center mr-3 mb-2">
                    <View 
                      style={{ backgroundColor: colors[index % colors.length] }} 
                      className="w-4 h-4 rounded-full mr-2" 
                    />
                    <Text className="text-xs text-slate-600 font-medium">{category}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 220, flexDirection: 'row', paddingVertical: 10 }}>
                <YAxis
                  data={categoryTrends.map(item => {
                    let total = 0;
                    categoryList.forEach(category => {
                      const key = getCategoryKey(category);
                      total += item[key] || 0;
                    });
                    return total;
                  })}
                  contentInset={{ top: 10, bottom: 10 }}
                  svg={{ fontSize: 10, fill: '#64748b', fontWeight: '600' }}
                  numberOfTicks={5}
                  formatLabel={(value: any) => `₹${(value / 1000).toFixed(1)}k`}
                  style={{ marginRight: 8, width: 40 }}
                />
                <View style={{ flex: 1 }}>
                  <StackedAreaChart
                    style={{ flex: 1 }}
                    data={stackedData}
                    keys={keys as any}
                    colors={colors}
                    contentInset={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    curve={shape.curveNatural}
                  >
                    <Grid svg={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                  </StackedAreaChart>

                  <XAxis
                    style={{ marginTop: 8, height: 20 }}
                    data={categoryTrends}
                    formatLabel={(_: any, index: any) => categoryTrends[index].month}
                    contentInset={{ left: 10, right: 10 }}
                    svg={{ fontSize: 10, fill: '#64748b', fontWeight: '600' }}
                  />
                </View>
              </View>
            </>
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">📈</Text>
              <Text className="text-lg font-bold text-slate-800 mb-2">Insufficient Category Data</Text>
              <Text className="text-sm text-slate-500 text-center px-8">
                Add more expense transactions across different categories to see spending trends over time
              </Text>
            </View>
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </LinearGradient>
  );
}
