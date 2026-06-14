import React from 'react';
import { View, Text } from 'react-native';
import { Flame } from 'lucide-react-native';

interface StreakCounterProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakCounter({ streak, size = 'md' }: StreakCounterProps) {
  const sizeClasses = {
    sm: { container: 'px-2 py-1', text: 'text-xs', iconSize: 12 },
    md: { container: 'px-3 py-1.5', text: 'text-sm', iconSize: 14 },
    lg: { container: 'px-4 py-2', text: 'text-base', iconSize: 16 },
  };

  const s = sizeClasses[size];
  const isActive = streak > 0;

  return (
    <View
      className={`flex-row items-center rounded-pill ${s.container} ${
        isActive ? 'bg-koda-orange/20' : 'bg-surface-100 dark:bg-koda-darker'
      }`}
    >
      <View className="mr-1" style={{ opacity: isActive ? 1 : 0.4 }}>
        <Flame size={s.iconSize} color="#FF9600" />
      </View>
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
