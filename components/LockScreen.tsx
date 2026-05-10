import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface LockScreenProps {
  onAuthenticate: () => Promise<boolean>;
}

export function LockScreen({ onAuthenticate }: LockScreenProps) {
  async function handleUnlock() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onAuthenticate();
  }

  return (
    <SafeAreaView className="flex-1 bg-koda-green items-center justify-center">
      <View className="items-center">
        {/* Mascot */}
        <Image 
          source={require('../assets/koda.png')} 
          className="w-32 h-32 mb-6" 
          resizeMode="contain"
        />

        {/* App Name */}
        <Text className="font-nunito-extrabold text-white text-4xl mb-2">
          Koda
        </Text>
        <Text className="font-nunito text-white/70 text-base mb-12">
          Your finances, gamified.
        </Text>

        {/* Unlock Button */}
        <Pressable
          onPress={handleUnlock}
          className="bg-white/20 rounded-koda-lg px-10 py-4 border-2 border-white/30 active:bg-white/30"
        >
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">🔓</Text>
            <Text className="font-nunito-bold text-white text-lg">
              Tap to Unlock
            </Text>
          </View>
        </Pressable>

        {/* Hint */}
        <Text className="font-nunito text-white/50 text-xs mt-6">
          Biometric authentication required
        </Text>
      </View>
    </SafeAreaView>
  );
}
