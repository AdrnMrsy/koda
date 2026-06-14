import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertTriangle, AlertCircle, BarChart2, CheckCircle, Wallet, Target, Sparkles } from 'lucide-react-native';

import { IconMapper } from '../components/IconMapper';

import { KodaButton } from '../components/KodaButton';
import { KodaCard } from '../components/KodaCard';
import { ProgressBar } from '../components/ProgressBar';
import { useTheme } from '@/context/ThemeContext';
import {
  getCategories,
  getBudgets,
  setBudget,
  deleteBudget,
  type Category,
  type BudgetWithProgress,
} from '@/db/database';

export default function BudgetScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [amountLimit, setAmountLimit] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [b, c] = await Promise.all([
        getBudgets(),
        getCategories('expense'),
      ]);
      setBudgets(b);
      setCategories(c);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSetBudget() {
    if (!selectedCategory) {
      Alert.alert('Oops!', 'Please select a category.');
      return;
    }
    if (!amountLimit || parseFloat(amountLimit) <= 0) {
      Alert.alert('Oops!', 'Please enter a valid amount.');
      return;
    }
    try {
      await setBudget(selectedCategory.id, parseFloat(amountLimit));
      setShowForm(false);
      setSelectedCategory(null);
      setAmountLimit('');
      await loadData();
    } catch (error) {
      console.error('Error setting budget:', error);
      Alert.alert('Error', 'Failed to set budget.');
    }
  }

  async function handleDeleteBudget(budgetId: number) {
    Alert.alert('Delete Budget', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBudget(budgetId);
          await loadData();
        },
      },
    ]);
  }

  function getBudgetStatusLabel(progress: number): { text: string; color: string; icon: 'alert-triangle' | 'alert-circle' | 'bar-chart' | 'check' } {
    if (progress >= 1) return { text: 'Over Budget!', color: 'text-koda-red', icon: 'alert-triangle' };
    if (progress >= 0.8) return { text: 'Almost there', color: 'text-koda-orange', icon: 'alert-circle' };
    if (progress >= 0.5) return { text: 'On track', color: 'text-koda-yellow', icon: 'bar-chart' };
    return { text: 'Looking good', color: 'text-koda-green', icon: 'check' };
  }

  // Categories not yet budgeted
  const budgetedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id));

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount_limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallProgress = totalBudget > 0 ? totalSpent / totalBudget : 0;

  return (
    <SafeAreaView className="flex-1 bg-surface-100 dark:bg-koda-dark">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center pt-2 pb-4">
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#4B4B4B'} />
          </Pressable>
          <View>
            <View className="flex-row items-center">
              <Wallet size={24} color={isDark ? '#FFFFFF' : '#4B4B4B'} style={{ marginRight: 8 }} />
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-2xl">
                Budgets
              </Text>
            </View>
            <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm mt-1">
              Set spending limits per category
            </Text>
          </View>
        </View>

        {/* Overall Budget Summary */}
        {budgets.length > 0 && (
          <KodaCard variant={overallProgress >= 1 ? 'default' : 'highlight'} className="mb-4">
            <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm mb-1">
              Overall Budget
            </Text>
            <View className="flex-row items-baseline justify-between mb-2">
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-xl">
                ₱{totalSpent.toLocaleString()}
              </Text>
              <Text className="font-nunito-semibold text-surface-500 dark:text-surface-300 text-sm">
                of ₱{totalBudget.toLocaleString()}
              </Text>
            </View>
            <ProgressBar progress={overallProgress} variant="auto" size="md" showPercentage />
          </KodaCard>
        )}

        {/* Budget List */}
        {budgets.map((budget) => {
          const status = getBudgetStatusLabel(budget.progress);
          return (
            <Pressable
              key={budget.id}
              onLongPress={() => handleDeleteBudget(budget.id)}
            >
              <KodaCard className="mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-lg bg-surface-100 dark:bg-koda-dark items-center justify-center mr-2">
                      <IconMapper name={budget.category_icon || 'Package'} size={18} color="#71717A" />
                    </View>
                    <View>
                      <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm">
                        {budget.category_name}
                      </Text>
                      <View className="flex-row items-center mt-0.5">
                        {status.icon === 'alert-triangle' && <AlertTriangle size={12} color="#FF4B4B" style={{ marginRight: 4 }} />}
                        {status.icon === 'alert-circle' && <AlertCircle size={12} color="#FF9600" style={{ marginRight: 4 }} />}
                        {status.icon === 'bar-chart' && <BarChart2 size={12} color="#FFC800" style={{ marginRight: 4 }} />}
                        {status.icon === 'check' && <CheckCircle size={12} color="#58CC02" style={{ marginRight: 4 }} />}
                        <Text className={`font-nunito-semibold text-xs ${status.color}`}>
                          {status.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm">
                      ₱{budget.spent.toLocaleString()}
                    </Text>
                    <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">
                      of ₱{budget.amount_limit.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <ProgressBar progress={budget.progress} variant="auto" size="sm" />
              </KodaCard>
            </Pressable>
          );
        })}

        {budgets.length === 0 && !showForm && (
          <KodaCard className="mb-4">
            <View className="items-center py-6">
              <Target size={40} color="#AFAFAF" style={{ marginBottom: 12 }} />
              <Text className="font-nunito-bold text-surface-800 dark:text-white text-base">
                No budgets set
              </Text>
              <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm mt-1 text-center">
                Set spending limits to stay on{'\n'}track and earn the Budget Boss badge!
              </Text>
            </View>
          </KodaCard>
        )}

        {/* Add Budget Form */}
        {showForm ? (
          <KodaCard variant="elevated" className="mb-4">
            <View className="flex-row items-center mb-3">
              <Sparkles size={20} color={isDark ? '#FFFFFF' : '#4B4B4B'} style={{ marginRight: 6 }} />
              <Text className="font-nunito-bold text-surface-800 dark:text-white text-base">
                New Budget
              </Text>
            </View>

            <Text className="font-nunito-semibold text-surface-800 dark:text-white text-sm mb-2">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {availableCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-koda border-b-[3px] ${
                    selectedCategory?.id === cat.id
                      ? 'bg-koda-blue/10 border-koda-blue'
                      : 'bg-surface-100 dark:bg-koda-dark border-surface-200 dark:border-surface-800'
                  }`}
                >
                  <View className="flex-row items-center">
                    <IconMapper 
                      name={cat.icon || 'Package'} 
                      size={14} 
                      color={selectedCategory?.id === cat.id ? '#1CB0F6' : (isDark ? '#FFFFFF' : '#4B4B4B')} 
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      className={`font-nunito-semibold text-xs ${
                        selectedCategory?.id === cat.id ? 'text-koda-blue' : 'text-surface-800 dark:text-white'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </View>
                </Pressable>
              ))}
              {availableCategories.length === 0 && (
                <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm">
                  All categories have budgets!
                </Text>
              )}
            </View>

            <Text className="font-nunito-semibold text-surface-800 dark:text-white text-sm mb-2">
              Monthly Limit
            </Text>
            <View className="flex-row items-center bg-surface-100 dark:bg-koda-dark rounded-koda px-4 py-3 mb-4">
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-xl mr-2">₱</Text>
              <TextInput
                className="flex-1 font-nunito-bold text-xl text-surface-800 dark:text-white"
                placeholder="0"
                placeholderTextColor="#AFAFAF"
                keyboardType="decimal-pad"
                value={amountLimit}
                onChangeText={setAmountLimit}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <KodaButton
                  title="Cancel"
                  variant="ghost"
                  size="md"
                  fullWidth
                  onPress={() => {
                    setShowForm(false);
                    setSelectedCategory(null);
                    setAmountLimit('');
                  }}
                />
              </View>
              <View className="flex-1">
                <KodaButton
                  title="Set Budget (+20 XP)"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={handleSetBudget}
                />
              </View>
            </View>
          </KodaCard>
        ) : (
          <KodaButton
            title="+ Set New Budget"
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => setShowForm(true)}
          />
        )}

        <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs text-center mt-4">
          Long press a budget to delete it
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
