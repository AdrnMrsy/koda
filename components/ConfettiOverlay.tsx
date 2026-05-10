import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

export interface ConfettiRef {
  fire: () => void;
}

export const ConfettiOverlay = forwardRef<ConfettiRef>(function ConfettiOverlay(_, ref) {
  const confettiRef = useRef<ConfettiCannon | null>(null);

  useImperativeHandle(ref, () => ({
    fire: () => {
      confettiRef.current?.start();
    },
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ConfettiCannon
        ref={confettiRef}
        count={80}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut
        fallSpeed={3000}
        explosionSpeed={350}
        colors={['#58CC02', '#1CB0F6', '#CE82FF', '#FFC800', '#FF4B4B', '#FF9600']}
      />
    </View>
  );
});
