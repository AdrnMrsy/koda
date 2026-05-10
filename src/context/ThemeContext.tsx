import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = '@koda_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [loaded, setLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeState(saved);
      }
      setLoaded(true);
    });
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const isDark =
    theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
