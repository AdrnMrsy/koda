import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';

import { KodaButton } from '../../components/KodaButton';
import { KodaCard } from '../../components/KodaCard';
import { ConfettiOverlay, type ConfettiRef } from '../../components/ConfettiOverlay';
import { IconMapper } from '../../components/IconMapper';
import { useTheme } from '@/context/ThemeContext';
import { PartyPopper, Sparkles, TrendingDown, TrendingUp, Bot } from 'lucide-react-native';
import {
  getCategories,
  addTransaction,
  type Category,
} from '@/db/database';
import { parseTransaction, isNaturalLanguageInput, type ParsedTransaction } from '@/ai/smartParser';

type TransactionType = 'expense' | 'income';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const confettiRef = useRef<ConfettiRef>(null);
  const aiGlowAnim = useRef(new Animated.Value(0)).current;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  // AI Input
  const [aiInput, setAiInput] = useState('');
  const [aiResult, setAiResult] = useState<ParsedTransaction | null>(null);
  const [isAiParsed, setIsAiParsed] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [type]);

  // Glow animation for AI badge
  useEffect(() => {
    if (isAiParsed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(aiGlowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(aiGlowAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      aiGlowAnim.setValue(0);
    }
  }, [isAiParsed]);

  async function loadCategories() {
    const cats = await getCategories(type);
    setCategories(cats);
    if (!isAiParsed) {
      setSelectedCategory(null);
    }
  }

  function handleAiParse() {
    if (!aiInput.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = parseTransaction(aiInput);
    setAiResult(result);

    // Auto-fill fields
    if (result.amount) {
      setAmount(result.amount.toString());
    }

    if (result.type) {
      setType(result.type);
    }

    if (result.description) {
      setDescription(result.description);
    }

    // Match category by name
    if (result.categoryName) {
      // We need to reload categories for the detected type first
      getCategories(result.type).then((cats) => {
        setCategories(cats);
        const matched = cats.find(
          (c) => c.name.toLowerCase() === result.categoryName!.toLowerCase()
        );
        if (matched) {
          setSelectedCategory(matched);
        }
      });
    }

    setIsAiParsed(true);

    // Haptic feedback based on confidence
    if (result.confidence >= 0.7) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function clearAiParse() {
    setAiInput('');
    setAiResult(null);
    setIsAiParsed(false);
    setAmount('');
    setDescription('');
    setSelectedCategory(null);
  }

  async function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Oops!', 'Please enter a valid amount.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Oops!', 'Please select a category.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await addTransaction(
        parseFloat(amount),
        description || null,
        today,
        selectedCategory.id,
        type,
        isAiParsed
      );

      const xp = isAiParsed ? 15 : 10;
      setXpEarned(xp);
      confettiRef.current?.fire();
      setTimeout(() => {
        setXpEarned(null);
        clearAiParse();
        router.navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction.');
    }
  }

  function getConfidenceLabel(confidence: number): { text: string; color: string } {
    if (confidence >= 0.8) return { text: 'High confidence', color: 'text-koda-green' };
    if (confidence >= 0.5) return { text: 'Medium confidence', color: 'text-koda-yellow' };
    return { text: 'Low confidence', color: 'text-koda-orange' };
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100 dark:bg-koda-dark" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
      >
        {/* XP Earned Overlay */}
        {xpEarned !== null && (
          <View className="absolute top-0 left-0 right-0 bottom-0 z-50 items-center justify-center bg-black/30">
            <View className="bg-white dark:bg-koda-darker rounded-koda-lg p-8 items-center mx-10">
              <PartyPopper size={48} color="#58CC02" style={{ marginBottom: 12 }} />
              <Text className="font-nunito-extrabold text-koda-green text-2xl">
                +{xpEarned} XP
              </Text>
              <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm mt-2">
                {isAiParsed ? 'AI-Parsed Transaction!' : 'Transaction logged!'}
              </Text>
            </View>
          </View>
        )}

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="pt-2 pb-4">
            <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-2xl">
              Add Transaction
            </Text>
            <Text className="font-nunito text-surface-500 dark:text-surface-300 text-sm mt-1">
              Type naturally or fill manually

            </Text>
          </View>

          {/* ── AI Input Bar ── */}
          <KodaCard variant="elevated" className="mb-4">
            <View className="flex-row items-center mb-2">
              <Image 
                source={require('../../assets/koda.png')} 
                className="w-6 h-6 mr-2" 
                resizeMode="contain"
              />
              <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm flex-1">
                Tell Koda what you spent...
              </Text>
              {isAiParsed && (
                <Animated.View
                  style={{ opacity: aiGlowAnim }}
                  className="bg-koda-purple/20 rounded-pill px-2 py-0.5 flex-row items-center"
                >
                  <Bot size={12} color="#CE82FF" style={{ marginRight: 4 }} />
                  <Text className="font-nunito-bold text-koda-purple text-xs">
                    AI Parsed
                  </Text>
                </Animated.View>
              )}
            </View>

            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 bg-surface-100 dark:bg-koda-dark rounded-koda px-4 py-3 font-nunito text-base text-surface-800 dark:text-white"
                placeholder='e.g. "spent 500 on groceries at SM"'
                placeholderTextColor="#AFAFAF"
                value={aiInput}
                onChangeText={(text) => {
                  setAiInput(text);
                  if (isAiParsed) setIsAiParsed(false);
                }}
                onSubmitEditing={handleAiParse}
                returnKeyType="go"
              />
              <Pressable
                onPress={handleAiParse}
                className="bg-koda-purple rounded-koda px-4 py-3 border-b-[3px] border-[#A855C8] active:translate-y-[1px]"
              >
                <Text className="font-nunito-bold text-white text-sm">Parse</Text>
              </Pressable>
            </View>

            {/* AI Result Feedback */}
            {aiResult && isAiParsed && (
              <View className="mt-3 bg-surface-100 dark:bg-koda-dark rounded-koda p-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-nunito-semibold text-surface-800 dark:text-white text-xs">
                    Parsed Result
                  </Text>
                  <Text className={`font-nunito-bold text-xs ${getConfidenceLabel(aiResult.confidence).color}`}>
                    {getConfidenceLabel(aiResult.confidence).text} ({Math.round(aiResult.confidence * 100)}%)
                  </Text>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {aiResult.amount && (
                    <View className="bg-koda-green/10 rounded-pill px-2.5 py-1">
                      <Text className="font-nunito-bold text-koda-green text-xs">
                        ₱{aiResult.amount.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  <View className={`rounded-pill px-2.5 py-1 ${aiResult.type === 'expense' ? 'bg-koda-red/10' : 'bg-koda-green/10'}`}>
                    <Text className={`font-nunito-bold text-xs flex-row items-center ${aiResult.type === 'expense' ? 'text-koda-red' : 'text-koda-green'}`}>
                      {aiResult.type === 'expense' ? 'Expense' : 'Income'}
                    </Text>
                  </View>
                  {aiResult.categoryName && (
                    <View className="bg-koda-blue/10 rounded-pill px-2.5 py-1">
                      <Text className="font-nunito-bold text-koda-blue text-xs">
                        {aiResult.categoryName}
                      </Text>
                    </View>
                  )}
                  {aiResult.description && (
                    <View className="bg-koda-purple/10 rounded-pill px-2.5 py-1">
                      <Text className="font-nunito-bold text-koda-purple text-xs">
                        {aiResult.description}
                      </Text>
                    </View>
                  )}
                </View>

                <Pressable onPress={clearAiParse} className="mt-2">
                  <Text className="font-nunito text-surface-500 text-xs text-center">
                    Tap to clear and try again
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Quick examples */}
            {!isAiParsed && !aiInput && (
              <View className="mt-2">
                <Text className="font-nunito text-surface-500 dark:text-surface-300 text-xs mb-1.5">
                  Try these:
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {['spent 500 on groceries', '100 grab', 'earned 2000 salary', 'jollibee 250'].map((example) => (
                    <Pressable
                      key={example}
                      onPress={() => {
                        setAiInput(example);
                        Haptics.selectionAsync();
                      }}
                      className="bg-surface-100 dark:bg-koda-dark rounded-pill px-2.5 py-1"
                    >
                      <Text className="font-nunito text-surface-500 text-xs">{example}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </KodaCard>

          {/* ── Divider ── */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-px bg-surface-200 dark:bg-surface-800" />
            <Text className="font-nunito-bold text-surface-500 text-xs mx-3">
              {isAiParsed ? 'Review & Edit' : 'OR fill manually'}
            </Text>
            <View className="flex-1 h-px bg-surface-200 dark:bg-surface-800" />
          </View>

          {/* Type Toggle */}
          <View className="flex-row mb-5 bg-white dark:bg-koda-darker rounded-koda p-1 border-b-[4px] border-surface-200 dark:border-surface-800">
            <Pressable
              onPress={() => setType('expense')}
              className={`flex-1 py-3 rounded-koda items-center ${
                type === 'expense' ? 'bg-koda-red' : ''
              }`}
            >
              <View className="flex-row items-center">
                <TrendingDown size={16} color={type === 'expense' ? 'white' : '#AFAFAF'} style={{ marginRight: 6 }} />
                <Text
                  className={`font-nunito-bold text-sm ${
                    type === 'expense' ? 'text-white' : 'text-surface-500 dark:text-surface-300'
                  }`}
                >
                  Expense
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setType('income')}
              className={`flex-1 py-3 rounded-koda items-center ${
                type === 'income' ? 'bg-koda-green' : ''
              }`}
            >
              <View className="flex-row items-center">
                <TrendingUp size={16} color={type === 'income' ? 'white' : '#AFAFAF'} style={{ marginRight: 6 }} />
                <Text
                  className={`font-nunito-bold text-sm ${
                    type === 'income' ? 'text-white' : 'text-surface-500 dark:text-surface-300'
                  }`}
                >
                  Income
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Amount Input */}
          <KodaCard className="mb-4">
            <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm mb-2">Amount</Text>
            <View className="flex-row items-center">
              <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-3xl mr-2">₱</Text>
              <TextInput
                className="flex-1 font-nunito-extrabold text-3xl text-surface-800 dark:text-white"
                placeholder="0"
                placeholderTextColor="#AFAFAF"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </KodaCard>

          {/* Description */}
          <KodaCard className="mb-4">
            <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm mb-2">
              Description (optional)
            </Text>
            <TextInput
              className="font-nunito text-base text-surface-800 dark:text-white"
              placeholder="e.g. Lunch at Jollibee"
              placeholderTextColor="#AFAFAF"
              value={description}
              onChangeText={setDescription}
            />
          </KodaCard>

          {/* Category Picker */}
          <Text className="font-nunito-bold text-surface-800 dark:text-white text-sm mb-3 px-1">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  setSelectedCategory(cat);
                  Haptics.selectionAsync();
                }}
                className={`px-4 py-2.5 rounded-koda border-b-[3px] ${
                  selectedCategory?.id === cat.id
                    ? type === 'expense'
                      ? 'bg-koda-red/10 border-koda-red'
                      : 'bg-koda-green/10 border-koda-green'
                    : 'bg-white dark:bg-koda-darker border-surface-200 dark:border-surface-800'
                }`}
              >
                <View className="flex-row items-center">
                  <IconMapper 
                    name={cat.icon || 'Package'} 
                    size={14} 
                    color={
                      selectedCategory?.id === cat.id
                        ? type === 'expense'
                          ? '#FF4B4B'
                          : '#58CC02'
                        : isDark ? '#FFFFFF' : '#4B4B4B'
                    } 
                    style={{ marginRight: 6 }} 
                  />
                  <Text
                    className={`font-nunito-semibold text-sm ${
                      selectedCategory?.id === cat.id
                        ? type === 'expense'
                          ? 'text-koda-red'
                          : 'text-koda-green'
                        : 'text-surface-800 dark:text-white'
                    }`}
                  >
                    {cat.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Submit Button */}
          <KodaButton
            title={`Log ${type === 'expense' ? 'Expense' : 'Income'} (+${isAiParsed ? '15' : '10'} XP)`}
            variant={type === 'expense' ? 'danger' : 'primary'}
            size="lg"
            fullWidth
            onPress={handleSubmit}
          />

          {isAiParsed && (
            <View className="flex-row items-center justify-center mt-2">
              <Bot size={12} color="#A855C8" style={{ marginRight: 4 }} />
              <Text className="font-nunito text-koda-purple text-xs">
                +5 bonus XP for using AI input!
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confetti */}
      <ConfettiOverlay ref={confettiRef} />
    </SafeAreaView>
  );
}
