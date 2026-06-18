import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'nativewind';

import '../global.css';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { PrivacyOverlay } from '../components/PrivacyOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';
import Animated from 'react-native-reanimated';

cssInterop(SafeAreaView, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });
import { LockScreen } from '../components/LockScreen';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { getDatabase } from '@/db/database';

// Suppress Reanimated strict mode warnings (caused by NativeWind internals)
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDark } = useTheme();
  const { setColorScheme } = useColorScheme();
  const { isAuthenticated, isLoading, authenticate } = useBiometricAuth();

  // Sync NativeWind color scheme with our theme
  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark, setColorScheme]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-koda-green">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LockScreen onAuthenticate={authenticate} />;
  }

  return (
    <PrivacyOverlay>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="budget"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </PrivacyOverlay>
  );
}

export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    async function initDB() {
      try {
        await getDatabase();
      } catch (e) {
        console.error('Failed to initialize database', e);
      } finally {
        setDbInitialized(true);
      }
    }
    initDB();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && dbInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, dbInitialized]);

  if ((!fontsLoaded && !fontError) || !dbInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-koda-green">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
