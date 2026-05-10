import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Moon, Sun, Monitor } from 'lucide-react-native';

import { KodaCard } from '../../components/KodaCard';
import { ProgressBar } from '../../components/ProgressBar';
import { XPBadge } from '../../components/XPBadge';
import { StreakCounter } from '../../components/StreakCounter';
import { useTheme } from '@/context/ThemeContext';
import {
  getUserStats,
  getAchievements,
  getLevelTitle,
  getXPForNextLevel,
  getXPForCurrentLevel,
  type UserStats,
  type Achievement,
} from '@/db/database';

const BADGE_INFO: Record<string, { title: string; description: string; icon: string }> = {
  first_steps: {
    title: 'First Steps',
    description: 'Log your first transaction',
    icon: '🐾',
  },
  on_fire: {
    title: 'On Fire',
    description: '7-day streak',
    icon: '🔥',
  },
  budget_boss: {
    title: 'Budget Boss',
    description: 'Stay under budget for a full month',
    icon: '🏆',
  },
  ai_whisperer: {
    title: 'AI Whisperer',
    description: 'Use 50 natural language inputs',
    icon: '🤖',
  },
  penny_pincher: {
    title: 'Penny Pincher',
    description: 'Save 20% of income in a month',
    icon: '🐷',
  },
  century_club: {
    title: 'Century Club',
    description: '100-day streak',
    icon: '💯',
  },
};

export default function ProfileScreen() {
  const { theme, isDark, setTheme } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([getUserStats(), getAchievements()]);
      setStats(s);
      setAchievements(a);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const levelProgress = stats
    ? (stats.xp - getXPForCurrentLevel(stats.level)) /
      (getXPForNextLevel(stats.level) - getXPForCurrentLevel(stats.level))
    : 0;

  const unlockedCount = achievements.filter((a) => a.unlocked_at).length;

  return (
    <SafeAreaView className="flex-1 bg-surface-100 dark:bg-koda-dark" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-2 pb-4 flex-row items-center justify-between">
          <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-2xl">
            👤 Profile
          </Text>
        </View>

        {/* Mascot & Level Card */}
        <KodaCard variant="elevated" className="mb-4 items-center">
          <Image 
            source={require('../../assets/koda.png')} 
            className="w-24 h-24 mb-2" 
            resizeMode="contain"
          />
          <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-xl">
            {getLevelTitle(stats?.level ?? 1)}
          </Text>
          <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm mt-1">
            Level {stats?.level ?? 1}
          </Text>

          {/* Stats Row */}
          <View className="flex-row items-center gap-4 mt-4">
            <StreakCounter streak={stats?.streak ?? 0} size="lg" />
            <XPBadge xp={stats?.xp ?? 0} size="lg" />
          </View>

          {/* Level Progress */}
          <View className="w-full mt-4">
            <ProgressBar
              progress={levelProgress}
              variant="blue"
              size="md"
              label={`Next: Level ${(stats?.level ?? 1) + 1}`}
              showPercentage
            />
          </View>
        </KodaCard>

        {/* Theme Settings */}
        <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg mb-3">
          🎨 Appearance
        </Text>
        <KodaCard className="mb-4">
          <View className="flex-row gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTheme(t)}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-koda border-b-[3px] ${
                  theme === t
                    ? 'bg-koda-green/10 border-koda-green'
                    : 'bg-surface-100 dark:bg-koda-dark border-surface-200 dark:border-surface-800'
                }`}
              >
                {t === 'light' && <Sun size={16} color={theme === 'light' ? '#58CC02' : '#AFAFAF'} />}
                {t === 'dark' && <Moon size={16} color={theme === 'dark' ? '#58CC02' : '#AFAFAF'} />}
                {t === 'system' && <Monitor size={16} color={theme === 'system' ? '#58CC02' : '#AFAFAF'} />}
                <Text
                  className={`font-nunito-bold text-xs ml-2 capitalize ${
                    theme === t ? 'text-koda-green' : 'text-surface-500'
                  }`}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </KodaCard>

        {/* AI Engine */}
        <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg mb-3">
          🧠 AI Engine
        </Text>
        <KodaCard className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-koda-purple/20 items-center justify-center mr-3">
                <Text className="text-xl">🤖</Text>
              </View>
              <View>
                <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm">
                  Smart Parser
                </Text>
                <Text className="font-nunito text-koda-green text-xs">Active</Text>
              </View>
            </View>
            <View className="bg-koda-green/10 rounded-pill px-3 py-1">
              <Text className="font-nunito-bold text-koda-green text-xs">Tier 1</Text>
            </View>
          </View>

          <View className="bg-surface-100 dark:bg-koda-dark rounded-koda p-3 mb-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-nunito-semibold text-surface-800 dark:text-white text-xs">
                AI Transactions
              </Text>
              <Text className="font-nunito-bold text-koda-purple text-xs">
                {stats?.ai_parsed_count ?? 0} / 50 🏆
              </Text>
            </View>
            <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs mt-1">
              Parse {50 - (stats?.ai_parsed_count ?? 0)} more to unlock AI Whisperer!
            </Text>
          </View>

          <View className="bg-koda-blue/5 dark:bg-koda-blue/10 rounded-koda p-3">
            <View className="flex-row items-center mb-1">
              <Text className="text-sm mr-2">🦙</Text>
              <Text className="font-nunito-bold text-koda-blue text-xs">
                Llama 3.2 1B — Coming Soon
              </Text>
            </View>
            <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">
              On-device LLM for complex parsing. Requires a development build.
            </Text>
          </View>
        </KodaCard>

        {/* Quick Stats */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <KodaCard>
              <Text className="text-2xl mb-1">🔥</Text>
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-xl">
                {stats?.streak ?? 0}
              </Text>
              <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">Day Streak</Text>
            </KodaCard>
          </View>
          <View className="flex-1">
            <KodaCard>
              <Text className="text-2xl mb-1">❄️</Text>
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-xl">
                {stats?.streak_freeze ?? 0}
              </Text>
              <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">Streak Freezes</Text>
            </KodaCard>
          </View>
          <View className="flex-1">
            <KodaCard>
              <Text className="text-2xl mb-1">🏅</Text>
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-xl">
                {unlockedCount}
              </Text>
              <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">Badges</Text>
            </KodaCard>
          </View>
        </View>

        {/* Achievements */}
        <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg mb-3">
          🏆 Achievements
        </Text>

        {achievements.map((achievement) => {
          const info = BADGE_INFO[achievement.badge_key];
          if (!info) return null;
          const isUnlocked = !!achievement.unlocked_at;

          return (
            <KodaCard
              key={achievement.id}
              variant={isUnlocked ? 'highlight' : 'default'}
              className="mb-3"
            >
              <View className="flex-row items-center">
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${
                    isUnlocked ? 'bg-koda-yellow/30' : 'bg-surface-200 dark:bg-koda-dark'
                  }`}
                >
                  <Text className={`text-2xl ${isUnlocked ? '' : 'opacity-30'}`}>
                    {info.icon}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-nunito-bold text-base ${
                      isUnlocked ? 'text-surface-800 dark:text-white' : 'text-surface-500 dark:text-surface-300'
                    }`}
                  >
                    {info.title}
                    {isUnlocked && ' ✅'}
                  </Text>
                  <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs mt-0.5">
                    {info.description}
                  </Text>
                  {!isUnlocked && achievement.progress > 0 && (
                    <View className="mt-2">
                      <ProgressBar
                        progress={achievement.progress}
                        variant="yellow"
                        size="sm"
                        showPercentage
                      />
                    </View>
                  )}
                </View>
                {isUnlocked && (
                  <Text className="font-nunito-black text-koda-yellow text-lg">🌟</Text>
                )}
              </View>
            </KodaCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
