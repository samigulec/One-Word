import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ContentItem, ChatMessage } from '../types';
import { getTranslation, LanguageCode, LANGUAGES } from '../utils/translations';
import { getTranslation as getContentTranslation } from '../utils/contentLoader';
import {
  getAIResponse,
  createUserMessage,
  getInitialGreeting,
  getQuickReplyOptions,
} from '../services/aiChat';
import { addXP, completeDailyTask, getFeedbackIntensity } from '../utils/storage';
import { FeedbackIntensity } from '../types';

const { width } = Dimensions.get('window');

type ChatScreenProps = {
  word: ContentItem;
  onNavigateBack: () => void;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  // Secilen senaryo ID'si (cafe, travel, vb.) -- PracticeScreen'den gelir
  scenario?: string;
};

// Bouncing dots typing indicator
const BouncingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: -6, duration: 280, delay, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true }),
        ])
      );
    };

    Animated.parallel([
      createBounce(dot1, 0),
      createBounce(dot2, 120),
      createBounce(dot3, 240),
    ]).start();
  }, []);

  return (
    <View style={dotStyles.container}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[dotStyles.dot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
};

const dotStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    height: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#A78BFA',
    marginHorizontal: 2.5,
  },
});

// Zaman formatci
const formatTime = (date: Date): string => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Mesaj sayaci - kac mesaj gonderildi
const MessageCounter: React.FC<{ count: number; label: string }> = ({ count, label }) => {
  if (count < 2) return null;
  return (
    <View style={counterStyles.container}>
      <Text style={counterStyles.text}>{count - 1} {label}</Text>
    </View>
  );
};

const counterStyles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 8,
  },
  text: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '500',
  },
});

// Animated message component - zaman damgasi eklendi
const AnimatedMessage: React.FC<{ item: ChatMessage; index: number; isLast: boolean }> = ({ item, index, isLast }) => {
  const isUser = item.role === 'user';
  const slideAnim = useRef(new Animated.Value(isUser ? 30 : -30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        {
          opacity: opacityAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {!isUser && (
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.avatarContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarEmoji}>{'\u{1F916}'}</Text>
          </LinearGradient>
          {/* Ilk AI mesajinda "Lingo" etiketi goster */}
          {index === 0 && (
            <Text style={styles.avatarLabel}>Lingo</Text>
          )}
        </View>
      )}
      <View style={{ maxWidth: '78%' }}>
        {isUser ? (
          <LinearGradient
            colors={['#6366F1', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.messageBubble, styles.userBubble]}
          >
            <Text style={[styles.messageText, styles.userMessageText]}>
              {item.content}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <Text style={[styles.messageText, styles.aiMessageText]}>
              {item.content}
            </Text>
          </View>
        )}
        {/* Zaman damgasi - sadece son mesajda veya kullanici mesajlarinda goster */}
        {(isLast || isUser) && (
          <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
            {formatTime(item.timestamp)}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const ChatScreen: React.FC<ChatScreenProps> = ({ word, onNavigateBack, nativeLanguage, targetLanguage, scenario }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  // Chat XP: chat_started 1 kez, chat_message_sent gunluk limitli (storage'da kontrol edilir)
  const chatStartedRef = useRef(false);

  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);

  const sendButtonScale = useRef(new Animated.Value(1)).current;

  // Hedef dil bayragi
  const targetFlag = LANGUAGES.find(l => l.code === targetLanguage)?.flag || '';

  useEffect(() => {
    const wordTranslation = getContentTranslation(word, nativeLanguage);
    // Senaryo bilgisini baslangic selamlamasina aktariyoruz
    const greeting = getInitialGreeting(word, nativeLanguage, targetLanguage, wordTranslation, scenario);
    setMessages([greeting]);
    setMessageCount(0);
  }, [word, nativeLanguage, targetLanguage, scenario]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.spring(sendButtonScale, { toValue: 0.85, useNativeDriver: true }),
      Animated.spring(sendButtonScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

    const userMessage = createUserMessage(messageText);
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);
    setMessageCount(prev => prev + 1);

    // Chat XP: ilk mesajda chat_started, her mesajda chat_message_sent (gunluk limit storage'da)
    if (!chatStartedRef.current) {
      chatStartedRef.current = true;
      addXP('chat_started');
      // Gunluk gorev: AI ile pratik yap
      completeDailyTask('practice_ai');
    }
    addXP('chat_message_sent');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const wordTranslation = getContentTranslation(word, nativeLanguage);
      const intensity = await getFeedbackIntensity();
      // Senaryo bilgisini AI yanit servisine aktariyoruz
      const aiResponse = await getAIResponse(messageText, word, updatedMessages, nativeLanguage, targetLanguage, wordTranslation, intensity, scenario);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: t('errorMessage'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [inputText, isLoading, messages, word, nativeLanguage, targetLanguage]);

  const handleQuickReply = useCallback((replyText: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSend(replyText);
  }, [handleSend]);

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => (
    <AnimatedMessage item={item} index={index} isLast={index === messages.length - 1} />
  );

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={[styles.messageContainer, styles.aiMessageContainer]}>
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.avatarContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarEmoji}>{'\u{1F916}'}</Text>
          </LinearGradient>
        </View>
        <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
          <BouncingDots />
        </View>
      </View>
    );
  };

  const quickReplies = getQuickReplyOptions(nativeLanguage, word);

  // Kelime bilgi karti - cevirisi ile birlikte
  const wordTranslation = getContentTranslation(word, nativeLanguage);

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header - daha kompakt ve bilgilendirici */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNavigateBack();
            }}
          >
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTutorRow}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.headerTutorAvatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.headerTutorAvatarEmoji}>{'\u{1F916}'}</Text>
              </LinearGradient>
              <Text style={styles.headerTutorName}>Lingo</Text>
              <View style={styles.headerOnlineDot} />
            </View>
            <View style={styles.headerWordRow}>
              <Text style={styles.headerWord}>{word.emoji || targetFlag} {word.target_word}</Text>
              <View style={[styles.headerLevelBadge, { backgroundColor: getLevelColor(word.level) }]}>
                <Text style={styles.headerLevelText}>{word.level}</Text>
              </View>
            </View>
            {wordTranslation ? (
              <Text style={styles.headerTranslation}>{wordTranslation}</Text>
            ) : null}
          </View>
          {/* Mesaj sayaci */}
          <View style={styles.headerRight}>
            {messageCount > 0 && (
              <View style={styles.messageBadge}>
                <Text style={styles.messageBadgeText}>{messageCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

        {/* Quick Reply Chips - sadece bos chat veya son mesaj AI ise goster */}
        {(!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant') && (
          <View style={styles.quickReplyContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickReplyScroll}
            >
              {quickReplies.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => handleQuickReply(option.text)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                  style={styles.quickReplyChip}
                >
                  <Text style={styles.quickReplyEmoji}>{option.emoji}</Text>
                  <Text style={styles.quickReplyText}>{option.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={t('writeYourSentence')}
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
                returnKeyType="default"
              />
              <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
                <TouchableOpacity
                  onPress={() => handleSend()}
                  disabled={!inputText.trim() || isLoading}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={inputText.trim() && !isLoading
                      ? ['#6366F1', '#7C3AED']
                      : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                    style={styles.sendButton}
                  >
                    <Text style={[styles.sendIcon, (!inputText.trim() || isLoading) && styles.sendIconDisabled]}>
                      {'\u2191'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
            {/* Karakter sayaci - 400'den fazla yazildiginda goster */}
            {inputText.length > 400 && (
              <Text style={styles.charCount}>{inputText.length}/500</Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// Seviye renk yardimcisi
const getLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    'A1': '#10B981', 'A2': '#F59E0B', 'B1': '#3B82F6',
    'B2': '#EF4444', 'C1': '#8B5CF6', 'C2': '#6366F1',
  };
  return colors[level] || '#6366F1';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Header - daha kompakt
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerTutorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  headerTutorAvatarEmoji: {
    fontSize: 12,
  },
  headerTutorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A78BFA',
  },
  headerOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginLeft: 5,
  },
  headerWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerWord: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerLevelBadge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  headerLevelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerTranslation: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  messageBadge: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  messageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
  },

  // Messages
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // Gradient arka plan LinearGradient ile saglaniyor
  },
  avatarEmoji: {
    fontSize: 20,
  },
  avatarLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A78BFA',
    marginTop: 2,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: 'rgba(255,255,255,0.85)',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 4,
    marginLeft: 4,
  },
  messageTimeUser: {
    textAlign: 'right',
    marginRight: 4,
    marginLeft: 0,
  },
  typingBubble: {
    paddingVertical: 12,
  },

  // Quick Replies - ayri emoji ve text, daha temiz
  quickReplyContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  quickReplyScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickReplyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  quickReplyEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  quickReplyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A78BFA',
  },

  // Input - temiz ve minimal
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 8 : 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
    paddingVertical: 6,
    paddingRight: 10,
    fontWeight: '400',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sendIconDisabled: {
    color: 'rgba(255,255,255,0.15)',
  },
  charCount: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
});

export default ChatScreen;
