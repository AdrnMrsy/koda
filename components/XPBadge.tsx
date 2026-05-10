import React from 'react';
import { View, Text } from 'react-native';

interface XPBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
}

export function XPBadge({ xp, size = 'md' }: XPBadgeProps) {
  const sizeClasses = {
    sm: { container: 'px-2 py-1', text: 'text-xs', icon: '⭐' },
    md: { container: 'px-3 py-1.5', text: 'text-sm', icon: '⭐' },
    lg: { container: 'px-4 py-2', text: 'text-base', icon: '⭐' },
  };

  const s = sizeClasses[size];

  return (
    <View className={`flex-row items-center bg-koda-yellow/20 rounded-pill ${s.container}`}>
      <Text className={`${s.text} mr-1`}>{s.icon}</Text>
      <Text className={`font-nunito-black text-koda-orange ${s.text}`}>
        {xp.toLocaleString()} XP
      </Text>
    </View>
  );
}
