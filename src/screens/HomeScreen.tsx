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

type NewHomeScreenProps = {
  onNavigateToChat: (word: ContentItem) => void;
  onNavigateToJourney: () => void;
  onNavigateToSettings: () => void;
  onNavigateToHistory: () => void;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  proficiencyLevel: ProficiencyLevel;
};

// Animated Cloud Component
const Cloud: React.FC<{ delay: number; top: number; size: number; duration: number }> = ({ 
  delay, top, size, duration 
}) => {
  const translateX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    const animate = () => {
      translateX.setValue(-200);
      Animated.timing(translateX, {
        toValue: width + 200,
        duration: duration,
        delay: delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.cloud, 
        { 
          top, 
          width: size, 
          height: size * 0.5,
          transform: [{ translateX }] 
        }
      ]}
    >
      <View style={[styles.cloudPuff, { width: size * 0.5, height: size * 0.5, left: 0, bottom: 0 }]} />
      <View style={[styles.cloudPuff, { width: size * 0.6, height: size * 0.6, left: size * 0.25, bottom: size * 0.15 }]} />
      <View style={[styles.cloudPuff, { width: size * 0.45, height: size * 0.45, right: 0, bottom: 0 }]} />
    </Animated.View>
  );
};

const NewHomeScreen: React.FC<NewHomeScreenProps> = ({ onNavigateToChat, onNavigateToJourney, onNavigateToSettings, onNavigateToHistory, nativeLanguage, targetLanguage, proficiencyLevel }) => {
  const [word, setWord] = useState<ContentItem | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isFav, setIsFav] = useState(false);

  // Get translations
  const t = (key: Parameters<typeof getUITranslation>[0]) => getUITranslation(key, nativeLanguage);

  // Get target language flag
  const targetLanguageFlag = LANGUAGES.find(lang => lang.code === targetLanguage)?.flag || '🌍';

  // Animations
  const cardFloat = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;
  const flameScale = useRef(new Animated.Value(1)).current;
  const flameRotate = useRef(new Animated.Value(0)).current;
  const meaningButtonScale = useRef(new Animated.Value(1)).current;
  const practiceButtonScale = useRef(new Animated.Value(1)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const eyeScale = useRef(new Animated.Value(1)).current;
  const meaningReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDailyContent();
    startAnimations();
  }, [targetLanguage, proficiencyLevel]);

  const startAnimations = () => {
    // Card floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardFloat, {
          toValue: 8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Card breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 1.02,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.98,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Streak pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakPulse, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(streakPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Flame animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameScale, {
          toValue: 1.15,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(flameScale, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(flameRotate, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(flameRotate, {
          toValue: -1,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Eye blink animation
    const blinkEye = () => {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(eyeScale, {
            toValue: 0.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(eyeScale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(eyeScale, {
            toValue: 0.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(eyeScale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start(() => blinkEye());
      }, 3000);
    };
    blinkEye();
  };

  const loadDailyContent = async () => {
    try {
      const todaysWord = getWordOfTheDay(targetLanguage, proficiencyLevel);
      setWord(todaysWord);
      setShowMeaning(false);
      // Update streak with word ID hash
      const idHash = parseInt(todaysWord.id.replace(/\D/g, '')) || 1;
      const updatedProgress = await updateDailyStreak(idHash);
      setProgress(updatedProgress);
      // Save as learned
      await addLearnedWord(todaysWord);
      // Check if favorite
      const favStatus = await isFavorite(todaysWord.id);
      setIsFav(favStatus);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const handleSpeak = () => {
    if (!word) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Map language codes to speech language codes
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
    
    // Bounce animation
    Animated.sequence([
      Animated.spring(meaningButtonScale, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(meaningButtonScale, {
        toValue: 1.1,
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
        toValue: 0.85,
        useNativeDriver: true,
      }),
      Animated.spring(practiceButtonScale, {
        toValue: 1.05,
        useNativeDriver: true,
      }),
      Animated.spring(practiceButtonScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    if (word) {
      setTimeout(() => onNavigateToChat(word), 200);
    }
  };

  const flameRotateInterpolate = flameRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  if (!word) {
    return (
      <LinearGradient colors={['#E0F4FF', '#B8E4FF', '#A8DAFF']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const localizedMeaning = getTranslation(word, nativeLanguage);
  const localizedExample = getExampleTranslation(word, nativeLanguage);

  return (
    <LinearGradient colors={['#E0F4FF', '#C5EBFF', '#B8E4FF']} style={styles.container}>
      {/* Animated Clouds */}
      <Cloud delay={0} top={80} size={100} duration={25000} />
      <Cloud delay={3000} top={150} size={80} duration={30000} />
      <Cloud delay={8000} top={50} size={120} duration={28000} />
      <Cloud delay={12000} top={200} size={90} duration={32000} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>{t('appName')}</Text>
          <View style={styles.headerRight}>
            {/* Target Language Flag */}
            <View style={styles.targetLanguageBadge}>
              <Text style={styles.targetLanguageFlag}>{targetLanguageFlag}</Text>
            </View>
            {/* Streak Counter - Tappable to Journey */}
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNavigateToJourney();
              }}
              activeOpacity={0.8}
            >
              <Animated.View style={[styles.streakBubble, { transform: [{ scale: streakPulse }] }]}>
                <Animated.Text 
                  style={[
                    styles.flameEmoji, 
                    { 
                      transform: [
                        { scale: flameScale }, 
                        { rotate: flameRotateInterpolate }
                      ] 
                    }
                  ]}
                >
                  {progress && progress.streak > 0 ? '🔥' : '🗺️'}
                </Animated.Text>
                <Text style={styles.streakText}>
                  {progress && progress.streak > 0 ? `${progress.streak} ${t('dayStreak')}` : 'Start'}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Floating Card */}
        <View style={styles.cardWrapper}>
          <Animated.View 
            style={[
              styles.flashcard, 
              { 
                transform: [
                  { translateY: cardFloat }, 
                  { scale: cardScale }
                ] 
              }
            ]}
          >
            {/* Word Label */}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{word.level}</Text>
            </View>
            <Text style={styles.idiomLabel}>{t('idiomOfTheDay')}</Text>
            
            {/* Target Word */}
            <Text style={styles.idiomText}>"{word.target_word}"</Text>
            
            {/* Speak & Favorite Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.speakButton} onPress={handleSpeak}>
                <Text style={styles.speakEmoji}>🔊</Text>
                <Text style={styles.speakText}>{word.pronunciation || 'Listen'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.favButtonCard} onPress={handleToggleFavorite}>
                <Text style={styles.favEmoji}>{isFav ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>

            {/* Meaning Button with Sparkles */}
            <View style={styles.meaningButtonWrapper}>
              <Animated.View style={[styles.sparkle, styles.sparkle1, { opacity: sparkleOpacity }]}>
                <Text style={styles.sparkleText}>✨</Text>
              </Animated.View>
              <Animated.View style={[styles.sparkle, styles.sparkle2, { opacity: sparkleOpacity }]}>
                <Text style={styles.sparkleText}>✨</Text>
              </Animated.View>
              
              <Animated.View style={{ transform: [{ scale: meaningButtonScale }] }}>
                <TouchableOpacity 
                  style={[styles.meaningButton, showMeaning && styles.meaningButtonActive]}
                  onPress={handleMeaningPress}
                  activeOpacity={0.9}
                >
                  <Animated.Text style={[styles.eyeEmoji, { transform: [{ scaleY: eyeScale }] }]}>
                    👀
                  </Animated.Text>
                  <Text style={styles.meaningButtonText}>
                    {showMeaning ? t('hideMeaning') : t('showMeaning')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Localized Meaning (Animated Reveal) */}
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
            <View style={styles.divider}>
              <View style={styles.dividerDot} />
              <View style={styles.dividerLine} />
              <View style={styles.dividerDot} />
            </View>

            {/* Example Sentence */}
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
            activeOpacity={0.9}
          >
            <Text style={styles.practiceEmoji}>💬</Text>
            <Text style={styles.practiceButtonText}>{t('practiceWithAI')}</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Bottom Tab Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
            <Text style={styles.tabEmoji}>🏠</Text>
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>{t('tabHome')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToHistory(); }}>
            <Text style={styles.tabEmoji}>📖</Text>
            <Text style={styles.tabLabel}>{t('tabHistory')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToJourney(); }}>
            <Text style={styles.tabEmoji}>🗺️</Text>
            <Text style={styles.tabLabel}>{t('tabJourney')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToSettings(); }}>
            <Text style={styles.tabEmoji}>⚙️</Text>
            <Text style={styles.tabLabel}>{t('tabSettings')}</Text>
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 22,
    color: '#5B8FB9',
    fontWeight: '700',
  },
  
  // Clouds
  cloud: {
    position: 'absolute',
    zIndex: 1,
  },
  cloudPuff: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4A90B8',
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
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#5B8FB9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  targetLanguageFlag: {
    fontSize: 24,
  },
  streakBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD4A8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  flameEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E67E22',
  },

  // Card
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 5,
  },
  flashcard: {
    width: width - 40,
    backgroundColor: '#FFFEFA',
    borderRadius: 32,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#5B8FB9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  levelBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#7DDBA3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  idiomLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7EC8E3',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  idiomText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3D5A80',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
  },
  speakEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  speakText: {
    fontSize: 14,
    color: '#5B8FB9',
    fontWeight: '600',
  },
  favButtonCard: {
    backgroundColor: '#FFF0F5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favEmoji: {
    fontSize: 22,
  },

  // Meaning Button
  meaningButtonWrapper: {
    position: 'relative',
    marginVertical: 10,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 10,
  },
  sparkle1: {
    top: -10,
    left: -15,
  },
  sparkle2: {
    top: -5,
    right: -15,
  },
  sparkleText: {
    fontSize: 18,
  },
  meaningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5EC',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#FF8FAB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  meaningButtonActive: {
    backgroundColor: '#FFECD2',
  },
  eyeEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  meaningButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E75480',
  },

  // Meaning Container
  meaningContainer: {
    backgroundColor: '#F0FFF4',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9AE6B4',
  },
  meaningLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38A169',
    marginBottom: 8,
  },
  meaningText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#276749',
    textAlign: 'center',
    lineHeight: 28,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '80%',
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
  },
  dividerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7EC8E3',
    marginHorizontal: 10,
  },

  // Example
  exampleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A0AEC0',
    marginBottom: 10,
  },
  exampleText: {
    fontSize: 17,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  exampleTranslation: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
  },

  // Practice Button
  practiceButtonWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    zIndex: 10,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7DDBA3',
    borderRadius: 28,
    paddingVertical: 20,
    shadowColor: '#38A169',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  practiceEmoji: {
    fontSize: 26,
    marginRight: 12,
  },
  practiceButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Bottom Tab Bar
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#90A4AE',
  },
  tabLabelActive: {
    color: '#667eea',
  },
});

export default NewHomeScreen;

