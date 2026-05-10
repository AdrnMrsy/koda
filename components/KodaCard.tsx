import React from 'react';
import { View, type ViewProps } from 'react-native';

interface KodaCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'highlight';
}

export function KodaCard({ children, variant = 'default', className = '', ...rest }: KodaCardProps) {
  const baseClasses = 'rounded-koda p-4';

  const variantClasses = {
    default: 'bg-white dark:bg-koda-darker border-b-[4px] border-surface-200 dark:border-surface-800',
    elevated: 'bg-white dark:bg-koda-darker border-b-[4px] border-surface-300 dark:border-surface-800 shadow-sm',
    highlight: 'bg-koda-green-light dark:bg-koda-green/20 border-b-[4px] border-koda-green',
  };

  return (
    <View className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...rest}>
      {children}
    </View>
  );
}
