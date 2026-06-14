import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { TransactionWithCategory } from '@/db/database';

import { IconMapper } from './IconMapper';

interface TransactionItemProps {
  transaction: TransactionWithCategory;
  onPress?: () => void;
}

export const TransactionItem = React.memo(function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-koda-green' : 'text-koda-red';
  const amountPrefix = isIncome ? '+' : '-';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 px-1 active:bg-surface-100 dark:active:bg-koda-dark rounded-koda"
    >
      <View className="w-11 h-11 rounded-xl bg-surface-100 dark:bg-koda-dark items-center justify-center mr-3">
        <IconMapper name={transaction.category_icon || 'Package'} size={20} color="#71717A" />
      </View>
      <View className="flex-1 mr-3">
        <Text className="font-nunito-bold text-surface-800 dark:text-white text-base" numberOfLines={1}>
          {transaction.description || transaction.category_name}
        </Text>
        <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs mt-0.5">
          {transaction.category_name}
        </Text>
      </View>
      <Text className={`font-nunito-extrabold text-base ${amountColor}`}>
        {amountPrefix}₱{Math.abs(transaction.amount).toLocaleString()}
      </Text>
    </Pressable>
  );
});
