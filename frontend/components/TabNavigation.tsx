import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';

interface Tab {
  key: string;
  label: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
}

const { width } = Dimensions.get('window');

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Calculate tab width (accounting for padding)
  const tabWidth = (width - 32 - 8) / tabs.length; // 32px for horizontal padding, 8px for container padding

  useEffect(() => {
    // Animate the sliding indicator
    Animated.spring(translateX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();

    // Scale animation for feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex]);

  return (
    <View className="px-4 pt-6 pb-4">
      <View className="bg-gray-100 rounded-full p-1 flex-row relative">
        {/* Animated Sliding Background */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 4,
            top: 4,
            bottom: 4,
            width: tabWidth - 8,
            backgroundColor: 'white',
            borderRadius: 9999,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            transform: [{ translateX }, { scale: scaleAnim }],
          }}
        />

        {/* Tab Buttons */}
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              className="flex-1 py-3 rounded-full"
              activeOpacity={0.7}
              style={{ zIndex: 1 }}
            >
              <Animated.Text
                style={{
                  textAlign: 'center',
                  fontWeight: '600',
                  color: isActive ? '#2563EB' : '#6B7280',
                  fontSize: 15,
                }}
              >
                {tab.label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
