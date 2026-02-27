import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
// @ts-ignore
import * as Speech from 'expo-speech';
import { ContentItem, UserProgress, ProficiencyLevel } from '../types';
import { getWordOfTheDay, getTranslation, getExampleTranslation } from '../utils/contentLoader';
import { updateDailyStreak, toggleFavorite, isFavorite, addLearnedWord } from '../utils/storage';
import { getTranslation as getUITranslation, LanguageCode, LANGUAGES } from '../utils/translations';

const { width } = Dimensions.get('window');

type HomeScreenProps = {
  onNavigateToChat: (word: ContentItem) => void;
  onNavigateToJourney: () => void;
  onNavigateToSettings: () => void;
  onNavigateToHistory: () => void;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  proficiencyLevel: ProficiencyLevel;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToChat, onNavigateToJourney, onNavigateToSettings, onNavigateToHistory, nativeLanguage, targetLanguage, proficiencyLevel }) => {
  const [word, setWord] = useState<ContentItem | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isFav, setIsFav] = useState(false);

  const t = (key: Parameters<typeof getUITranslation>[0]) => getUITranslation(key, nativeLanguage);

  const targetLanguageFlag = LANGUAGES.find(lang => lang.code === targetLanguage)?.flag || '';

  // Animations
  const cardFloat = useRef(new Animated.Value(0)).current;
  const meaningButtonScale = useRef(new Animated.Value(1)).current;
  const practiceButtonScale = useRef(new Animated.Value(1)).current;
  const meaningReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDailyContent();
    startAnimations();
  }, [targetLanguage, proficiencyLevel]);

  const startAnimations = () => {
    // Subtle card floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, {
          toValue: -6,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardFloat, {
          toValue: 6,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadDailyContent = async () => {
    try {
      const todaysWord = getWordOfTheDay(targetLanguage, proficiencyLevel);
      setWord(todaysWord);
      setShowMeaning(false);
      const idHash = parseInt(todaysWord.id.replace(/\D/g, '')) || 1;
      const updatedProgress = await updateDailyStreak(idHash);
      setProgress(updatedProgress);
      await addLearnedWord(todaysWord);
      const favStatus = await isFavorite(todaysWord.id);
      setIsFav(favStatus);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const handleSpeak = () => {
    if (!word) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const speechLang: Record<string, string> = {
      en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR',
      pt: 'pt-BR', it: 'it-IT', ru: 'ru-RU', ja: 'ja-JP',
      ko: 'ko-KR', zh: 'zh-CN', tr: 'tr-TR',
    };
    Speech.speak(word.target_word, {
      language: speechLang[targetLanguage] || 'en-US',
      rate: 0.8,
    });
  };

  const handleToggleFavorite = async () => {
    if (!word) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newFav = await toggleFavorite(word.id);
    setIsFav(newFav);
  };

  const handleMeaningPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.spring(meaningButtonScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.spring(meaningButtonScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    if (!showMeaning) {
      setShowMeaning(true);
      Animated.spring(meaningReveal, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(meaningReveal, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowMeaning(false));
    }
  };

  const handlePracticePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.spring(practiceButtonScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.spring(practiceButtonScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    if (word) {
      setTimeout(() => onNavigateToChat(word), 150);
    }
  };

  if (!word) {
    return (
      <LinearGradient colors={['#F8FAFE', '#EDF2F7', '#E2E8F0']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const localizedMeaning = getTranslation(word, nativeLanguage);
  const localizedExample = getExampleTranslation(word, nativeLanguage);

  return (
    <LinearGradient colors={['#F8FAFE', '#EEF2F7', '#E8EDF3']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>{t('appName')}</Text>
          <View style={styles.headerRight}>
            <View style={styles.targetLanguageBadge}>
              <Text style={styles.targetLanguageFlag}>{targetLanguageFlag}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNavigateToJourney();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.streakBubble}>
                <Text style={styles.streakIcon}>
                  {progress && progress.streak > 0 ? '\u{1F525}' : '\u{2014}'}
                </Text>
                <Text style={styles.streakText}>
                  {progress && progress.streak > 0 ? `${progress.streak} ${t('dayStreak')}` : 'Start'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Card */}
        <View style={styles.cardWrapper}>
          <Animated.View
            style={[
              styles.flashcard,
              { transform: [{ translateY: cardFloat }] }
            ]}
          >
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{word.level}</Text>
            </View>
            <Text style={styles.idiomLabel}>{t('idiomOfTheDay')}</Text>

            <Text style={styles.idiomText}>{word.target_word}</Text>

            {/* Action Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.speakButton} onPress={handleSpeak}>
                <Text style={styles.speakIcon}>{'  \u25B6  '}</Text>
                <Text style={styles.speakText}>{word.pronunciation || t('listen')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.favButtonCard} onPress={handleToggleFavorite}>
                <Text style={styles.favIcon}>{isFav ? '\u2665' : '\u2661'}</Text>
              </TouchableOpacity>
            </View>

            {/* Meaning Button */}
            <Animated.View style={{ transform: [{ scale: meaningButtonScale }] }}>
              <TouchableOpacity
                style={[styles.meaningButton, showMeaning && styles.meaningButtonActive]}
                onPress={handleMeaningPress}
                activeOpacity={0.8}
              >
                <Text style={styles.meaningButtonText}>
                  {showMeaning ? t('hideMeaning') : t('showMeaning')}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Meaning Reveal */}
            {showMeaning && (
              <Animated.View
                style={[
                  styles.meaningContainer,
                  {
                    opacity: meaningReveal,
                    transform: [{ scale: meaningReveal }]
                  }
                ]}
              >
                <Text style={styles.meaningLabel}>{t('meaning')}</Text>
                <Text style={styles.meaningText}>{localizedMeaning}</Text>
              </Animated.View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Example */}
            <Text style={styles.exampleLabel}>{t('exampleSentence')}</Text>
            <Text style={styles.exampleText}>"{word.example_sentence}"</Text>
            {localizedExample && (
              <Text style={styles.exampleTranslation}>{localizedExample}</Text>
            )}
          </Animated.View>
        </View>

        {/* Practice Button */}
        <Animated.View style={[styles.practiceButtonWrapper, { transform: [{ scale: practiceButtonScale }] }]}>
          <TouchableOpacity
            style={styles.practiceButton}
            onPress={handlePracticePress}
            activeOpacity={0.8}
          >
            <Text style={styles.practiceButtonText}>{t('practiceWithAI')}</Text>
            <Text style={styles.practiceArrow}>{'\u2192'}</Text>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
          <View style={[styles.tabIndicator, styles.tabIndicatorActive]} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>{t('tabHome')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToHistory(); }}>
          <View style={styles.tabIndicator} />
          <Text style={styles.tabLabel}>{t('tabHistory')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToJourney(); }}>
          <View style={styles.tabIndicator} />
          <Text style={styles.tabLabel}>{t('tabJourney')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToSettings(); }}>
          <View style={styles.tabIndicator} />
          <Text style={styles.tabLabel}>{t('tabSettings')}</Text>
        </TouchableOpacity>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetLanguageBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  targetLanguageFlag: {
    fontSize: 22,
  },
  streakBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },

  // Card
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  flashcard: {
    width: width - 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  levelBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  idiomLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  idiomText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
  },
  speakIcon: {
    fontSize: 12,
    color: '#6366F1',
    marginRight: 6,
  },
  speakText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  favButtonCard: {
    backgroundColor: '#FEF2F2',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favIcon: {
    fontSize: 22,
    color: '#EF4444',
  },

  // Meaning Button
  meaningButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  meaningButtonActive: {
    backgroundColor: '#4F46E5',
  },
  meaningButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Meaning Container
  meaningContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  meaningLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  meaningText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
    lineHeight: 26,
  },

  // Divider
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 18,
  },

  // Example
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  exampleTranslation: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 6,
  },

  // Practice Button
  practiceButtonWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  practiceButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  practiceArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },

  // Bottom Tab Bar
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  tabIndicatorActive: {
    backgroundColor: '#6366F1',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default HomeScreen;
