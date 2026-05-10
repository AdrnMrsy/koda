import React from 'react';
import { View, Text } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
  showPercentage?: boolean;
  variant?: 'green' | 'blue' | 'yellow' | 'red' | 'auto';
  size?: 'sm' | 'md' | 'lg';
}

function getAutoColor(progress: number): string {
  if (progress >= 1) return 'bg-koda-red';
  if (progress >= 0.8) return 'bg-koda-orange';
  if (progress >= 0.5) return 'bg-koda-yellow';
  return 'bg-koda-green';
}

const variantFillColors: Record<string, string> = {
  green: 'bg-koda-green',
  blue: 'bg-koda-blue',
  yellow: 'bg-koda-yellow',
  red: 'bg-koda-red',
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function ProgressBar({
  progress,
  label,
  showPercentage = false,
  variant = 'green',
  size = 'md',
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(clampedProgress * 100);
  const fillColor =
    variant === 'auto' ? getAutoColor(clampedProgress) : variantFillColors[variant];

  return (
    <View className="w-full">
      {(label || showPercentage) && (
        <View className="flex-row justify-between items-center mb-1">
          {label && (
            <Text className="font-nunito-semibold text-xs text-surface-800 dark:text-white">{label}</Text>
          )}
          {showPercentage && (
            <Text className="font-nunito-bold text-xs text-surface-500 dark:text-surface-300">{percentage}%</Text>
          )}
        </View>
      )}
      <View className={`w-full bg-surface-200 dark:bg-surface-800 rounded-pill overflow-hidden ${sizeClasses[size]}`}>
        <View
          className={`${sizeClasses[size]} ${fillColor} rounded-pill`}
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
}
