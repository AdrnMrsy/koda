import React from 'react';
import { View, Text } from 'react-native';
import { KodaButton } from './KodaButton';

interface BrankasConnectButtonProps {
  onAccountConnected?: (statementId: string) => void;
}

export const BrankasConnectButton = ({ onAccountConnected }: BrankasConnectButtonProps) => {
  return (
    <View className="items-center justify-center py-4">
      <KodaButton
        title="Connect Bank (Coming Soon)"
        onPress={() => {}}
        disabled={true}
      />
      <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs mt-3 text-center">
        Automatic bank syncing is currently under development. Please add transactions manually for now.
      </Text>
    </View>
  );
};
