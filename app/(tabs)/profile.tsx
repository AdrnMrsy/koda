import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Moon, Sun, Monitor, User, Palette, BrainCircuit, Trophy, CheckCircle, Star, Flame, Snowflake, Medal, Footprints, PiggyBank, Bot, Award, Download, Shield } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { IconMapper } from '../../components/IconMapper';

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
  getAllTransactions,
  type UserStats,
  type Achievement,
} from '@/db/database';

const BADGE_INFO: Record<string, { title: string; description: string; icon: string }> = {
  first_steps: {
    title: 'First Steps',
    description: 'Log your first transaction',
    icon: 'Footprints',
  },
  on_fire: {
    title: 'On Fire',
    description: '7-day streak',
    icon: 'Flame',
  },
  budget_boss: {
    title: 'Budget Boss',
    description: 'Stay under budget for a full month',
    icon: 'Trophy',
  },
  ai_whisperer: {
    title: 'AI Whisperer',
    description: 'Use 50 natural language inputs',
    icon: 'Bot',
  },
  penny_pincher: {
    title: 'Penny Pincher',
    description: 'Save 20% of income in a month',
    icon: 'PiggyBank',
  },
  century_club: {
    title: 'Century Club',
    description: '100-day streak',
    icon: 'Award',
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

  async function exportData() {
    try {
      const allTx = await getAllTransactions();
      if (allTx.length === 0) {
        alert('No transactions to export.');
        return;
      }
      
      let csvContent = "ID,Date,Type,Category,Amount,Description\n";
      allTx.forEach(tx => {
        const desc = tx.description ? `"${tx.description.replace(/"/g, '""')}"` : "";
        csvContent += `${tx.id},${tx.date},${tx.type},"${tx.category_name}",${tx.amount},${desc}\n`;
      });
      
      const fileUri = (FileSystem as any).documentDirectory + "koda_transactions.csv";
      await (FileSystem as any).writeAsStringAsync(fileUri, csvContent, { encoding: (FileSystem as any).EncodingType.UTF8 });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        alert("Sharing is not available on your device");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100 dark:bg-koda-dark" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-2 pb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <User size={24} color={isDark ? '#FFFFFF' : '#4B4B4B'} style={{ marginRight: 8 }} />
            <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-2xl">
              Profile
            </Text>
          </View>
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

        <View className="flex-row items-center mb-3">
          <Palette size={20} color={isDark ? '#FFFFFF' : '#4B4B4B'} style={{ marginRight: 8 }} />
          <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg">
            Appearance
          </Text>
        </View>
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

        <View className="flex-row items-center mb-3">
          <Shield size={20} color={isDark ? '#FFFFFF' : '#4B4B4B'} style={{ marginRight: 8 }} />
          <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg">
            Data
          </Text>
        </View>
        <KodaCard className="mb-4">
          <Pressable onPress={exportData} className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-koda-green/20 items-center justify-center mr-3">
                <Download size={20} color="#58CC02" />
              </View>
              <View>
                <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm">
                  Export CSV
                </Text>
                <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">
                  Save a copy of your transactions
                </Text>
              </View>
            </View>
          </Pressable>
        </KodaCard>

        <View className="flex-row items-center mb-3">
          <BrainCircuit size={20} color={isDark ? '#FFFFFF' : '#4B4B4B'} style={{ marginRight: 8 }} />
          <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg">
            AI Engine
          </Text>
        </View>
        <KodaCard className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-koda-purple/20 items-center justify-center mr-3">
                <Bot size={24} color="#CE82FF" />
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
              <View className="flex-row items-center">
                <Text className="font-nunito-bold text-koda-purple text-xs mr-1">
                  {stats?.ai_parsed_count ?? 0} / 50
                </Text>
                <Trophy size={12} color="#CE82FF" />
              </View>
            </View>
            <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs mt-1">
              Parse {50 - (stats?.ai_parsed_count ?? 0)} more to unlock AI Whisperer!
            </Text>
          </View>

          <View className="bg-koda-blue/5 dark:bg-koda-blue/10 rounded-koda p-3">
            <View className="flex-row items-center mb-1">
              <Bot size={16} color="#1CB0F6" style={{ marginRight: 6 }} />
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
              <Flame size={32} color="#FF9600" style={{ marginBottom: 4 }} />
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-xl">
                {stats?.streak ?? 0}
              </Text>
              <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">Day Streak</Text>
            </KodaCard>
          </View>
          <View className="flex-1">
            <KodaCard>
              <Snowflake size={32} color="#1CB0F6" style={{ marginBottom: 4 }} />
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-xl">
                {stats?.streak_freeze ?? 0}
              </Text>
              <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">Streak Freezes</Text>
            </KodaCard>
          </View>
          <View className="flex-1">
            <KodaCard>
              <Medal size={32} color="#CE82FF" style={{ marginBottom: 4 }} />
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-xl">
                {unlockedCount}
              </Text>
              <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs">Badges</Text>
            </KodaCard>
          </View>
        </View>

        {/* Achievements */}
        <View className="flex-row items-center mb-3">
          <Trophy size={20} color={isDark ? '#FFFFFF' : '#4B4B4B'} style={{ marginRight: 8 }} />
          <Text className="font-nunito-bold text-surface-800 dark:text-white text-lg">
            Achievements
          </Text>
        </View>

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
                  <View style={{ opacity: isUnlocked ? 1 : 0.3 }}>
                    <IconMapper name={info.icon} size={24} color={isUnlocked ? '#FF9600' : (isDark ? '#FFFFFF' : '#4B4B4B')} />
                  </View>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text
                      className={`font-nunito-bold text-base mr-1 ${
                        isUnlocked ? 'text-surface-800 dark:text-white' : 'text-surface-500 dark:text-surface-300'
                      }`}
                    >
                      {info.title}
                    </Text>
                    {isUnlocked && <CheckCircle size={14} color="#58CC02" />}
                  </View>
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
                  <Star size={24} color="#FFC800" fill="#FFC800" />
                )}
              </View>
            </KodaCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
