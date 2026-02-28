import React, { useState, useRef, useEffect } from 'react';
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
import { getTranslation, LanguageCode } from '../utils/translations';
import { getTranslation as getContentTranslation } from '../utils/contentLoader';
import {
  getAIResponse,
  createUserMessage,
  getInitialGreeting,
  getQuickReplyOptions,
} from '../services/aiChat';

const { width } = Dimensions.get('window');

type ChatScreenProps = {
  word: ContentItem;
  onNavigateBack: () => void;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
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
          Animated.timing(dot, { toValue: -8, duration: 300, delay, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      );
    };

    Animated.parallel([
      createBounce(dot1, 0),
      createBounce(dot2, 150),
      createBounce(dot3, 300),
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
    marginHorizontal: 3,
  },
});

// Animated message component
const AnimatedMessage: React.FC<{ item: ChatMessage; index: number }> = ({ item, index }) => {
  const isUser = item.role === 'user';
  const slideAnim = useRef(new Animated.Value(isUser ? 50 : -50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
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
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {!isUser && (
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.avatarContainer}
        >
          <Text style={styles.avatarText}>{'\u{1F916}'}</Text>
        </LinearGradient>
      )}
      {isUser ? (
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
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
      {isUser && (
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={[styles.avatarContainer, styles.userAvatar]}
        >
          <Text style={styles.avatarText}>{'\u{1F464}'}</Text>
        </LinearGradient>
      )}
    </Animated.View>
  );
};

const ChatScreen: React.FC<ChatScreenProps> = ({ word, onNavigateBack, nativeLanguage, targetLanguage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);

  const backButtonScale = useRef(new Animated.Value(1)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const inputGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const wordTranslation = getContentTranslation(word, nativeLanguage);
    const greeting = getInitialGreeting(word, nativeLanguage, targetLanguage, wordTranslation);
    setMessages([greeting]);
  }, [word, nativeLanguage, targetLanguage]);

  const handleSend = async (text?: string) => {
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

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const wordTranslation = getContentTranslation(word, nativeLanguage);
      const aiResponse = await getAIResponse(messageText, word, updatedMessages, nativeLanguage, targetLanguage, wordTranslation);
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
  };

  const handleQuickReply = (replyText: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSend(replyText);
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(backButtonScale, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(backButtonScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    setTimeout(() => onNavigateBack(), 100);
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => (
    <AnimatedMessage item={item} index={index} />
  );

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={[styles.messageContainer, styles.aiMessageContainer]}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.avatarContainer}
        >
          <Text style={styles.avatarText}>{'\u{1F916}'}</Text>
        </LinearGradient>
        <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
          <BouncingDots />
        </View>
      </View>
    );
  };

  const quickReplies = getQuickReplyOptions(nativeLanguage);

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Text style={styles.backArrow}>{'\u2190'}</Text>
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('practiceTime')} {'\u{1F4AC}'}</Text>
            <View style={styles.headerWordBadge}>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {word.target_word}
              </Text>
            </View>
          </View>
          <View style={styles.headerSpacer} />
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

        {/* Quick Reply Chips */}
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
              >
                <LinearGradient
                  colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.15)']}
                  style={styles.quickReplyChip}
                >
                  <Text style={styles.quickReplyText}>{option.text}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
                onFocus={() => {
                  Animated.timing(inputGlow, { toValue: 1, duration: 200, useNativeDriver: false }).start();
                }}
                onBlur={() => {
                  Animated.timing(inputGlow, { toValue: 0, duration: 200, useNativeDriver: false }).start();
                }}
              />
              <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
                <TouchableOpacity
                  onPress={() => handleSend()}
                  disabled={!inputText.trim() || isLoading}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={inputText.trim() && !isLoading
                      ? ['#6366F1', '#8B5CF6']
                      : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                    style={styles.sendButton}
                  >
                    <Text style={[styles.sendIcon, (!inputText.trim() || isLoading) && styles.sendIconDisabled]}>
                      {'\u2191'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerWordBadge: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A78BFA',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 42,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 16,
  },
  userAvatar: {
    marginRight: 0,
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '72%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  typingBubble: {
    paddingVertical: 14,
  },
  quickReplyContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  quickReplyScroll: {
    paddingHorizontal: 16,
  },
  quickReplyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  quickReplyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A78BFA',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sendIconDisabled: {
    color: 'rgba(255,255,255,0.2)',
  },
});

export default ChatScreen;
