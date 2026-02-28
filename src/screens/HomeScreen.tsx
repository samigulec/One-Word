import React, { useEffect, useState, useRef, useMemo } from 'react';
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

const { width, height } = Dimensions.get('window');

// Mini confetti burst component
const CONFETTI_EMOJIS = ['\u2728', '\u{1F389}', '\u{1F31F}', '\u2764\uFE0F', '\u{1F525}', '\u{1F4AB}', '\u{1F308}', '\u{1F38A}'];

const ConfettiBurst: React.FC<{ active: boolean }> = ({ active }) => {
  const anims = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (active) {
      anims.forEach((a, i) => {
        a.x.setValue(0);
        a.y.setValue(0);
        a.opacity.setValue(1);
        const angle = (i / 8) * Math.PI * 2;
        const dist = 60 + Math.random() * 40;
        Animated.parallel([
          Animated.timing(a.x, { toValue: Math.cos(angle) * dist, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(a.y, { toValue: Math.sin(angle) * dist - 20, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(a.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
        ]).start();
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', width: '100%', top: -10 }} pointerEvents="none">
      {anims.map((a, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            fontSize: 16,
            opacity: a.opacity,
            transform: [{ translateX: a.x }, { translateY: a.y }],
          }}
        >
          {CONFETTI_EMOJIS[i]}
        </Animated.Text>
      ))}
    </View>
  );
};

type HomeScreenProps = {
  onNavigateToChat: (word: ContentItem) => void;
  onNavigateToJourney: () => void;
  onNavigateToSettings: () => void;
  onNavigateToHistory: () => void;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  proficiencyLevel: ProficiencyLevel;
};

// Floating particle component
const FloatingParticle: React.FC<{ delay: number; size: number; startX: number; color: string }> = ({ delay, size, startX, color }) => {
  const translateY = useRef(new Animated.Value(height + 50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(height + 50);
      opacity.setValue(0);
      scale.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 8000 + Math.random() * 4000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 1500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: 30,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: -30,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { scale }],
      }}
    />
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToChat, onNavigateToJourney, onNavigateToSettings, onNavigateToHistory, nativeLanguage, targetLanguage, proficiencyLevel }) => {
  const [word, setWord] = useState<ContentItem | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const t = (key: Parameters<typeof getUITranslation>[0]) => getUITranslation(key, nativeLanguage);

  const targetLanguageFlag = LANGUAGES.find(lang => lang.code === targetLanguage)?.flag || '';
  const nativeLanguageFlag = LANGUAGES.find(lang => lang.code === nativeLanguage)?.flag || '';

  // Animations
  const cardFloat = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const meaningButtonScale = useRef(new Animated.Value(1)).current;
  const practiceButtonScale = useRef(new Animated.Value(1)).current;
  const meaningReveal = useRef(new Animated.Value(0)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const practiceGlow = useRef(new Animated.Value(0.3)).current;
  const wordGlow = useRef(new Animated.Value(0)).current;

  // Generate particles once
  const particles = useMemo(() => {
    const colors = ['#818CF8', '#A78BFA', '#F0ABFC', '#67E8F9', '#6EE7B7', '#FCD34D'];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: i * 600,
      size: 6 + Math.random() * 14,
      startX: Math.random() * width,
      color: colors[i % colors.length],
    }));
  }, []);

  useEffect(() => {
    loadDailyContent();
    startAnimations();
  }, [targetLanguage, proficiencyLevel]);

  const startAnimations = () => {
    // Card entrance animation
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle card floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, {
          toValue: -8,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardFloat, {
          toValue: 8,
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
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(streakPulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Practice button glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(practiceGlow, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(practiceGlow, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Word shimmer
    Animated.loop(
      Animated.sequence([
        Animated.timing(wordGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(wordGlow, {
          toValue: 0,
          duration: 2000,
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
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(meaningButtonScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    if (!showMeaning) {
      setShowMeaning(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 800);
      Animated.spring(meaningReveal, {
        toValue: 1,
        tension: 50,
        friction: 6,
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
        toValue: 0.92,
        useNativeDriver: true,
      }),
      Animated.spring(practiceButtonScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    if (word) {
      setTimeout(() => onNavigateToChat(word), 150);
    }
  };

  if (!word) {
    return (
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Animated.Text style={[styles.loadingEmoji, { transform: [{ scale: streakPulse }] }]}>
            {'\u2728'}
          </Animated.Text>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const localizedMeaning = getTranslation(word, nativeLanguage);
  const localizedExample = getExampleTranslation(word, nativeLanguage);

  const levelColors: Record<string, { bg: string; text: string; glow: string }> = {
    'A1': { bg: '#10B981', text: '#FFFFFF', glow: '#34D399' },
    'A2': { bg: '#34D399', text: '#FFFFFF', glow: '#6EE7B7' },
    'B1': { bg: '#F59E0B', text: '#FFFFFF', glow: '#FBBF24' },
    'B2': { bg: '#EF4444', text: '#FFFFFF', glow: '#F87171' },
    'C1': { bg: '#8B5CF6', text: '#FFFFFF', glow: '#A78BFA' },
    'C2': { bg: '#6366F1', text: '#FFFFFF', glow: '#818CF8' },
  };

  const lc = levelColors[word.level] || levelColors['A1'];

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      {/* Floating Particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {particles.map(p => (
          <FloatingParticle key={p.id} {...p} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.appTitleContainer}>
            <Text style={styles.appTitleAccent}>{'\u2728'}</Text>
            <Text style={styles.appTitle}>{t('appName')}</Text>
          </View>
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
              <LinearGradient
                colors={progress && progress.streak > 0 ? ['#F59E0B', '#EF4444'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.streakBubble}
              >
                <Animated.Text style={[styles.streakIcon, { transform: [{ scale: progress && progress.streak > 0 ? streakPulse : 1 as any }] }]}>
                  {progress && progress.streak > 0 ? '\u{1F525}' : '\u{2728}'}
                </Animated.Text>
                <Text style={styles.streakText}>
                  {progress && progress.streak > 0 ? `${progress.streak}` : '0'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Main Card */}
        <View style={styles.cardWrapper}>
          <Animated.View
            style={[
              styles.flashcardOuter,
              {
                opacity: cardOpacity,
                transform: [
                  { translateY: cardFloat },
                  { scale: cardScale },
                ]
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
              style={styles.flashcard}
            >
              {/* Decorative corner accents */}
              <View style={[styles.cornerAccent, styles.cornerTopLeft]} />
              <View style={[styles.cornerAccent, styles.cornerBottomRight]} />

              {/* Level Badge */}
              <LinearGradient
                colors={[lc.bg, lc.glow]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.levelBadge}
              >
                <Text style={styles.levelText}>{word.level}</Text>
              </LinearGradient>

              <View style={styles.idiomLabelRow}>
                <Text style={styles.idiomLabel}>{t('idiomOfTheDay')}</Text>
              </View>

              {/* Word with glow effect */}
              <View style={styles.wordContainer}>
                <Animated.View style={[styles.wordGlow, { opacity: wordGlow }]} />
                <Text style={styles.idiomText}>{word.target_word}</Text>
              </View>

              {/* Action Row */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.speakButton} onPress={handleSpeak} activeOpacity={0.7}>
                  <LinearGradient
                    colors={['rgba(99,102,241,0.2)', 'rgba(139,92,246,0.2)']}
                    style={styles.speakButtonInner}
                  >
                    <Text style={styles.speakIcon}>{'\u{1F50A}'}</Text>
                    <Text style={styles.speakText}>{word.pronunciation || t('listen')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.favButtonCard} onPress={handleToggleFavorite} activeOpacity={0.7}>
                  <Animated.Text style={[styles.favIcon, isFav && styles.favIconActive]}>
                    {isFav ? '\u2665' : '\u2661'}
                  </Animated.Text>
                </TouchableOpacity>
              </View>

              {/* Meaning Button */}
              <Animated.View style={{ transform: [{ scale: meaningButtonScale }] }}>
                <TouchableOpacity
                  onPress={handleMeaningPress}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={showMeaning ? ['#8B5CF6', '#6366F1'] : ['#6366F1', '#818CF8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.meaningButton}
                  >
                    <Text style={styles.meaningButtonIcon}>
                      {showMeaning ? '\u{1F648}' : '\u{1F4A1}'}
                    </Text>
                    <Text style={styles.meaningButtonText}>
                      {showMeaning ? t('hideMeaning') : t('showMeaning')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Meaning Reveal */}
              {showMeaning && (
                <Animated.View
                  style={[
                    styles.meaningContainer,
                    {
                      opacity: meaningReveal,
                      transform: [
                        { scale: meaningReveal },
                        { translateY: meaningReveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })},
                      ]
                    }
                  ]}
                >
                  <ConfettiBurst active={showConfetti} />
                  <Text style={styles.meaningLabel}>{'\u{1F4A1}'} {t('meaning')}</Text>
                  <Text style={styles.meaningText}>{localizedMeaning}</Text>
                </Animated.View>
              )}

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerDot} />
                <View style={styles.dividerLine} />
                <View style={styles.dividerDot} />
              </View>

              {/* Example */}
              <Text style={styles.exampleLabel}>{t('exampleSentence')}</Text>
              <View style={styles.exampleRow}>
                <Text style={styles.exampleFlag}>{targetLanguageFlag}</Text>
                <Text style={styles.exampleText}>"{word.example_sentence}"</Text>
              </View>
              {localizedExample && (
                <View style={styles.exampleRow}>
                  <Text style={styles.exampleFlag}>{nativeLanguageFlag}</Text>
                  <Text style={styles.exampleTranslation}>{localizedExample}</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Practice Button */}
        <Animated.View style={[styles.practiceButtonWrapper, { transform: [{ scale: practiceButtonScale }] }]}>
          <TouchableOpacity
            onPress={handlePracticePress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.practiceButton}
            >
              <Animated.View style={[styles.practiceButtonGlow, { opacity: practiceGlow }]} />
              <Text style={styles.practiceEmoji}>{'\u{1F4AC}'}</Text>
              <Text style={styles.practiceButtonText}>{t('practiceWithAI')}</Text>
              <Text style={styles.practiceArrow}>{'\u{1F525}'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => {}}>
          <Text style={styles.tabIcon}>{'\u{1F3E0}'}</Text>
          <Text style={styles.tabLabelActive}>{t('tabHome')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToHistory(); }}>
          <Text style={styles.tabIcon}>{'\u{1F4DA}'}</Text>
          <Text style={styles.tabLabel}>{t('tabHistory')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToJourney(); }}>
          <Text style={styles.tabIcon}>{'\u{1F680}'}</Text>
          <Text style={styles.tabLabel}>{t('tabJourney')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToSettings(); }}>
          <Text style={styles.tabIcon}>{'\u{2699}\u{FE0F}'}</Text>
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
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  appTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitleAccent: {
    fontSize: 20,
    color: '#A78BFA',
    marginRight: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetLanguageBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  targetLanguageFlag: {
    fontSize: 22,
  },
  streakBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  streakIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Card
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  flashcardOuter: {
    width: width - 32,
    borderRadius: 28,
    // Glow shadow
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  flashcard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },

  // Corner accents
  cornerAccent: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  cornerTopLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 8,
  },

  levelBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  idiomLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  idiomLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Word
  wordContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  wordGlow: {
    position: 'absolute',
    width: 200,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6',
    opacity: 0.15,
  },
  idiomText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 42,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  speakButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  speakButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  speakIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  speakText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  favButtonCard: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  favIcon: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.4)',
  },
  favIconActive: {
    color: '#EF4444',
  },

  // Meaning Button
  meaningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
    marginVertical: 4,
  },
  meaningButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  meaningButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Meaning Container
  meaningContainer: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  meaningLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  meaningText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#6EE7B7',
    textAlign: 'center',
    lineHeight: 28,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(139,92,246,0.5)',
    marginHorizontal: 8,
  },

  // Example
  exampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingHorizontal: 4,
    width: '100%',
  },
  exampleFlag: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  exampleText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  exampleTranslation: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 22,
  },

  // Practice Button
  practiceButtonWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 18,
    overflow: 'hidden',
  },
  practiceButtonGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  practiceEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  practiceButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  practiceArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    marginLeft: 10,
    fontWeight: '700',
  },

  // Bottom Tab Bar
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15,10,46,0.95)',
    paddingTop: 10,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
    marginTop: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
});

export default HomeScreen;
