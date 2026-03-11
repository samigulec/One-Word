// DailyGuessGame.tsx -- Gunun Tahmini mini oyunu
// Wordle ilhamli: 3 ipucu ile gunun kelimesini tahmin et
// Geri donulebilir: Bu dosya silinirse oyun devre disi kalir.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Dimensions,
  Share,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ContentItem } from '../types';
import { LanguageCode, getTranslation as getUITranslation } from '../utils/translations';
import { getTranslation } from '../utils/contentLoader';
import {
  GuessGameState,
  getGuessGameState,
  saveGuessGameState,
  createNewGuessGameState,
} from '../utils/guessGameStorage';
import {
  GUESS_XP_REWARDS,
  generateHints,
  checkGuess,
  createShareText,
  getDayNumber,
} from '../utils/guessGameHelpers';
import { addXP } from '../utils/storage';

const { width } = Dimensions.get('window');

type DailyGuessGameProps = {
  /** Gunun kelimesi */
  word: ContentItem;
  /** Kullanicinin anadili */
  nativeLanguage: LanguageCode;
  /** Kapat callback'i */
  onClose: () => void;
  /** Opsiyonel: XP kazanildiginda bildir */
  onXPEarned?: (amount: number) => void;
};

const DailyGuessGame: React.FC<DailyGuessGameProps> = ({
  word,
  nativeLanguage,
  onClose,
  onXPEarned,
}) => {
  // Ceviri yardimcisi
  const t = (key: Parameters<typeof getUITranslation>[0]) =>
    getUITranslation(key, nativeLanguage);

  // Oyun state'leri
  const [gameState, setGameState] = useState<GuessGameState | null>(null);
  const [currentHint, setCurrentHint] = useState<number>(0); // 0 = baslangic, 1-3 = ipucu acik
  const [guessInput, setGuessInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [wrongGuess, setWrongGuess] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Ipuculari
  const hints = generateHints(word, nativeLanguage);

  // Animasyonlar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const hintAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const resultScaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Oyun durumunu yukle
  useEffect(() => {
    loadGameState();
    // Giris animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadGameState = async () => {
    const existing = await getGuessGameState();
    if (existing) {
      // Bugun zaten oynandi
      setGameState(existing);
      setCurrentHint(existing.guesses.length);
      if (existing.completed) {
        setShowResult(true);
      }
    } else {
      // Yeni oyun
      const newState = createNewGuessGameState();
      setGameState(newState);
      setCurrentHint(0);
    }
    setIsLoading(false);
  };

  // Ipucu acma animasyonu
  const revealHint = useCallback((hintIndex: number) => {
    if (hintIndex < 0 || hintIndex > 2) return;
    Animated.spring(hintAnims[hintIndex], {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [hintAnims]);

  // Sonraki ipucuya gec
  const moveToNextHint = useCallback(() => {
    if (currentHint >= 3) return;
    const nextHint = currentHint + 1;
    setCurrentHint(nextHint);
    revealHint(nextHint - 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentHint, revealHint]);

  // Ilk ipucuyu goster (oyun baslangici)
  const startGame = useCallback(() => {
    setCurrentHint(1);
    revealHint(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [revealHint]);

  // Yanlis tahmin animasyonu (sallanma)
  const playShakeAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Confetti animasyonu
  const playConfetti = useCallback(() => {
    confettiAnims.forEach((anim, i) => {
      const angle = (i / confettiAnims.length) * Math.PI * 2;
      const distance = 80 + Math.random() * 60;

      anim.opacity.setValue(1);
      anim.translateX.setValue(0);
      anim.translateY.setValue(0);
      anim.rotate.setValue(0);

      Animated.parallel([
        Animated.timing(anim.translateX, {
          toValue: Math.cos(angle) * distance,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: Math.sin(angle) * distance - 40,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 800,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 360,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [confettiAnims]);

  // Sonuc goster
  const showResultScreen = useCallback((won: boolean) => {
    setShowResult(true);
    Animated.spring(resultScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 6,
      useNativeDriver: true,
    }).start();
    if (won) {
      playConfetti();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [resultScaleAnim, playConfetti]);

  // Tahmin gonder
  const submitGuess = useCallback(async () => {
    if (!guessInput.trim() || !gameState) return;

    const isCorrect = checkGuess(guessInput, word.target_word);
    const newGuesses = [...gameState.guesses, guessInput.trim()];

    if (isCorrect) {
      // Dogru tahmin!
      const hintLevel = currentHint as 1 | 2 | 3;
      const xpAmount = GUESS_XP_REWARDS[hintLevel];

      const updatedState: GuessGameState = {
        ...gameState,
        completed: true,
        won: true,
        guessedAtHint: hintLevel,
        guesses: newGuesses,
        xpEarned: xpAmount,
      };

      setGameState(updatedState);
      await saveGuessGameState(updatedState);

      // XP kazan
      await addXP('word_learned', xpAmount);
      onXPEarned?.(xpAmount);

      setGuessInput('');
      showResultScreen(true);
    } else {
      // Yanlis tahmin
      setWrongGuess(true);
      playShakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const updatedState: GuessGameState = {
        ...gameState,
        guesses: newGuesses,
      };

      if (currentHint >= 3) {
        // Son ipucuydu, oyun bitti
        updatedState.completed = true;
        updatedState.won = false;
        updatedState.guessedAtHint = 0;
        updatedState.xpEarned = 0;

        setGameState(updatedState);
        await saveGuessGameState(updatedState);
        setGuessInput('');
        showResultScreen(false);
      } else {
        // Sonraki ipucuya gec
        setGameState(updatedState);
        await saveGuessGameState(updatedState);
        setGuessInput('');

        // Kisa bir gecikme sonra yanlis mesaji kaldir ve ipucu ac
        setTimeout(() => {
          setWrongGuess(false);
          moveToNextHint();
        }, 1200);
      }
    }
  }, [guessInput, gameState, word, currentHint, showResultScreen, playShakeAnimation, moveToNextHint, onXPEarned]);

  // Paylasim
  const handleShare = useCallback(async () => {
    if (!gameState) return;
    const dayNum = getDayNumber();
    const text = createShareText(dayNum, gameState.guessedAtHint);
    try {
      await Share.share({ message: text });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Kullanici iptal etti veya hata olustu
    }
  }, [gameState]);

  // Ipucu karti renderla
  const renderHintCard = (index: number, hintLabel: string, hintValue: string) => {
    const isRevealed = currentHint > index;
    const animValue = hintAnims[index];

    // Ipucu tipleri icin ikonlar
    const hintIcons = ['\u{1F3F7}', '\u{1F522}', '\u{1F520}']; // etiket, sayilar, harfler
    const hintLabelKeys = ['guessHint1Label', 'guessHint2Label', 'guessHint3Label'];

    return (
      <Animated.View
        key={index}
        style={[
          styles.hintCard,
          isRevealed ? styles.hintCardRevealed : styles.hintCardLocked,
          {
            opacity: isRevealed ? animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 1],
            }) : 0.35,
            transform: [{
              scale: isRevealed ? animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }) : 0.95,
            }],
          },
        ]}
      >
        <View style={styles.hintHeader}>
          <Text style={styles.hintIcon}>{isRevealed ? hintIcons[index] : '\u{1F512}'}</Text>
          <Text style={styles.hintLabel}>
            {t(hintLabelKeys[index] as any)}
          </Text>
        </View>
        {isRevealed ? (
          <Text style={styles.hintValue}>{hintValue}</Text>
        ) : (
          <Text style={styles.hintLocked}>???</Text>
        )}
      </Animated.View>
    );
  };

  // Icerik yukleniyor
  if (isLoading) {
    return (
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </LinearGradient>
    );
  }

  // Sonuc ekrani
  if (showResult && gameState?.completed) {
    const won = gameState.won;
    const hintLevel = gameState.guessedAtHint;
    const wordMeaning = getTranslation(word, nativeLanguage);

    // Sonuc mesajlari
    const resultEmojis: Record<number, string> = {
      1: '\u{1F9E0}', // beyin
      2: '\u{1F31F}', // yildiz
      3: '\u{1F44D}', // basparmak
      0: '\u{1F4A1}', // ampul
    };

    return (
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Kapat butonu */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel={t('backToHome')}
          >
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>

          <Animated.View style={[
            styles.resultContainer,
            { transform: [{ scale: resultScaleAnim }] },
          ]}>
            {/* Confetti parcaciklari */}
            {won && confettiAnims.map((anim, i) => {
              const confettiEmojis = ['\u{2728}', '\u{1F389}', '\u{2B50}', '\u{1F4AB}', '\u{1F38A}', '\u{1F31F}', '\u{1FA85}', '\u{2728}'];
              const rotateStr = anim.rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              });
              return (
                <Animated.Text
                  key={`confetti-${i}`}
                  style={[
                    styles.confetti,
                    {
                      opacity: anim.opacity,
                      transform: [
                        { translateX: anim.translateX },
                        { translateY: anim.translateY },
                        { rotate: rotateStr },
                      ],
                    },
                  ]}
                >
                  {confettiEmojis[i]}
                </Animated.Text>
              );
            })}

            {/* Sonuc emojisi */}
            <Text style={styles.resultEmoji}>{resultEmojis[hintLevel]}</Text>

            {/* Sonuc mesaji */}
            <Text style={styles.resultTitle}>
              {won ? t(`guessResultGenius` as any) : t('guessResultMissed' as any)}
            </Text>

            {won && hintLevel === 1 && (
              <Text style={styles.resultSubtitle}>{t('guessResultGenius' as any)}</Text>
            )}
            {won && hintLevel === 2 && (
              <Text style={styles.resultSubtitle}>{t('guessResultGreat' as any)}</Text>
            )}
            {won && hintLevel === 3 && (
              <Text style={styles.resultSubtitle}>{t('guessResultNice' as any)}</Text>
            )}
            {!won && (
              <Text style={styles.resultSubtitle}>{t('guessResultMissed' as any)}</Text>
            )}

            {/* XP kazanimi */}
            {won && (
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>+{gameState.xpEarned} XP</Text>
              </View>
            )}

            {/* Kelimenin kendisi */}
            <LinearGradient
              colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.1)']}
              style={styles.wordRevealCard}
            >
              <Text style={styles.wordRevealEmoji}>{word.emoji || '\u{1F4AC}'}</Text>
              <Text style={styles.wordRevealText}>{word.target_word}</Text>
              <Text style={styles.wordRevealMeaning}>{wordMeaning}</Text>
              {word.pronunciation && (
                <Text style={styles.wordRevealPronunciation}>{word.pronunciation}</Text>
              )}
            </LinearGradient>

            {/* Paylasim butonu */}
            <TouchableOpacity
              onPress={handleShare}
              style={styles.shareButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('guessShare' as any)}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareButtonInner}
              >
                <Text style={styles.shareButtonIcon}>{'\u{1F4E4}'}</Text>
                <Text style={styles.shareButtonText}>{t('guessShare' as any)}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Kapat */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.doneButton}
              activeOpacity={0.7}
            >
              <Text style={styles.doneButtonText}>{t('backToHome')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Ana oyun ekrani
  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={t('backToHome')}
            >
              <Text style={styles.closeIcon}>{'\u2190'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {'\u{1F3AF}'} {t('guessGameTitle' as any)}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Aciklama */}
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>
            <Text style={styles.subtitle}>
              {t('guessGameSubtitle' as any)}
            </Text>

            {/* Gun numarasi */}
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>
                #{getDayNumber()}
              </Text>
            </View>

            {/* Ipucu kartlari */}
            <View style={styles.hintsContainer}>
              {renderHintCard(0, t('guessHint1Label' as any), hints[0])}
              {renderHintCard(1, t('guessHint2Label' as any), `${hints[1]} ${t('guessLetterCount' as any)}`)}
              {renderHintCard(2, t('guessHint3Label' as any), `'${hints[2]}' ${t('guessStartsWith' as any)}`)}
            </View>

            {/* Baslat butonu (henuz baslamadiysa) */}
            {currentHint === 0 && (
              <TouchableOpacity
                onPress={startGame}
                style={styles.startButton}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonInner}
                >
                  <Text style={styles.startButtonText}>
                    {'\u{1F3AE}'} {t('guessStart' as any)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Tahmin alani (oyun basladiysa ve bitmemisse) */}
            {currentHint > 0 && !gameState?.completed && (
              <Animated.View style={[
                styles.guessContainer,
                { transform: [{ translateX: shakeAnim }] },
              ]}>
                {/* Yanlis tahmin mesaji */}
                {wrongGuess && (
                  <View style={styles.wrongGuessMessage}>
                    <Text style={styles.wrongGuessText}>
                      {'\u{274C}'} {t('guessWrong' as any)}
                    </Text>
                  </View>
                )}

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.guessInput}
                    value={guessInput}
                    onChangeText={setGuessInput}
                    placeholder={t('guessPlaceholder' as any)}
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={submitGuess}
                  />
                  <TouchableOpacity
                    onPress={submitGuess}
                    style={[
                      styles.submitButton,
                      !guessInput.trim() && styles.submitButtonDisabled,
                    ]}
                    disabled={!guessInput.trim()}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('guessSubmit' as any)}
                  >
                    <Text style={styles.submitButtonText}>
                      {t('guessSubmit' as any)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Kalan tahmin hakki */}
                <Text style={styles.remainingHints}>
                  {t('guessHintProgress' as any)}: {currentHint}/3
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeIcon: { fontSize: 20, color: '#FFFFFF', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerPlaceholder: { width: 42 },

  // Alt baslik
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },

  // Gun numarasi
  dayBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 24,
  },
  dayBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A78BFA',
  },

  // Ipucu kartlari
  hintsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  hintCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  hintCardRevealed: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderColor: 'rgba(99,102,241,0.2)',
  },
  hintCardLocked: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  hintIcon: { fontSize: 18 },
  hintLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hintValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hintLocked: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.15)',
  },

  // Baslat butonu
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonInner: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Tahmin alani
  guessContainer: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  guessInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(99,102,241,0.3)',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  remainingHints: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
  wrongGuessMessage: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  wrongGuessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F87171',
  },

  // Sonuc ekrani
  resultContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  xpBadge: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  xpBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FBBF24',
  },

  // Kelime aciklama karti
  wordRevealCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  wordRevealEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  wordRevealText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  wordRevealMeaning: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 4,
  },
  wordRevealPronunciation: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(167,139,250,0.6)',
    fontStyle: 'italic',
  },

  // Paylasim butonu
  shareButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 12,
  },
  shareButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  shareButtonIcon: { fontSize: 18 },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Kapat butonu
  doneButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },

  // Confetti
  confetti: {
    position: 'absolute',
    fontSize: 24,
    top: 60,
  },
});

export default DailyGuessGame;
