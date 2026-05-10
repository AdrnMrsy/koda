import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, PlusCircle, BarChart3, User, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

function TabIcon({ icon: Icon, label, focused }: { icon: any; label: string; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-7">
      <Icon
        size={24}
        color={focused ? '#58CC02' : '#AFAFAF'}
        strokeWidth={focused ? 2.5 : 2}
      />
      <Text
        className={`text-[9px] mt-1 ${
          focused ? 'font-nunito-bold text-koda-green' : 'font-nunito text-surface-500'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Calculate dynamic bottom padding and height
  // Base height is 60, plus the bottom inset
  const bottomPadding = Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.1 : 0.05,
          shadowRadius: isDark ? 4 : 8,
          height: tabBarHeight,
          paddingBottom: bottomPadding,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Home} label="Home" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={MessageSquare} label="Chat" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-center mt-5">
              <View
                className={`w-16 h-16 rounded-full items-center justify-center ${
                  focused ? 'bg-koda-green' : 'bg-koda-green'
                } border-b-[1px] border-koda-green-dark`}
              >
                <PlusCircle size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={BarChart3} label="Stats" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={User} label="Profile" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tabs>
  );
}
