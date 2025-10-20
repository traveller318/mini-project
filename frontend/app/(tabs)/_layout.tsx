import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar = ({ state, descriptors, navigation }: CustomTabBarProps) => {
  const insets = useSafeAreaInsets();
  
  const iconMap: { [key: string]: any } = {
    'index': 'home-outline',
    'Insights': 'bar-chart-outline', 
    'VoiceAgent': 'mic',
    'Transactions': 'list-outline',
    'Goals': 'trophy-outline'
  };

  return (
    <View 
      className="absolute bottom-4 left-0 right-0 flex-row justify-center"
      style={{ paddingBottom: Math.max(insets.bottom, 6), bottom: 10 }} // Move up by 10 units
    >
      <View className="flex-row bg-white rounded-full shadow-lg mx-2 px-3 py-2" style={{ minWidth: '85%' }}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const isVoiceAgent = route.name === 'VoiceAgent';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isVoiceAgent) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                className="mx-2 -mt-8" // Move up more for more prominence
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  className="justify-center items-center shadow-lg"
                  style={{ 
                    width: 56, // Make it perfectly round with consistent dimensions
                    height: 56, 
                    borderRadius: 28, // Half of width/height for perfect circle
                    elevation: 8, // Add more prominence with additional shadow
                  }}
                >
                  <Ionicons 
                    name={iconMap[route.name]} 
                    size={24} 
                    color="white" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              className="flex-1 items-center justify-center py-2 px-2 rounded-full"
              activeOpacity={0.8}
            >
              <Ionicons
                name={iconMap[route.name]}
                size={22}
                color={isFocused ? '#3B82F6' : '#6B7280'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="Insights"
        options={{
          title: 'Insights',
        }}
      />
      <Tabs.Screen
        name="VoiceAgent"
        options={{
          title: 'Voice Agent',
        }}
      />
      <Tabs.Screen
        name="Transactions"
        options={{
          title: 'Transactions',
        }}
      />
      <Tabs.Screen
        name="Goals"
        options={{
          title: 'Goals',
        }}
      />
    </Tabs>
  );
}