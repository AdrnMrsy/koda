import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { ArrowLeft, Search, FilterX } from 'lucide-react-native';

import { TransactionItem } from '../components/TransactionItem';
import { KodaCard } from '../components/KodaCard';
import { useTheme } from '@/context/ThemeContext';
import {
  getTransactionsPaginated,
  getCategories,
  type TransactionWithCategory,
  type Category,
} from '@/db/database';

const PAGE_SIZE = 20;

export default function HistoryScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCategories();
    loadTransactions(0, true);
  }, [typeFilter, categoryFilter]);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      loadTransactions(0, true);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  async function loadCategories() {
    const cats = await getCategories();
    setCategories(cats);
  }

  async function loadTransactions(newOffset: number, reset: boolean = false) {
    if (isLoading || (!hasMore && !reset)) return;
    setIsLoading(true);

    try {
      const data = await getTransactionsPaginated(newOffset, PAGE_SIZE, typeFilter, categoryFilter);
      
      // Client-side search for description since sqlite LIKE can be tricky with natural language
      let filteredData = data;
      if (searchQuery.trim()) {
        const lowerQ = searchQuery.toLowerCase();
        filteredData = data.filter(
          (tx) => 
            tx.description?.toLowerCase().includes(lowerQ) || 
            tx.category_name.toLowerCase().includes(lowerQ) ||
            tx.amount.toString().includes(lowerQ)
        );
      }

      if (reset) {
        setTransactions(filteredData);
      } else {
        setTransactions((prev) => [...prev, ...filteredData]);
      }

      setHasMore(data.length === PAGE_SIZE);
      setOffset(newOffset + PAGE_SIZE);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function renderHeader() {
    return (
      <View className="mb-4">
        {/* Search */}
        <View className="flex-row items-center bg-white dark:bg-koda-darker rounded-koda px-4 py-2 mb-3">
          <Search size={18} color="#AFAFAF" />
          <TextInput
            className="flex-1 font-nunito text-base text-surface-800 dark:text-white ml-2 py-2"
            placeholder="Search transactions..."
            placeholderTextColor="#AFAFAF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Type Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <Pressable
            onPress={() => setTypeFilter(null)}
            className={`px-4 py-1.5 rounded-full mr-2 ${
              typeFilter === null ? 'bg-koda-purple' : 'bg-surface-200 dark:bg-surface-800'
            }`}
          >
            <Text className={`font-nunito-bold text-xs ${typeFilter === null ? 'text-white' : 'text-surface-600 dark:text-surface-400'}`}>All</Text>
          </Pressable>
          <Pressable
            onPress={() => setTypeFilter('expense')}
            className={`px-4 py-1.5 rounded-full mr-2 ${
              typeFilter === 'expense' ? 'bg-koda-red' : 'bg-surface-200 dark:bg-surface-800'
            }`}
          >
            <Text className={`font-nunito-bold text-xs ${typeFilter === 'expense' ? 'text-white' : 'text-surface-600 dark:text-surface-400'}`}>Expense</Text>
          </Pressable>
          <Pressable
            onPress={() => setTypeFilter('income')}
            className={`px-4 py-1.5 rounded-full mr-2 ${
              typeFilter === 'income' ? 'bg-koda-green' : 'bg-surface-200 dark:bg-surface-800'
            }`}
          >
            <Text className={`font-nunito-bold text-xs ${typeFilter === 'income' ? 'text-white' : 'text-surface-600 dark:text-surface-400'}`}>Income</Text>
          </Pressable>
        </ScrollView>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categoryFilter !== null && (
            <Pressable
              onPress={() => setCategoryFilter(null)}
              className="px-3 py-1.5 rounded-full mr-2 bg-koda-red/10 flex-row items-center"
            >
              <FilterX size={12} color="#FF4B4B" style={{ marginRight: 4 }} />
              <Text className="font-nunito-bold text-xs text-koda-red">Clear</Text>
            </Pressable>
          )}
          {categories
            .filter((c) => !typeFilter || c.type === typeFilter)
            .map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full mr-2 border ${
                categoryFilter === cat.id
                  ? 'bg-koda-blue/10 border-koda-blue'
                  : 'bg-transparent border-surface-200 dark:border-surface-800'
              }`}
            >
              <Text className={`font-nunito-semibold text-xs ${categoryFilter === cat.id ? 'text-koda-blue' : 'text-surface-600 dark:text-surface-400'}`}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100 dark:bg-koda-dark">
      <View className="flex-row items-center pt-2 pb-4 px-5">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#4B4B4B'} />
        </Pressable>
        <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-2xl">
          History
        </Text>
      </View>

      <View className="flex-1 px-5">
        <FlashList
          data={transactions}
          renderItem={({ item, index }) => (
            <KodaCard className="mb-2">
              <TransactionItem transaction={item} />
            </KodaCard>
          )}
          //estimatedItemSize={70}
          ListHeaderComponent={renderHeader()}
          onEndReached={() => loadTransactions(offset)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#58CC02" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center py-10">
                <Text className="font-nunito-bold text-surface-500 dark:text-surface-300 text-base">
                  No transactions found
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
