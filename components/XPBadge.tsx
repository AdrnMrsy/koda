import React from 'react';
import { View, Text } from 'react-native';
import { Star } from 'lucide-react-native';

interface XPBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
}

export function XPBadge({ xp, size = 'md' }: XPBadgeProps) {
  const sizeClasses = {
    sm: { container: 'px-2 py-1', text: 'text-xs', iconSize: 12 },
    md: { container: 'px-3 py-1.5', text: 'text-sm', iconSize: 14 },
    lg: { container: 'px-4 py-2', text: 'text-base', iconSize: 16 },
  };

  const s = sizeClasses[size];

  return (
    <View className={`flex-row items-center bg-koda-yellow/20 rounded-pill ${s.container}`}>
      <View className="mr-1">
        <Star size={s.iconSize} color="#FF9600" fill="#FF9600" />
      </View>
      <Text className={`font-nunito-black text-koda-orange ${s.text}`}>
        {xp.toLocaleString()} XP
      </Text>
    </View>
  );
}
