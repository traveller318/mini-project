import React, { useRef } from 'react';
import { View, Text, ScrollView, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { StackedAreaChart, Grid, YAxis, XAxis } from 'react-native-svg-charts';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import * as shape from 'd3-shape';
import {
  expenseDomainData,
  salaryProgressionData,
  financialHealthScore,
  categoryTrendData,
  insightsCards,
  spendingOverTimeData,
  monthlyBudget
} from '../../data/data';

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

        {/* Bottom accent line */}
        {/* <View style={{ backgroundColor: 'rgba(255,255,255,0.4)', height: 4, borderRadius: 2, marginTop: 16 }} /> */}
      </LinearGradient>
    </View>
  );
};

export default function Insights() {
  const scrollY = useRef(new Animated.Value(0)).current;

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
  const xLabels = categoryTrendData.map(item => item.month);
  
  // Transform data for StackedAreaChart - it needs objects with keys matching the 'keys' prop
  const stackedData = categoryTrendData.map(item => ({
    food: item.food,
    shopping: item.shopping,
    travel: item.travel,
    entertainment: item.entertainment,
  }));

  const colors = ['#FF6B6B', '#8B5CF6', '#F97316', '#F59E0B'];
  const keys = ['food', 'shopping', 'travel', 'entertainment'] as const;

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

  return (
    <LinearGradient
      colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
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
              <Text className="text-xs text-slate-500">Daily cumulative expenses this month</Text>
            </View>
            <View className="bg-gradient-to-r from-orange-100 to-orange-50 px-3 py-2 rounded-xl">
              <Text className="text-xs font-semibold text-orange-700">Day 28</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row justify-between mb-4 bg-slate-50 rounded-2xl p-3">
            <View className="flex-1 items-center">
              <Text className="text-xs text-slate-500 mb-1">Spent Till Date</Text>
              <Text className="text-lg font-bold text-slate-800">₹8,550</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#e2e8f0' }} />
            <View className="flex-1 items-center">
              <Text className="text-xs text-slate-500 mb-1">Budget Used</Text>
              <Text className="text-lg font-bold text-orange-600">57%</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#e2e8f0' }} />
            <View className="flex-1 items-center">
              <Text className="text-xs text-slate-500 mb-1">Remaining</Text>
              <Text className="text-lg font-bold text-green-600">₹6,450</Text>
            </View>
          </View>
          
          <LineChart
            data={{
              labels: ['1', '5', '8', '12', '15', '18', '20', '23', '26', '28'],
              datasets: [
                {
                  data: spendingOverTimeData.map(item => item.cumulative),
                  color: (opacity = 0.1) => `rgba(249, 115, 22, ${opacity})`,
                  strokeWidth: 3
                },
                {
                  data: [monthlyBudget, monthlyBudget, monthlyBudget, monthlyBudget, monthlyBudget, monthlyBudget, monthlyBudget, monthlyBudget, monthlyBudget, monthlyBudget],
                  color: (opacity = 1) => `rgba(34, 197, 99, ${opacity})`,
                  strokeWidth: 2,
                  withDots: false
                }
              ],
              // legend: ['Your Spending', 'Monthly Budget']
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
        </View>

        <InsightCard
          title={insightsCards.spendingOverTimeInsight.title}
          description={insightsCards.spendingOverTimeInsight.description}
          icon={insightsCards.spendingOverTimeInsight.icon}
          trend={insightsCards.spendingOverTimeInsight.trend as 'positive' | 'negative' | 'warning' | 'neutral'}
          index={0}
        />

        {/* Expense Domain Pie Chart */}
        <View className="mx-4 mb-4 bg-white/90 rounded-3xl p-5 shadow-md">
          <Text className="text-xl font-bold text-slate-800 mb-1">Expense Distribution</Text>
          <Text className="text-xs text-slate-500 mb-4">By category this month</Text>
          
          <View className="items-center ">
            <PieChart
              data={expenseDomainData}
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
            {expenseDomainData.map((item, index) => (
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
        </View>

        <InsightCard
          title={insightsCards.expenseInsight.title}
          description={insightsCards.expenseInsight.description}
          icon={insightsCards.expenseInsight.icon}
          trend={insightsCards.expenseInsight.trend as 'positive' | 'negative' | 'warning' | 'neutral'}
          index={1}
        />

        {/* Salary Progression Line Chart */}
        <View className="mx-4 mb-4 mt-2 bg-white/90 rounded-3xl p-5 shadow-md">
          <Text className="text-xl font-bold text-slate-800 mb-1">Salary Progression</Text>
          <Text className="text-xs text-slate-500 mb-4">Monthly growth over 7 months</Text>
          
          <LineChart
            data={{
              labels: salaryProgressionData.map(item => item.month),
              datasets: [{
                data: salaryProgressionData.map(item => item.salary),
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
        </View>

        <InsightCard
          title={insightsCards.salaryInsight.title}
          description={insightsCards.salaryInsight.description}
          icon={insightsCards.salaryInsight.icon}
          trend={insightsCards.salaryInsight.trend as 'positive' | 'negative' | 'warning' | 'neutral'}
          index={2}
        />

        {/* Financial Health Score */}
        <View className="mx-4 mb-4 mt-2 bg-white/90 rounded-3xl p-6 shadow-md">
          <Text className="text-xl font-bold text-slate-800 mb-1">Financial Health Score</Text>
          <Text className="text-xs text-slate-500 mb-6">Overall financial wellness indicator</Text>
          
          <View className="items-center justify-center py-4">
            <AnimatedCircularProgress
              size={200}
              width={18}
              fill={financialHealthScore}
              tintColor={getHealthScoreColor(financialHealthScore)}
              backgroundColor="#e2e8f0"
              rotation={0}
              lineCap="round"
              duration={2000}
            >
              {() => (
                <View className="items-center">
                  <Text className="text-5xl font-bold text-slate-800">
                    {financialHealthScore}
                  </Text>
                  <Text className="text-sm text-slate-500 mt-1">out of 100</Text>
                  <View className="mt-3 px-4 py-2 bg-blue-50 rounded-full">
                    <Text className="text-sm font-semibold" style={{ color: getHealthScoreColor(financialHealthScore) }}>
                      {getHealthScoreLabel(financialHealthScore)}
                    </Text>
                  </View>
                </View>
              )}
            </AnimatedCircularProgress>
          </View>
        </View>

        <InsightCard
          title={insightsCards.healthInsight.title}
          description={insightsCards.healthInsight.description}
          icon={insightsCards.healthInsight.icon}
          trend={insightsCards.healthInsight.trend as 'positive' | 'negative' | 'warning' | 'neutral'}
          index={3}
        />

        {/* Category Trend Stacked Area Chart */}
        <View className="mx-4 mb-4 mt-2 bg-white/90 rounded-3xl p-5 shadow-md">
          <Text className="text-xl font-bold text-slate-800 mb-1">Category Trend</Text>
          <Text className="text-xs text-slate-500 mb-4">Major spending categories over 6 months</Text>
          
          {/* Legend */}
          <View className="flex-row justify-center mb-4 flex-wrap">
            <View className="flex-row items-center mr-3 mb-2">
              <View className="w-4 h-4 rounded-full bg-[#FF6B6B] mr-2" />
              <Text className="text-xs text-slate-600 font-medium">Food</Text>
            </View>
            <View className="flex-row items-center mr-3 mb-2">
              <View className="w-4 h-4 rounded-full bg-[#8B5CF6] mr-2" />
              <Text className="text-xs text-slate-600 font-medium">Shopping</Text>
            </View>
            <View className="flex-row items-center mr-3 mb-2">
              <View className="w-4 h-4 rounded-full bg-[#F97316] mr-2" />
              <Text className="text-xs text-slate-600 font-medium">Travel</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <View className="w-4 h-4 rounded-full bg-[#F59E0B] mr-2" />
              <Text className="text-xs text-slate-600 font-medium">Entertainment</Text>
            </View>
          </View>

          <View style={{ height: 220, flexDirection: 'row', paddingVertical: 10 }}>
            <YAxis
              data={categoryTrendData.map(item => 
                item.food + item.shopping + item.travel + item.entertainment
              )}
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
                keys={keys}
                colors={colors}
                contentInset={{ top: 10, bottom: 10, left: 10, right: 10 }}
                curve={shape.curveNatural}
              >
                <Grid svg={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
              </StackedAreaChart>

              <XAxis
                style={{ marginTop: 8, height: 20 }}
                data={xLabels}
                formatLabel={(_: any, index: any) => xLabels[index]}
                contentInset={{ left: 10, right: 10 }}
                svg={{ fontSize: 10, fill: '#64748b', fontWeight: '600' }}
              />
            </View>
          </View>
        </View>

        <InsightCard
          title={insightsCards.categoryTrendInsight.title}
          description={insightsCards.categoryTrendInsight.description}
          icon={insightsCards.categoryTrendInsight.icon}
          trend={insightsCards.categoryTrendInsight.trend as 'positive' | 'negative' | 'warning' | 'neutral'}
          index={4}
        />

        <View className="h-8" />
      </ScrollView>
    </LinearGradient>
  );
}