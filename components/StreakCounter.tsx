import React from 'react';
import { View, Text } from 'react-native';

interface StreakCounterProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakCounter({ streak, size = 'md' }: StreakCounterProps) {
  const sizeClasses = {
    sm: { container: 'px-2 py-1', text: 'text-xs', icon: '🔥' },
    md: { container: 'px-3 py-1.5', text: 'text-sm', icon: '🔥' },
    lg: { container: 'px-4 py-2', text: 'text-base', icon: '🔥' },
  };

  const s = sizeClasses[size];
  const isActive = streak > 0;

  return (
    <View
      className={`flex-row items-center rounded-pill ${s.container} ${
        isActive ? 'bg-koda-orange/20' : 'bg-surface-100 dark:bg-koda-darker'
      }`}
    >
      <Text className={`${s.text} mr-1 ${isActive ? '' : 'opacity-40'}`}>{s.icon}</Text>
      <Text
        className={`font-nunito-black ${s.text} ${
          isActive ? 'text-koda-orange' : 'text-surface-500'
        }`}
      >
        {streak}
      </Text>
    </View>
  );
}
