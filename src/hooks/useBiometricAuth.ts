import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppState, type AppStateStatus } from 'react-native';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAvailable: boolean;
  authenticate: () => Promise<boolean>;
}

export function useBiometricAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  // Re-prompt on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated]);

  async function checkAvailability() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(compatible && enrolled);

      if (compatible && enrolled) {
        await authenticate();
      } else {
        // No biometrics available, allow access
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Koda',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      setIsAuthenticated(result.success);
      return result.success;
    } catch {
      return false;
    }
  }, []);

  function handleAppStateChange(nextState: AppStateStatus) {
    if (nextState === 'active' && !isAuthenticated) {
      authenticate();
    }
    // Lock when going to background (will re-prompt on return)
    if (nextState === 'background') {
      setIsAuthenticated(false);
    }
  }

  return { isAuthenticated, isLoading, isAvailable, authenticate };
}
