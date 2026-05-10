import React, { useEffect, useState } from 'react';
import { View, AppState, type AppStateStatus, Image } from 'react-native';

/**
 * Shows a solid green overlay when the app is in the task switcher
 * to prevent sensitive financial data from being visible.
 */
export function PrivacyOverlay({ children }: { children: React.ReactNode }) {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, []);

  function handleChange(nextState: AppStateStatus) {
    // Show overlay when app is inactive (task switcher) or background
    setShowOverlay(nextState !== 'active');
  }

  return (
    <View className="flex-1">
      {children}
      {showOverlay && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-koda-green items-center justify-center z-50">
          <View className="items-center">
            <Image 
              source={require('../assets/koda.png')} 
              className="w-32 h-32 mb-4" 
              resizeMode="contain"
            />
          </View>
        </View>
      )}
    </View>
  );
}
