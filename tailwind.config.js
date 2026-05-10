/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        koda: {
          green: '#58CC02',
          'green-dark': '#46A302',
          'green-light': '#D7FFB8',
          blue: '#1CB0F6',
          purple: '#CE82FF',
          yellow: '#FFC800',
          red: '#FF4B4B',
          orange: '#FF9600',
          dark: '#1A1A2E',
          darker: '#16213E',
        },
        surface: {
          100: '#F7F7F7',
          200: '#E5E5E5',
          300: '#D4D4D4',
          500: '#AFAFAF',
          800: '#4B4B4B',
        },
      },
      fontFamily: {
        nunito: ['Nunito_400Regular'],
        'nunito-medium': ['Nunito_500Medium'],
        'nunito-semibold': ['Nunito_600SemiBold'],
        'nunito-bold': ['Nunito_700Bold'],
        'nunito-extrabold': ['Nunito_800ExtraBold'],
        'nunito-black': ['Nunito_900Black'],
      },
      borderRadius: {
        koda: '16px',
        'koda-lg': '24px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
