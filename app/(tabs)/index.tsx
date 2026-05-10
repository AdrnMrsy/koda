import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { KodaCard } from '../../components/KodaCard';
import { XPBadge } from '../../components/XPBadge';
import { StreakCounter } from '../../components/StreakCounter';
import { LevelBadge } from '../../components/LevelBadge';
import { ProgressBar } from '../../components/ProgressBar';
import { TransactionItem } from '../../components/TransactionItem';
import { ConfettiOverlay, type ConfettiRef } from '../../components/ConfettiOverlay';
import {
  getUserStats,
  getTodayTransactions,
  getMonthlyTotals,
  getDailyGoal,
  getBudgets,
  updateStreak,
  getXPForNextLevel,
  getXPForCurrentLevel,
  getLevelTitle,
  type UserStats,
  type TransactionWithCategory,
  type DailyGoal,
  type BudgetWithProgress,
} from '@/db/database';

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', emoji: '🌅' };
  if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
  return { text: 'Good evening', emoji: '🌙' };
}

export default function DashboardScreen() {
  const router = useRouter();
  const confettiRef = useRef<ConfettiRef>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState({ income: 0, expense: 0 });
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [prevGoalCompleted, setPrevGoalCompleted] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await updateStreak();
      const [s, t, m, d, b] = await Promise.all([
        getUserStats(),
        getTodayTransactions(),
        getMonthlyTotals(),
        getDailyGoal(),
        getBudgets(),
      ]);
      setStats(s);
      setTransactions(t);
      setMonthlyTotals(m);
      setDailyGoal(d);
      setBudgets(b);

      // Fire confetti when daily goal is first completed
      if (d && d.completed && !prevGoalCompleted) {
        setPrevGoalCompleted(true);
        setTimeout(() => confettiRef.current?.fire(), 300);
      }
      if (d && !d.completed) {
        setPrevGoalCompleted(false);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [prevGoalCompleted]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const greeting = getGreeting();
  const netWorth = monthlyTotals.income - monthlyTotals.expense;
  const levelProgress = stats
    ? (stats.xp - getXPForCurrentLevel(stats.level)) /
      (getXPForNextLevel(stats.level) - getXPForCurrentLevel(stats.level))
    : 0;
  const goalProgress = dailyGoal ? dailyGoal.current / dailyGoal.target : 0;

  // Show top 3 budgets on dashboard
  const topBudgets = budgets.slice(0, 3);

  return (
    <SafeAreaView className="flex-1 bg-surface-100 dark:bg-koda-dark" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#58CC02" />
        }
      >
        {/* ── Top Bar: Streak, XP, Level ── */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <StreakCounter streak={stats?.streak ?? 0} />
          <XPBadge xp={stats?.xp ?? 0} />
          <LevelBadge level={stats?.level ?? 1} />
        </View>

        {/* ── Hero Card: Net Worth ── */}
        <View className="px-5 mb-4">
          <KodaCard variant="elevated">
            <Text className="font-nunito-semibold text-surface-500 text-sm dark:text-surface-300">
              {greeting.text} {greeting.emoji}
            </Text>
            <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-3xl mt-1">
              ₱{netWorth.toLocaleString()}
            </Text>
            <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs mt-1">
              Monthly Net
            </Text>

            {/* Monthly Breakdown */}
            <View className="flex-row mt-4 gap-4">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <View className="w-2 h-2 rounded-full bg-koda-green mr-2" />
                  <Text className="font-nunito-semibold text-xs text-surface-500 dark:text-surface-300">Income</Text>
                </View>
                <Text className="font-nunito-bold text-koda-green text-base">
                  +₱{monthlyTotals.income.toLocaleString()}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <View className="w-2 h-2 rounded-full bg-koda-red mr-2" />
                  <Text className="font-nunito-semibold text-xs text-surface-500 dark:text-surface-300">Expenses</Text>
                </View>
                <Text className="font-nunito-bold text-koda-red text-base">
                  -₱{monthlyTotals.expense.toLocaleString()}
                </Text>
              </View>
            </View>
          </KodaCard>
        </View>

        {/* ── Level Progress ── */}
        <View className="px-5 mb-4">
          <KodaCard>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm">
                {getLevelTitle(stats?.level ?? 1)}
              </Text>
              <Text className="font-nunito-semibold text-koda-purple text-xs">
                {stats?.xp ?? 0} / {getXPForNextLevel(stats?.level ?? 1)} XP
              </Text>
            </View>
            <ProgressBar progress={levelProgress} variant="blue" size="sm" />
          </KodaCard>
        </View>

        {/* ── Daily Goal ── */}
        <View className="px-5 mb-4">
          <KodaCard variant={goalProgress >= 1 ? 'highlight' : 'default'}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm">
                {goalProgress >= 1 ? '🎉 Daily Goal Complete!' : '🎯 Daily Goal'}
              </Text>
              <Text className="font-nunito-semibold text-xs text-surface-500 dark:text-surface-300">
                {dailyGoal?.current ?? 0} / {dailyGoal?.target ?? 1} transactions
              </Text>
            </View>
            <ProgressBar
              progress={goalProgress}
              variant={goalProgress >= 1 ? 'green' : 'yellow'}
              size="sm"
            />
          </KodaCard>
        </View>

        {/* ── Budget Progress ── */}
        {topBudgets.length > 0 && (
          <View className="px-5 mb-4">
            <Pressable
              onPress={() => router.push('/budget')}
              className="flex-row items-center justify-between mb-3"
            >
              <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg">
                Budget Tracker
              </Text>
              <Text className="font-nunito-semibold text-koda-blue text-sm">
                See all →
              </Text>
            </Pressable>

            {topBudgets.map((budget) => (
              <KodaCard key={budget.id} className="mb-2">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="font-nunito-semibold text-surface-800 dark:text-white text-sm">
                    {budget.category_icon} {budget.category_name}
                  </Text>
                  <Text className="font-nunito-bold text-surface-800 dark:text-white text-xs">
                    ₱{budget.spent.toLocaleString()} / ₱{budget.amount_limit.toLocaleString()}
                  </Text>
                </View>
                <ProgressBar progress={budget.progress} variant="auto" size="sm" />
              </KodaCard>
            ))}
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View className="px-5 mb-4">
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/budget')}
              className="flex-1"
            >
              <KodaCard>
                <View className="items-center py-2">
                  <Text className="text-2xl mb-1">💰</Text>
                  <Text className="font-nunito-bold text-surface-800 dark:text-white text-xs">Budgets</Text>
                </View>
              </KodaCard>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/stats')}
              className="flex-1"
            >
              <KodaCard>
                <View className="items-center py-2">
                  <Text className="text-2xl mb-1">📊</Text>
                  <Text className="font-nunito-bold text-surface-800 dark:text-white text-xs">Charts</Text>
                </View>
              </KodaCard>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              className="flex-1"
            >
              <KodaCard>
                <View className="items-center py-2">
                  <Text className="text-2xl mb-1">🏆</Text>
                  <Text className="font-nunito-bold text-surface-800 dark:text-white text-xs">Badges</Text>
                </View>
              </KodaCard>
            </Pressable>
            <Pressable
              onPress={() => router.push('/chat')}
              className="flex-1"
            >
              <KodaCard className="border-koda-purple border-2" style={{ backgroundColor: 'rgba(168, 85, 200, 0.05)' }}>
                <View className="items-center py-2">
                  <Text className="text-2xl mb-1">🤖</Text>
                  <Text className="font-nunito-bold text-koda-purple text-xs">Chat</Text>
                </View>
              </KodaCard>
            </Pressable>
          </View>
        </View>

        {/* ── Today's Transactions ── */}
        <View className="px-5">
          <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg mb-3">
            Today's Activity
          </Text>
          {transactions.length === 0 ? (
            <KodaCard>
              <View className="items-center py-6">
                <Image 
                  source={require('../../assets/koda.png')} 
                  className="w-16 h-16 mb-3" 
                  resizeMode="contain"
                />
                <Text className="font-nunito-bold text-surface-800 dark:text-white text-base">
                  No transactions yet!
                </Text>
                <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm mt-1 text-center">
                  Tap the + button to log your first{'\n'}transaction and earn XP!
                </Text>
              </View>
            </KodaCard>
          ) : (
            <KodaCard>
              {transactions.map((tx, index) => (
                <React.Fragment key={tx.id}>
                  <TransactionItem transaction={tx} />
                  {index < transactions.length - 1 && (
                    <View className="h-px bg-surface-200 dark:bg-surface-800 mx-1" />
                  )}
                </React.Fragment>
              ))}
            </KodaCard>
          )}
        </View>
      </ScrollView>

      {/* Confetti Overlay */}
      <ConfettiOverlay ref={confettiRef} />
    </SafeAreaView>
  );
}
