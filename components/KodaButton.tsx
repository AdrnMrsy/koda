import React from 'react';
import { Text, Pressable, View, type PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface KodaButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
}

export const KodaButton = React.memo(function KodaButton({
  title,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  onPress,
  ...rest
}: KodaButtonProps) {
  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPress) onPress(e);
  };

  const variants = {
    primary: 'bg-koda-green border-koda-green-dark',
    secondary: 'bg-koda-blue border-[#1899D6]',
    danger: 'bg-koda-red border-[#D33131]',
    ghost: 'bg-white dark:bg-koda-darker border-surface-200 dark:border-surface-800',
  };

  const textColors = {
    primary: 'text-white',
    secondary: 'text-white',
    danger: 'text-white',
    ghost: 'text-surface-500',
  };

  return (
    <Pressable
      className={`${fullWidth ? 'w-full' : ''} active:translate-y-[2px] transition-transform`}
      onPress={handlePress}
      {...rest}
    >
      <View
        className={`
          ${variants[variant]} 
          ${size === 'lg' ? 'py-4' : 'py-3'} 
          px-6 rounded-koda border-b-[4px] items-center justify-center
          ${className}
        `}
      >
        <Text
          className={`
            ${textColors[variant]} 
            font-nunito-black uppercase tracking-wider
            ${size === 'lg' ? 'text-lg' : 'text-sm'}
          `}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
});
