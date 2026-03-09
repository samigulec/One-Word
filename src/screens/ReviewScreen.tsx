import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ContentItem, SRSData, LearnedWord } from '../types';
import { LanguageCode, getTranslation } from '../utils/translations';
import { getDueWordsForToday, updateWordSRS, getLearnedWords, addXP } from '../utils/storage';
import { getConfidenceColor } from '../utils/srs';
import { FONTS, COLORS, SPACING, RADIUS } from '../utils/theme';

const { width } = Dimensions.get('window');

// Swipe tetikleme esik degeri (piksel)
const SWIPE_THRESHOLD = 100;
// Swipe animasyonu icin maksimum egim (derece)
const MAX_TILT_DEGREES = 15;
// Kart ekran disina cikis mesafesi
const SWIPE_OUT_DISTANCE = width * 1.5;

type ReviewScreenProps = {
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  onClose: () => void;
};

// Degerlendirme butonlari icin sabit degerler
const QUALITY_OPTIONS = [
  { quality: 1, key: 'didntKnow' as const, color: COLORS.error, emoji: '\u274C' },
  { quality: 2, key: 'hardButKnew' as const, color: COLORS.warning, emoji: '\u{1F914}' },
  { quality: 3, key: 'knew' as const, color: '#FBBF24', emoji: '\u{1F44D}' },
  { quality: 4, key: 'easy' as const, color: '#34D399', emoji: '\u{1F44F}' },
  { quality: 5, key: 'tooEasy' as const, color: COLORS.success, emoji: '\u{1F525}' },
];

const ReviewScreen: React.FC<ReviewScreenProps> = ({ nativeLanguage, targetLanguage, onClose }) => {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);

  const [dueWords, setDueWords] = useState<SRSData[]>([]);
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Swipe islemi devam ederken buton tiklamalarini engelle
  const [isSwiping, setIsSwiping] = useState(false);

  // Animasyonlar
  const cardFlip = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const completeScale = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(50)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Swipe animasyon degerleri
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Swipe flash animasyonu
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState<string>(COLORS.success);

  // showAnswer state'ine ref ile erisim (PanResponder closure icin)
  const showAnswerRef = useRef(false);
  useEffect(() => {
    showAnswerRef.current = showAnswer;
  }, [showAnswer]);

  // PanResponder -- kart uzerinde swipe hareketi icin
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        // Sadece cevap gosterildikten sonra ve yatay hareket varsa swipe baslatilir
        if (!showAnswerRef.current) return false;
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        setIsSwiping(true);
      },
      onPanResponderMove: (_evt, gestureState) => {
        // Kart pozisyonunu guncelle
        swipeX.setValue(gestureState.dx);
        // Overlay opakligi: mesafeye oranli
        const progress = Math.min(Math.abs(gestureState.dx) / SWIPE_THRESHOLD, 1);
        swipeOverlayOpacity.setValue(progress * 0.4);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (Math.abs(gestureState.dx) >= SWIPE_THRESHOLD) {
          // Esik asildiysa swipe tamamlanir
          handleSwipeComplete(gestureState.dx > 0 ? 'right' : 'left');
        } else {
          // Esik asilmadiysa kart eski yerine doner
          resetSwipePosition();
        }
      },
      onPanResponderTerminate: () => {
        resetSwipePosition();
      },
    })
  ).current;

  // Swipe pozisyonunu sifirla
  const resetSwipePosition = () => {
    Animated.parallel([
      Animated.spring(swipeX, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(swipeOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSwiping(false);
    });
  };

  // Swipe tamamlandiginda cagrilir
  const handleSwipeComplete = (direction: 'left' | 'right') => {
    const targetX = direction === 'right' ? SWIPE_OUT_DISTANCE : -SWIPE_OUT_DISTANCE;
    const color = direction === 'right' ? COLORS.success : COLORS.error;
    // Saga kaydir = biliyorum (quality 4), sola = bilmiyorum (quality 1)
    const quality = direction === 'right' ? 4 : 1;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Flash rengi ayarla
    setFlashColor(color);

    // Karti ekran disina animasyonla cikart + flash goster
    Animated.parallel([
      Animated.timing(swipeX, {
        toValue: targetX,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.6,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Degerlendirmeyi kaydet
      processQualityResult(quality, true);
    });
  };

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    const due = await getDueWordsForToday();
    const learned = await getLearnedWords();
    setDueWords(due);
    setLearnedWords(learned);
    setIsLoading(false);

    if (due.length === 0) {
      setIsComplete(true);
      return;
    }

    // Kart giris animasyonu
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  // Mevcut kelimenin ContentItem verisini bul
  const getCurrentWord = (): ContentItem | null => {
    if (currentIndex >= dueWords.length) return null;
    const srs = dueWords[currentIndex];
    const learned = learnedWords.find(w => w.word.id === srs.wordId);
    return learned?.word || null;
  };

  // 3D kart cevirme icin rotateY interpolasyonlari
  const frontRotation = cardFlip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotation = cardFlip.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  // On yuzun gorunurlugu -- yari dondukten sonra gizle
  const frontOpacity = cardFlip.interpolate({
    inputRange: [0, 0.5, 0.5],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  // Arka yuzun gorunurlugu -- yari dondukten sonra goster
  const backOpacity = cardFlip.interpolate({
    inputRange: [0, 0.5, 0.5],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const handleShowAnswer = () => {
    if (isSwiping) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAnswer(true);

    // 3D kart cevirme animasyonu -- rotateY ile 400ms
    Animated.parallel([
      Animated.timing(cardFlip, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(buttonSlide, { toValue: 0, duration: 300, delay: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 300, delay: 200, useNativeDriver: true }),
    ]).start();
  };

  // Mevcut buton tiklamasini yoneten fonksiyon (eski handleQualitySelect)
  const handleQualitySelect = async (quality: number) => {
    if (isSwiping) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await processQualityResult(quality, false);
  };

  // Hem swipe hem butondan gelen degerlendirmeleri isleten ortak fonksiyon
  // fromSwipe: swipe ile mi yoksa buton ile mi cagirildi
  const processQualityResult = async (quality: number, fromSwipe: boolean) => {
    const srs = dueWords[currentIndex];
    await updateWordSRS(srs.wordId, quality);

    // Her tekrar edilen kelime icin XP ver
    await addXP('review_word');

    const nextIndex = currentIndex + 1;

    // Ilerleme cubugu animasyonu
    Animated.timing(progressWidth, {
      toValue: nextIndex / dueWords.length,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (nextIndex >= dueWords.length) {
      // Tamamlandi -- review_completed XP
      await addXP('review_completed');
      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(completeScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }).start();
      return;
    }

    // Sonraki karta gec animasyonu
    const animateOut = fromSwipe
      ? // Swipe'dan geldiyse kart zaten ekran disinda, sadece opacity'yi sifirla
        Animated.timing(cardOpacity, { toValue: 0, duration: 50, useNativeDriver: true })
      : // Butondan geldiyse normal cikis animasyonu
        Animated.parallel([
          Animated.timing(cardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(cardScale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        ]);

    animateOut.start(() => {
      setCurrentIndex(nextIndex);
      setShowAnswer(false);
      setIsSwiping(false);

      // Animasyon degerlerini sifirla
      cardFlip.setValue(0);
      buttonSlide.setValue(50);
      buttonOpacity.setValue(0);
      swipeX.setValue(0);
      swipeOverlayOpacity.setValue(0);

      if (fromSwipe) {
        cardScale.setValue(0.9);
      }

      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const currentWord = getCurrentWord();

  // Kart egim hesaplama (swipe yonune gore)
  const cardTiltRotation = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: [`-${MAX_TILT_DEGREES}deg`, '0deg', `${MAX_TILT_DEGREES}deg`],
    extrapolate: 'clamp',
  });

  // Overlay rengi: saga kaydirilirsa yesil, sola kaydirilirsa kirmizi
  const overlayColor = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -1, 0, 1, SWIPE_THRESHOLD],
    outputRange: [COLORS.error, COLORS.error, 'transparent', COLORS.success, COLORS.success],
    extrapolate: 'clamp',
  });

  // Swipe gostergesi opakligi (sol taraf -- bilmiyorum)
  const leftIndicatorOpacity = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -20, 0],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  // Swipe gostergesi opakligi (sag taraf -- biliyorum)
  const rightIndicatorOpacity = swipeX.interpolate({
    inputRange: [0, 20, SWIPE_THRESHOLD],
    outputRange: [0, 0.3, 1],
    extrapolate: 'clamp',
  });

  // Yukleniyor
  if (isLoading) {
    return (
      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary, '#251B5E']} style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.loadingEmoji}>{'\u{1F504}'}</Text>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Tamamlandi veya tekrar edilecek kelime yok
  if (isComplete) {
    return (
      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary, '#251B5E']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>{'\u2190'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{'\u{1F504}'} {t('reviewTime')}</Text>
            <View style={styles.placeholder} />
          </View>

          <Animated.View style={[styles.centered, { transform: [{ scale: dueWords.length > 0 ? completeScale : 1 }] }]}>
            <Text style={styles.completeEmoji}>
              {dueWords.length > 0 ? '\u{1F389}' : '\u2728'}
            </Text>
            <Text style={styles.completeTitle}>
              {dueWords.length > 0 ? t('reviewComplete') : t('noReviewsToday')}
            </Text>
            <Text style={styles.completeHint}>
              {dueWords.length > 0 ? t('reviewCompleteHint') : t('noReviewsHint')}
            </Text>

            {dueWords.length > 0 && (
              <View style={styles.completeStats}>
                <View style={styles.completeStat}>
                  <Text style={styles.completeStatValue}>{dueWords.length}</Text>
                  <Text style={styles.completeStatLabel}>{t('words')}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={{ width: '100%', paddingHorizontal: 40, marginTop: SPACING.xxxl }}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>{t('backToHome')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Kelime tekrar karti
  const meaning = currentWord
    ? (currentWord.translations[nativeLanguage] || currentWord.translations['en'] || '')
    : '';

  return (
    <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary, '#251B5E']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Swipe flash efekti -- tam ekran renk parlama */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flashOverlay,
            {
              backgroundColor: flashColor,
              opacity: flashOpacity,
            },
          ]}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'\u{1F504}'} {t('reviewTime')}</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{currentIndex + 1}/{dueWords.length}</Text>
          </View>
        </View>

        {/* Ilerleme cubugu */}
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Swipe ipucu gostergeleri -- ekranin iki yaninda */}
        {showAnswer && (
          <>
            <Animated.View style={[styles.swipeIndicator, styles.swipeIndicatorLeft, { opacity: leftIndicatorOpacity }]}>
              <Text style={styles.swipeIndicatorEmoji}>{'\u274C'}</Text>
              <Text style={[styles.swipeIndicatorText, { color: COLORS.error }]}>
                {t('didntKnow')}
              </Text>
            </Animated.View>
            <Animated.View style={[styles.swipeIndicator, styles.swipeIndicatorRight, { opacity: rightIndicatorOpacity }]}>
              <Text style={styles.swipeIndicatorEmoji}>{'\u2705'}</Text>
              <Text style={[styles.swipeIndicatorText, { color: COLORS.success }]}>
                {t('easy')}
              </Text>
            </Animated.View>
          </>
        )}

        {/* Kart -- 3D flip animasyonu + swipe gesture destegi */}
        <View style={styles.cardWrapper}>
          <Animated.View
            style={[
              styles.cardContainer,
              {
                opacity: cardOpacity,
                transform: [
                  { scale: cardScale },
                  // Cevap gosterildikten sonra swipe hareketi ile kaydirma
                  { translateX: showAnswer ? swipeX : 0 },
                  // Swipe yonune dogru hafif egim
                  { rotate: showAnswer ? cardTiltRotation : '0deg' },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* On Yuz -- kelime ve ornek cumle */}
            <Animated.View style={[styles.flipCardFace, {
              opacity: frontOpacity,
              transform: [{ perspective: 1000 }, { rotateY: frontRotation }],
            }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
                style={styles.card}
              >
                {/* Seviye badge */}
                {currentWord && (
                  <LinearGradient
                    colors={[getConfidenceColor(dueWords[currentIndex]?.confidence || 0), `${getConfidenceColor(dueWords[currentIndex]?.confidence || 0)}99`]}
                    style={styles.levelBadge}
                  >
                    <Text style={styles.levelText}>{currentWord.level}</Text>
                  </LinearGradient>
                )}

                {/* Kelime emojisi */}
                {currentWord?.emoji && <Text style={styles.wordEmoji}>{currentWord.emoji}</Text>}

                {/* Hedef kelime */}
                <Text style={styles.wordText}>{currentWord?.target_word || ''}</Text>

                {/* Ornek cumle */}
                <Text style={styles.exampleText}>"{currentWord?.example_sentence || ''}"</Text>

                {/* Cevap goster butonu */}
                <TouchableOpacity onPress={handleShowAnswer} activeOpacity={0.8} style={{ width: '100%', marginTop: SPACING.xxl }}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.showAnswerButton}
                  >
                    <Text style={styles.showAnswerIcon}>{'\u{1F4A1}'}</Text>
                    <Text style={styles.showAnswerText}>{t('showMeaning')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            {/* Arka Yuz -- anlam ve telaffuz */}
            <Animated.View style={[styles.flipCardFace, styles.flipCardBack, {
              opacity: backOpacity,
              transform: [{ perspective: 1000 }, { rotateY: backRotation }],
            }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
                style={styles.card}
              >
                {/* Swipe renk overlay'i -- kart uzerinde */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.cardOverlay,
                    {
                      backgroundColor: overlayColor as unknown as string,
                      opacity: swipeOverlayOpacity,
                    },
                  ]}
                />

                {/* Seviye badge */}
                {currentWord && (
                  <LinearGradient
                    colors={[getConfidenceColor(dueWords[currentIndex]?.confidence || 0), `${getConfidenceColor(dueWords[currentIndex]?.confidence || 0)}99`]}
                    style={styles.levelBadge}
                  >
                    <Text style={styles.levelText}>{currentWord.level}</Text>
                  </LinearGradient>
                )}

                {/* Kelime emojisi */}
                {currentWord?.emoji && <Text style={styles.wordEmoji}>{currentWord.emoji}</Text>}

                {/* Hedef kelime */}
                <Text style={styles.wordText}>{currentWord?.target_word || ''}</Text>

                {/* Anlam alani */}
                <View style={styles.answerContainer}>
                  <View style={styles.answerDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerLabel}>{t('meaning')}</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <Text style={styles.meaningText}>{meaning}</Text>
                  {currentWord?.pronunciation && (
                    <Text style={styles.pronunciationText}>{currentWord.pronunciation}</Text>
                  )}

                  {/* Swipe ipucu -- cevap gosterildiginde kart icerisinde */}
                  <View style={styles.swipeHintContainer}>
                    <Text style={styles.swipeHintText}>
                      {'\u2190'} {t('didntKnow')}  |  {t('easy')} {'\u2192'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Degerlendirme butonlari */}
        {showAnswer && (
          <Animated.View style={[styles.qualityContainer, { opacity: buttonOpacity, transform: [{ translateY: buttonSlide }] }]}>
            <Text style={styles.qualityTitle}>{t('howWellDoYouKnow')}</Text>
            <View style={styles.qualityButtons}>
              {QUALITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.quality}
                  onPress={() => handleQualitySelect(option.quality)}
                  activeOpacity={0.7}
                  style={styles.qualityButtonWrapper}
                  disabled={isSwiping}
                >
                  <LinearGradient
                    colors={[`${option.color}30`, `${option.color}15`]}
                    style={[styles.qualityButton, { borderColor: `${option.color}50` }]}
                  >
                    <Text style={styles.qualityEmoji}>{option.emoji}</Text>
                    <Text style={[styles.qualityLabel, { color: option.color }]}>
                      {t(option.key)}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },

  // Tam ekran flash efekti
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  closeButton: {
    backgroundColor: COLORS.bgCard,
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  closeIcon: { fontSize: FONTS.xl, color: COLORS.textPrimary, fontWeight: FONTS.semibold },
  headerTitle: { fontSize: 18, fontWeight: FONTS.extrabold, color: COLORS.textPrimary },
  placeholder: { width: 42 },
  counterBadge: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  counterText: { fontSize: 14, fontWeight: FONTS.bold, color: COLORS.secondaryLight },

  // Ilerleme cubugu
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xl,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
  },

  // Swipe gostergeleri -- ekranin iki yaninda gorunen ikonlar
  swipeIndicator: {
    position: 'absolute',
    top: '45%',
    zIndex: 5,
    alignItems: 'center',
  },
  swipeIndicatorLeft: {
    left: SPACING.sm,
  },
  swipeIndicatorRight: {
    right: SPACING.sm,
  },
  swipeIndicatorEmoji: {
    fontSize: FONTS.xxxl,
    marginBottom: SPACING.xs,
  },
  swipeIndicatorText: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Kart
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  cardContainer: {
    width: width - 40,
    borderRadius: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  // 3D flip kart yuzleri -- on ve arka yuz icin ortak stil
  flipCardFace: {
    width: '100%',
    backfaceVisibility: 'hidden',
  },
  // Arka yuz -- on yuzun uzerine pozisyonlanir
  flipCardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  card: {
    borderRadius: 28,
    padding: SPACING.xxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  // Kart uzerinde swipe renk katmani
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  levelBadge: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  levelText: { fontSize: FONTS.md - 3, fontWeight: FONTS.extrabold, color: COLORS.textPrimary },
  wordEmoji: {
    fontSize: 48,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  wordText: {
    fontSize: 34,
    fontWeight: FONTS.extrabold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  exampleText: {
    fontSize: FONTS.md,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: FONTS.md * FONTS.lineHeightNormal,
  },

  // Cevap goster butonu
  showAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  showAnswerIcon: { fontSize: 18, marginRight: SPACING.sm },
  showAnswerText: { fontSize: FONTS.lg - 1, fontWeight: FONTS.bold, color: COLORS.textPrimary },

  // Cevap alani
  answerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  answerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerLabel: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: SPACING.md,
  },
  meaningText: {
    fontSize: FONTS.xxl - 2,
    fontWeight: FONTS.bold,
    color: '#6EE7B7',
    textAlign: 'center',
    lineHeight: (FONTS.xxl - 2) * FONTS.lineHeightNormal,
  },
  pronunciationText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },

  // Swipe ipucu metni -- kart icerisinde
  swipeHintContainer: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.sm,
  },
  swipeHintText: {
    fontSize: FONTS.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontWeight: FONTS.medium,
  },

  // Degerlendirme butonlari
  qualityContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  qualityTitle: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  qualityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qualityButtonWrapper: {
    flex: 1,
    marginHorizontal: 3,
  },
  qualityButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  qualityEmoji: { fontSize: FONTS.xl, marginBottom: SPACING.xs },
  qualityLabel: { fontSize: 10, fontWeight: FONTS.bold },

  // Yukleniyor
  loadingEmoji: { fontSize: 48, marginBottom: SPACING.lg },
  loadingText: { fontSize: FONTS.lg - 1, color: 'rgba(255,255,255,0.6)' },

  // Tamamlandi
  completeEmoji: { fontSize: 72, marginBottom: SPACING.xl },
  completeTitle: { fontSize: FONTS.xxl, fontWeight: FONTS.extrabold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  completeHint: { fontSize: FONTS.md, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: FONTS.md * FONTS.lineHeightNormal },
  completeStats: { flexDirection: 'row', marginTop: SPACING.xxl },
  completeStat: { alignItems: 'center', marginHorizontal: SPACING.xl },
  completeStatValue: { fontSize: FONTS.xxxl, fontWeight: FONTS.extrabold, color: COLORS.secondaryLight },
  completeStatLabel: { fontSize: FONTS.md - 3, color: COLORS.textTertiary, marginTop: SPACING.xs, textTransform: 'uppercase' },

  // Geri don butonu
  backButton: {
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  backButtonText: { fontSize: FONTS.lg - 1, fontWeight: FONTS.bold, color: COLORS.textPrimary },
});

export default ReviewScreen;
