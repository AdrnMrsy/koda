import React from 'react';
import { View, Text } from 'react-native';
import { getLevelTitle } from '@/db/database';

interface LevelBadgeProps {
  level: number;
}

export function LevelBadge({ level }: LevelBadgeProps) {
  return (
    <View className="flex-row items-center bg-koda-purple/20 rounded-pill px-3 py-1.5">
      <Text className="font-nunito-black text-sm text-koda-purple">
        Lv.{level}
      </Text>
    </View>
  );
}
