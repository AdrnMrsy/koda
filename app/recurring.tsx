import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Repeat, Trash2, Calendar, TrendingDown, TrendingUp } from 'lucide-react-native';

import { KodaCard } from '../components/KodaCard';
import { KodaButton } from '../components/KodaButton';
import { IconMapper } from '../components/IconMapper';
import { useTheme } from '@/context/ThemeContext';
import {
  getRecurringTransactions,
  addRecurringTransaction,
  deleteRecurringTransaction,
  getCategories,
  type RecurringTransactionWithCategory,
  type Category,
} from '@/db/database';

export default function RecurringScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [recurringList, setRecurringList] = useState<RecurringTransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setCustomDate(selectedDate.toISOString().split('T')[0]);
    }
  };
  const loadData = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        getRecurringTransactions(),
        getCategories(),
      ]);
      setRecurringList(r);
      setCategories(c);
    } catch (error) {
      console.error('Error loading recurring:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAdd() {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Oops!', 'Please enter a valid amount.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Oops!', 'Please select a category.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(customDate) || isNaN(Date.parse(customDate))) {
      Alert.alert('Oops!', 'Please enter a valid date in YYYY-MM-DD format.');
      return;
    }

    try {
      await addRecurringTransaction(
        parseFloat(amount),
        description || null,
        selectedCategory.id,
        type,
        frequency,
        customDate
      );
      
      setShowForm(false);
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setCustomDate(new Date().toISOString().split('T')[0]);
      await loadData();
    } catch (error) {
      console.error('Error adding recurring:', error);
      Alert.alert('Error', 'Failed to add recurring transaction.');
    }
  }

  async function handleDelete(id: number) {
    Alert.alert('Delete', 'Stop this recurring transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRecurringTransaction(id);
          await loadData();
        },
      },
    ]);
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <SafeAreaView className="flex-1 bg-surface-100 dark:bg-koda-dark">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center pt-2 pb-4">
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#4B4B4B'} />
          </Pressable>
          <View>
            <View className="flex-row items-center">
              <Repeat size={24} color={isDark ? '#FFFFFF' : '#4B4B4B'} style={{ marginRight: 8 }} />
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-2xl">
                Recurring
              </Text>
            </View>
            <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm mt-1">
              Manage automatic bills & income
            </Text>
          </View>
        </View>

        {/* Existing List */}
        {recurringList.length > 0 && !showForm && (
          <View className="mb-4">
            {recurringList.map((item) => (
              <KodaCard key={item.id} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${item.type === 'expense' ? 'bg-koda-red/10' : 'bg-koda-green/10'}`}>
                      <IconMapper name={item.category_icon || 'Package'} size={20} color={item.type === 'expense' ? '#FF4B4B' : '#58CC02'} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-nunito-bold text-surface-800 dark:text-white text-base">
                        {item.description || item.category_name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Calendar size={12} color="#AFAFAF" style={{ marginRight: 4 }} />
                        <Text className="font-nunito-semibold text-surface-500 dark:text-surface-300 text-xs capitalize">
                          {item.frequency} • Next: {item.next_date}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end ml-2">
                    <Text className={`font-nunito-bold text-base ${item.type === 'expense' ? 'text-surface-800 dark:text-white' : 'text-koda-green'}`}>
                      {item.type === 'expense' ? '-' : '+'}₱{item.amount.toLocaleString()}
                    </Text>
                    <Pressable onPress={() => handleDelete(item.id)} className="p-2 -mr-2 mt-1">
                      <Trash2 size={16} color="#FF4B4B" />
                    </Pressable>
                  </View>
                </View>
              </KodaCard>
            ))}
          </View>
        )}

        {recurringList.length === 0 && !showForm && (
          <KodaCard className="mb-4">
            <View className="items-center py-6">
              <Repeat size={40} color="#AFAFAF" style={{ marginBottom: 12 }} />
              <Text className="font-nunito-bold text-surface-800 dark:text-white text-base">
                No recurring items
              </Text>
              <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm mt-1 text-center">
                Set up your fixed monthly bills or{'\n'}salary to have them logged automatically.
              </Text>
            </View>
          </KodaCard>
        )}

        {/* Add Form */}
        {showForm ? (
          <KodaCard variant="elevated" className="mb-4">
            <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg mb-4">
              Add Recurring Item
            </Text>

            {/* Type Toggle */}
            <View className="flex-row mb-4 bg-surface-100 dark:bg-koda-dark rounded-koda p-1">
              <Pressable
                onPress={() => { setType('expense'); setSelectedCategory(null); }}
                className={`flex-1 py-2 rounded-koda items-center flex-row justify-center ${type === 'expense' ? 'bg-koda-red' : ''}`}
              >
                <TrendingDown size={14} color={type === 'expense' ? 'white' : '#AFAFAF'} style={{ marginRight: 6 }} />
                <Text className={`font-nunito-bold text-sm ${type === 'expense' ? 'text-white' : 'text-surface-500'}`}>Expense</Text>
              </Pressable>
              <Pressable
                onPress={() => { setType('income'); setSelectedCategory(null); }}
                className={`flex-1 py-2 rounded-koda items-center flex-row justify-center ${type === 'income' ? 'bg-koda-green' : ''}`}
              >
                <TrendingUp size={14} color={type === 'income' ? 'white' : '#AFAFAF'} style={{ marginRight: 6 }} />
                <Text className={`font-nunito-bold text-sm ${type === 'income' ? 'text-white' : 'text-surface-500'}`}>Income</Text>
              </Pressable>
            </View>

            {/* Frequency Toggle */}
            <Text className="font-nunito-semibold text-surface-800 dark:text-white text-sm mb-2">Frequency</Text>
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => setFrequency('monthly')}
                className={`flex-1 py-2 border-b-2 items-center ${frequency === 'monthly' ? 'border-koda-blue bg-koda-blue/10' : 'border-surface-200 dark:border-surface-800'}`}
              >
                <Text className={`font-nunito-bold text-sm ${frequency === 'monthly' ? 'text-koda-blue' : 'text-surface-500 dark:text-surface-300'}`}>Monthly</Text>
              </Pressable>
              <Pressable
                onPress={() => setFrequency('weekly')}
                className={`flex-1 py-2 border-b-2 items-center ${frequency === 'weekly' ? 'border-koda-blue bg-koda-blue/10' : 'border-surface-200 dark:border-surface-800'}`}
              >
                <Text className={`font-nunito-bold text-sm ${frequency === 'weekly' ? 'text-koda-blue' : 'text-surface-500 dark:text-surface-300'}`}>Weekly</Text>
              </Pressable>
            </View>

            {/* Amount Input */}
            <Text className="font-nunito-semibold text-surface-800 dark:text-white text-sm mb-2">Amount</Text>
            <View className="flex-row items-center bg-surface-100 dark:bg-koda-dark rounded-koda px-4 py-3 mb-4">
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-xl mr-2">₱</Text>
              <TextInput
                className="flex-1 font-nunito-bold text-xl text-surface-800 dark:text-white"
                placeholder="0"
                placeholderTextColor="#AFAFAF"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Description */}
            <Text className="font-nunito-semibold text-surface-800 dark:text-white text-sm mb-2">Description</Text>
            <TextInput
              className="bg-surface-100 dark:bg-koda-dark rounded-koda px-4 py-3 font-nunito text-base text-surface-800 dark:text-white mb-4"
              placeholder="e.g. My Expense/Income"
              placeholderTextColor="#AFAFAF"
              value={description}
              onChangeText={setDescription}
            />

            {/* Next Payment Date */}
            <Text className="font-nunito-semibold text-surface-800 dark:text-white text-sm mb-2">Next Payment Date</Text>
            
            {Platform.OS === 'ios' ? (
              <View className="flex-row items-center bg-surface-100 dark:bg-koda-dark rounded-koda px-4 py-2 mb-2">
                <Calendar size={18} color="#AFAFAF" style={{ marginRight: 8 }} />
                <View className="flex-1 items-start">
                  <DateTimePicker
                    value={new Date(customDate)}
                    minimumDate={new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    themeVariant={isDark ? "dark" : "light"}
                  />
                </View>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center bg-surface-100 dark:bg-koda-dark rounded-koda px-4 py-3 mb-2"
                >
                  <Calendar size={18} color="#AFAFAF" style={{ marginRight: 8 }} />
                  <Text className="flex-1 font-nunito text-base text-surface-800 dark:text-white">
                    {customDate}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(customDate)}
                    minimumDate={new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </>
            )}
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setCustomDate(today);
                }}
                className="px-3 py-1 bg-surface-250 dark:bg-koda-darker rounded-full"
              >
                <Text className="font-nunito-bold text-xs text-surface-600 dark:text-surface-350">Today</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setCustomDate(tomorrow.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 bg-surface-250 dark:bg-koda-darker rounded-full"
              >
                <Text className="font-nunito-bold text-xs text-surface-600 dark:text-surface-350">Tomorrow</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setCustomDate(nextWeek.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 bg-surface-250 dark:bg-koda-darker rounded-full"
              >
                <Text className="font-nunito-bold text-xs text-surface-600 dark:text-surface-350">In 1 Week</Text>
              </Pressable>
            </View>

            {/* Category Picker */}
            <Text className="font-nunito-semibold text-surface-800 dark:text-white text-sm mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {filteredCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-koda border-b-[2px] ${
                    selectedCategory?.id === cat.id
                      ? 'bg-koda-blue/10 border-koda-blue'
                      : 'bg-surface-100 dark:bg-koda-dark border-surface-200 dark:border-surface-800'
                  }`}
                >
                  <Text className={`font-nunito-semibold text-xs ${selectedCategory?.id === cat.id ? 'text-koda-blue' : 'text-surface-800 dark:text-white'}`}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <KodaButton title="Cancel" variant="ghost" onPress={() => setShowForm(false)} />
              </View>
              <View className="flex-1">
                <KodaButton title="Save" variant="primary" onPress={handleAdd} />
              </View>
            </View>
          </KodaCard>
        ) : (
          <KodaButton
            title="+ Add Recurring Item"
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => setShowForm(true)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
