import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { BarChart, PieChart as GiftedPieChart } from 'react-native-gifted-charts';
import { TrendingUp, TrendingDown, BarChart2, PieChart } from 'lucide-react-native';

import { IconMapper } from '../../components/IconMapper';

import { KodaCard } from '../../components/KodaCard';
import { ProgressBar } from '../../components/ProgressBar';
import { useTheme } from '@/context/ThemeContext';
import {
  getMonthlyTotals,
  getWeeklySpending,
  getCategorySpending,
  type DailySpending,
  type CategorySpending,
} from '@/db/database';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { isDark } = useTheme();
  const [monthlyTotals, setMonthlyTotals] = useState({ income: 0, expense: 0 });
  const [weeklyData, setWeeklyData] = useState<DailySpending[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [totals, weekly, categories] = await Promise.all([
        getMonthlyTotals(),
        getWeeklySpending(),
        getCategorySpending(),
      ]);
      setMonthlyTotals(totals);
      setWeeklyData(weekly);
      setCategoryData(categories);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const net = monthlyTotals.income - monthlyTotals.expense;
  const savingsRate = monthlyTotals.income > 0 ? net / monthlyTotals.income : 0;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const currentMonth = monthNames[new Date().getMonth()];

  // Bar chart data
  const barData = weeklyData.map((d) => ({
    value: d.amount,
    label: d.dayLabel,
    frontColor: d.amount > 0 ? '#FF4B4B' : (isDark ? '#4B4B4B' : '#E5E5E5'),
    topLabelComponent: () =>
      d.amount > 0 ? (
        <Text style={{ fontSize: 9, color: isDark ? '#AFAFAF' : '#4B4B4B', fontWeight: '600', marginBottom: 2 }}>
          {d.amount >= 1000 ? `${(d.amount / 1000).toFixed(1)}k` : d.amount.toString()}
        </Text>
      ) : null,
  }));

  // Pie chart data
  const pieData = categoryData.map((c) => ({
    value: c.total,
    color: c.color,
  }));

  const totalExpense = categoryData.reduce((sum, c) => sum + c.total, 0);

  return (
    <SafeAreaView className="flex-1 bg-surface-100 dark:bg-koda-dark" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-2 pb-4">
          <View className="flex-row items-center">
            <BarChart2 size={24} color={isDark ? '#FFFFFF' : '#4B4B4B'} style={{ marginRight: 8 }} />
            <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-2xl">
              Stats
            </Text>
          </View>
          <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm mt-1">
            {currentMonth} Overview
          </Text>
        </View>

        {/* Monthly Summary Cards */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <KodaCard>
              <TrendingUp size={24} color="#58CC02" style={{ marginBottom: 4 }} />
              <Text className="font-nunito-semibold text-xs text-surface-500 dark:text-surface-300">Income</Text>
              <Text className="font-nunito-extrabold text-koda-green text-lg">
                ₱{monthlyTotals.income.toLocaleString()}
              </Text>
            </KodaCard>
          </View>
          <View className="flex-1">
            <KodaCard>
              <TrendingDown size={24} color="#FF4B4B" style={{ marginBottom: 4 }} />
              <Text className="font-nunito-semibold text-xs text-surface-500 dark:text-surface-300">Expenses</Text>
              <Text className="font-nunito-extrabold text-koda-red text-lg">
                ₱{monthlyTotals.expense.toLocaleString()}
              </Text>
            </KodaCard>
          </View>
        </View>

        {/* Net / Savings */}
        <KodaCard variant={net >= 0 ? 'highlight' : 'default'} className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-nunito-semibold text-xs text-surface-500 dark:text-surface-300">
                Net {net >= 0 ? 'Savings' : 'Loss'}
              </Text>
              <Text
                className={`font-nunito-extrabold text-xl ${
                  net >= 0 ? 'text-koda-green' : 'text-koda-red'
                }`}
              >
                {net >= 0 ? '+' : ''}₱{net.toLocaleString()}
              </Text>
            </View>
            <View className="items-end">
              <Text className="font-nunito-semibold text-xs text-surface-500 dark:text-surface-300">Savings Rate</Text>
              <Text
                className={`font-nunito-extrabold text-xl ${
                  savingsRate >= 0.2 ? 'text-koda-green' : 'text-koda-orange'
                }`}
              >
                {Math.round(savingsRate * 100)}%
              </Text>
            </View>
          </View>
        </KodaCard>

        {/* Weekly Spending Bar Chart */}
        <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg mb-3">
          Weekly Spending
        </Text>
        <KodaCard className="mb-4">
          {weeklyData.some((d) => d.amount > 0) ? (
            <View className="items-center">
              <BarChart
                data={barData}
                width={screenWidth - 80}
                height={160}
                barWidth={28}
                spacing={16}
                roundedTop
                roundedBottom
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={isDark ? '#4B4B4B' : '#E5E5E5'}
                rulesColor={isDark ? '#1A1A2E' : '#F7F7F7'}
                rulesType="solid"
                yAxisTextStyle={{ fontSize: 10, color: '#AFAFAF' }}
                xAxisLabelTextStyle={{ fontSize: 10, color: '#AFAFAF', fontWeight: '600' }}
                isAnimated
                animationDuration={600}
              />
            </View>
          ) : (
            <View className="items-center py-8">
              <BarChart2 size={40} color="#AFAFAF" style={{ marginBottom: 8 }} />
              <Text className="font-nunito-bold text-surface-500 dark:text-surface-300 text-sm">
                No spending data this week
              </Text>
            </View>
          )}
        </KodaCard>

        {/* Category Pie Chart */}
        <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg mb-3">
          Spending by Category
        </Text>
        {categoryData.length > 0 ? (
          <KodaCard className="mb-4">
            <View className="items-center">
              <GiftedPieChart
                data={pieData}
                donut
                radius={90}
                innerRadius={55}
                innerCircleColor={isDark ? '#16213E' : '#FFFFFF'}
                centerLabelComponent={() => (
                  <View className="items-center">
                    <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-lg">
                      ₱{totalExpense >= 1000
                        ? `${(totalExpense / 1000).toFixed(1)}k`
                        : totalExpense.toString()}
                    </Text>
                    <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">total</Text>
                  </View>
                )}
                isAnimated
              />
            </View>

            {/* Legend */}
            <View className="mt-4">
              {categoryData.map((cat, index) => (
                <View key={cat.name} className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: cat.color }}
                    />
                    <View className="flex-row items-center">
                      <IconMapper name={cat.icon || 'Package'} size={14} color={isDark ? '#FFFFFF' : '#4B4B4B'} style={{ marginRight: 4 }} />
                      <Text className="font-nunito-semibold text-surface-800 dark:text-white text-sm">
                        {cat.name}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm">
                      ₱{cat.total.toLocaleString()}
                    </Text>
                    <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">
                      {totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </KodaCard>
        ) : (
          <KodaCard className="mb-4">
            <View className="items-center py-6">
              <PieChart size={40} color="#AFAFAF" style={{ marginBottom: 12 }} />
              <Text className="font-nunito-bold text-surface-800 dark:text-white text-base">
                No data yet
              </Text>
              <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm mt-1 text-center">
                Start logging expenses to see{'\n'}your spending breakdown!
              </Text>
            </View>
          </KodaCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
