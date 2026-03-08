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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ContentItem, SRSData, LearnedWord } from '../types';
import { LanguageCode, getTranslation } from '../utils/translations';
import { getDueWordsForToday, updateWordSRS, getLearnedWords, addXP } from '../utils/storage';
import { getConfidenceColor } from '../utils/srs';

const { width } = Dimensions.get('window');

type ReviewScreenProps = {
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  onClose: () => void;
};

// Degerlendirme butonlari icin sabit degerler
const QUALITY_OPTIONS = [
  { quality: 1, key: 'didntKnow' as const, color: '#EF4444', emoji: '\u274C' },
  { quality: 2, key: 'hardButKnew' as const, color: '#F59E0B', emoji: '\u{1F914}' },
  { quality: 3, key: 'knew' as const, color: '#FBBF24', emoji: '\u{1F44D}' },
  { quality: 4, key: 'easy' as const, color: '#34D399', emoji: '\u{1F44F}' },
  { quality: 5, key: 'tooEasy' as const, color: '#10B981', emoji: '\u{1F525}' },
];

const ReviewScreen: React.FC<ReviewScreenProps> = ({ nativeLanguage, targetLanguage, onClose }) => {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);

  const [dueWords, setDueWords] = useState<SRSData[]>([]);
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Animasyonlar
  const cardFlip = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const completeScale = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(50)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

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

  const handleShowAnswer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAnswer(true);

    // Kart cevirme animasyonu
    Animated.parallel([
      Animated.spring(cardFlip, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(buttonSlide, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleQualitySelect = async (quality: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrentIndex(nextIndex);
      setShowAnswer(false);
      cardFlip.setValue(0);
      buttonSlide.setValue(50);
      buttonOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const currentWord = getCurrentWord();

  // Yukleniyor
  if (isLoading) {
    return (
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
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
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
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

            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={{ width: '100%', paddingHorizontal: 40, marginTop: 32 }}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
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
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
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

        {/* Kart */}
        <View style={styles.cardWrapper}>
          <Animated.View style={[styles.cardContainer, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
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

              {/* Cevap goster / Anlam */}
              {!showAnswer ? (
                <TouchableOpacity onPress={handleShowAnswer} activeOpacity={0.8} style={{ width: '100%', marginTop: 24 }}>
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.showAnswerButton}
                  >
                    <Text style={styles.showAnswerIcon}>{'\u{1F4A1}'}</Text>
                    <Text style={styles.showAnswerText}>{t('showMeaning')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <Animated.View style={[styles.answerContainer, {
                  opacity: cardFlip,
                  transform: [{
                    translateY: cardFlip.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }]}>
                  <View style={styles.answerDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerLabel}>{t('meaning')}</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <Text style={styles.meaningText}>{meaning}</Text>
                  {currentWord?.pronunciation && (
                    <Text style={styles.pronunciationText}>{currentWord.pronunciation}</Text>
                  )}
                </Animated.View>
              )}
            </LinearGradient>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  placeholder: { width: 42 },
  counterBadge: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  counterText: { fontSize: 14, fontWeight: '700', color: '#A78BFA' },

  // Ilerleme cubugu
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },

  // Kart
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: width - 40,
    borderRadius: 28,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  card: {
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  levelBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  wordEmoji: {
    fontSize: 48,
    marginTop: 8,
    marginBottom: 4,
  },
  wordText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Cevap goster butonu
  showAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  showAnswerIcon: { fontSize: 18, marginRight: 8 },
  showAnswerText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // Cevap alani
  answerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  answerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 12,
  },
  meaningText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6EE7B7',
    textAlign: 'center',
    lineHeight: 32,
  },
  pronunciationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Degerlendirme butonlari
  qualityContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  qualityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 12,
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
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  qualityEmoji: { fontSize: 20, marginBottom: 4 },
  qualityLabel: { fontSize: 10, fontWeight: '700' },

  // Yukleniyor
  loadingEmoji: { fontSize: 48, marginBottom: 16 },
  loadingText: { fontSize: 16, color: 'rgba(255,255,255,0.6)' },

  // Tamamlandi
  completeEmoji: { fontSize: 72, marginBottom: 20 },
  completeTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  completeHint: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
  completeStats: { flexDirection: 'row', marginTop: 24 },
  completeStat: { alignItems: 'center', marginHorizontal: 20 },
  completeStatValue: { fontSize: 32, fontWeight: '800', color: '#A78BFA' },
  completeStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase' },

  // Geri don butonu
  backButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  backButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

export default ReviewScreen;
