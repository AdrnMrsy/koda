import React from 'react';
import * as LucideIcons from 'lucide-react-native';

export interface IconMapperProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export const IconMapper: React.FC<IconMapperProps> = ({ name, size = 24, color = 'currentColor', style }) => {
  // Try to find the icon in the Lucide set.
  // The name should be exactly the export name like 'Pizza', 'ShoppingBag'
  // If we store it as a fallback name, we can do some minor conversions
  const IconComponent = (LucideIcons as any)[name];

  if (!IconComponent) {
    // Fallback if not found
    return <LucideIcons.HelpCircle size={size} color={color} style={style} />;
  }

  return <IconComponent size={size} color={color} style={style} />;
};
