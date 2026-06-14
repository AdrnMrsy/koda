import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/context/ThemeContext';
import { generateResponse, type ChatMessage } from '@/ai/chatService';
import { ConfettiOverlay, type ConfettiRef } from '../../components/ConfettiOverlay';

export default function ChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const confettiRef = useRef<ConfettiRef>(null);
  const flashListRef = useRef<any>(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Initial greeting
  useEffect(() => {
    setMessages([
      {
        id: 'initial',
        role: 'assistant',
        text: "Hi there! I'm Koda, your finance buddy.\n\nYou can ask me things like:\n• How much did I spend this month?\n• What's my budget status?\n• Show me today's transactions\n\nOr you can log a transaction by telling me:\n• spent 500 on groceries",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Keyboard scroll handling
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flashListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      showSubscription.remove();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate a slight delay so it feels like Koda is thinking
    setTimeout(async () => {
      const response = await generateResponse(userMessage.text);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);

      if (response.action === 'transaction_logged') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        confettiRef.current?.fire();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, 600);
  };

  const renderMessage = ({ item: msg }: { item: ChatMessage }) => {
    const isUser = msg.role === 'user';

    return (
      <View
        key={msg.id}
        className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isUser && (
          <View className="w-8 h-8 rounded-full bg-koda-purple/20 items-center justify-center mr-2 mt-1 overflow-hidden">
            <Image 
              source={require('../../assets/koda.png')} 
              style={{ width: 24, height: 24 }} 
              contentFit="contain"
            />
          </View>
        )}
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-koda-green rounded-tr-sm'
              : 'bg-surface-200 dark:bg-koda-darker rounded-tl-sm'
          }`}
        >
          <Text
            className={`font-nunito-semibold text-base leading-6 ${
              isUser ? 'text-white' : 'text-surface-800 dark:text-white'
            }`}
          >
            {msg.text}
          </Text>
          <Text
            className={`font-nunito text-[10px] mt-1.5 text-right ${
              isUser ? 'text-white/70' : 'text-surface-500'
            }`}
          >
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-100 dark:bg-koda-dark" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white dark:bg-koda-darker border-b border-surface-200 dark:border-surface-800 z-10">
          <View className="w-10 h-10 rounded-full bg-koda-purple/20 items-center justify-center mr-3 overflow-hidden">
            <Image 
              source={require('../../assets/koda.png')} 
              style={{ width: 32, height: 32 }} 
              contentFit="contain"
            />
          </View>
          <View>
            <Text className="font-nunito-extrabold text-surface-800 dark:text-white text-lg">
              Koda AI
            </Text>
            <Text className="font-nunito text-koda-green text-xs font-bold">
              Online
            </Text>
          </View>
        </View>

        {/* Chat Area */}
        <View className="flex-1 px-4 pt-4">
          <FlashList
            ref={flashListRef}
            data={messages}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flashListRef.current?.scrollToEnd({ animated: true })}
            keyboardDismissMode="on-drag"
            ListFooterComponent={
              <>
                {isTyping && (
                  <View className="flex-row mb-4 justify-start">
                    <View className="w-8 h-8 rounded-full bg-koda-purple/20 items-center justify-center mr-2 mt-1 overflow-hidden">
                      <Image 
                        source={require('../../assets/koda.png')} 
                        style={{ width: 24, height: 24 }} 
                        contentFit="contain"
                      />
                    </View>
                    <View className="bg-surface-200 dark:bg-koda-darker rounded-2xl rounded-tl-sm px-4 py-3">
                      <Text className="font-nunito-semibold text-surface-800 dark:text-white">
                        Typing...
                      </Text>
                    </View>
                  </View>
                )}
                <View style={{ height: 20 }} />
              </>
            }
          />
        </View>

        {/* Input Area */}
        <View
          className="bg-white dark:bg-koda-darker px-4 py-3 border-t border-surface-200 dark:border-surface-800"
          style={{ paddingBottom: 12 }}
        >
          <View className="flex-row items-center">
            <View className="flex-1 bg-surface-100 dark:bg-koda-dark rounded-koda flex-row items-center px-4 py-2 min-h-[50px]">
              <TextInput
                className="flex-1 font-nunito text-base text-surface-800 dark:text-white py-2"
                placeholder="Message Koda..."
                placeholderTextColor="#AFAFAF"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={200}
                blurOnSubmit={false}
              />
              {input.trim().length > 0 && (
                <Pressable
                  onPress={handleSend}
                  className="w-10 h-10 rounded-full bg-koda-green items-center justify-center ml-2"
                >
                  <Send size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: -2 }} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ConfettiOverlay ref={confettiRef} />
    </SafeAreaView>
  );
}

