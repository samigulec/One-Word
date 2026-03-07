import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ContentItem, ProficiencyLevel } from '../types';
import { loadContentForLevel, getTranslation as getWordTranslation } from '../utils/contentLoader';
import { recordQuizResult, addXP, XP_REWARDS, checkAndUnlockAchievements } from '../utils/storage';
import { getTranslation, LanguageCode } from '../utils/translations';

const { width } = Dimensions.get('window');

type QuizScreenProps = {
  word: ContentItem;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  proficiencyLevel: ProficiencyLevel;
  onClose: () => void;
};

const QuizScreen: React.FC<QuizScreenProps> = ({
  word,
  nativeLanguage,
  targetLanguage,
  proficiencyLevel,
  onClose,
}) => {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);

  const correctAnswer = getWordTranslation(word, nativeLanguage);

  // Generate 3 wrong answers from content pool
  const options = useMemo(() => {
    const allContent = loadContentForLevel(targetLanguage, proficiencyLevel);
    const wrongWords = allContent
      .filter(item => item.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(item => getWordTranslation(item, nativeLanguage));

    const allOptions = [correctAnswer, ...wrongWords];
    // Shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }
    return allOptions;
  }, [word.id]);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [xpGained, setXpGained] = useState(0);

  // Animations
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const xpSlide = useRef(new Animated.Value(30)).current;
  const xpOpacity = useRef(new Animated.Value(0)).current;
  const optionAnims = useRef(options.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    optionAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: 200 + i * 100,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer) return;

    const correct = answer === correctAnswer;
    setSelectedAnswer(answer);
    setIsCorrect(correct);

    Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );

    await recordQuizResult(correct);

    const baseXP = correct ? XP_REWARDS.QUIZ_CORRECT : XP_REWARDS.QUIZ_WRONG;
    const result = await addXP(baseXP);
    setXpGained(result.newXP);

    await checkAndUnlockAchievements();

    // Show result animation
    Animated.parallel([
      Animated.spring(resultScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(xpSlide, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
      Animated.timing(xpOpacity, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  };

  const getOptionStyle = (option: string) => {
    if (!selectedAnswer) return {};
    if (option === correctAnswer) return { borderColor: '#10B981', borderWidth: 2 };
    if (option === selectedAnswer && !isCorrect) return { borderColor: '#EF4444', borderWidth: 2 };
    return { opacity: 0.4 };
  };

  const getOptionColors = (option: string): [string, string] => {
    if (!selectedAnswer) return ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)'];
    if (option === correctAnswer) return ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.1)'];
    if (option === selectedAnswer && !isCorrect) return ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.1)'];
    return ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)'];
  };

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'\u{1F9E0}'} {t('quizTitle')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Quiz Card */}
        <Animated.View style={[styles.quizCard, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          <Text style={styles.questionLabel}>{t('whatMeans')}</Text>
          <View style={styles.wordBadge}>
            <Text style={styles.wordText}>{word.target_word}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <Animated.View
                key={index}
                style={{
                  opacity: optionAnims[index],
                  transform: [{
                    translateY: optionAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }}
              >
                <TouchableOpacity
                  onPress={() => handleAnswer(option)}
                  activeOpacity={0.7}
                  disabled={!!selectedAnswer}
                >
                  <LinearGradient
                    colors={getOptionColors(option)}
                    style={[styles.optionButton, getOptionStyle(option)]}
                  >
                    <Text style={styles.optionLetter}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text style={styles.optionText}>{option}</Text>
                    {selectedAnswer && option === correctAnswer && (
                      <Text style={styles.checkMark}>{'\u2713'}</Text>
                    )}
                    {selectedAnswer && option === selectedAnswer && !isCorrect && (
                      <Text style={styles.crossMark}>{'\u2717'}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Result */}
        {selectedAnswer && (
          <Animated.View style={[styles.resultContainer, { opacity: resultOpacity, transform: [{ scale: resultScale }] }]}>
            <LinearGradient
              colors={isCorrect ? ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)'] : ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)']}
              style={styles.resultCard}
            >
              <Text style={styles.resultEmoji}>
                {isCorrect ? '\u{1F389}' : '\u{1F4AA}'}
              </Text>
              <Text style={[styles.resultText, { color: isCorrect ? '#6EE7B7' : '#FCA5A5' }]}>
                {isCorrect ? t('correct') : t('wrong')}
              </Text>

              {!isCorrect && (
                <Text style={styles.correctAnswerText}>
                  {t('correctAnswer')}: {correctAnswer}
                </Text>
              )}

              <Animated.View style={[styles.xpBadge, { opacity: xpOpacity, transform: [{ translateY: xpSlide }] }]}>
                <Text style={styles.xpText}>+{xpGained} {t('xpPoints')}</Text>
              </Animated.View>
            </LinearGradient>

            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.continueButton}
              >
                <Text style={styles.continueText}>{t('nextWord')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
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
  closeIcon: { fontSize: 20, color: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  placeholder: { width: 42 },

  quizCard: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 16,
  },
  wordBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    marginBottom: 32,
  },
  wordText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#818CF8',
    marginRight: 14,
    width: 24,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  checkMark: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: '700',
  },
  crossMark: {
    fontSize: 20,
    color: '#EF4444',
    fontWeight: '700',
  },

  resultContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  resultCard: {
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  correctAnswerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  xpBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  xpText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FBBF24',
  },

  continueButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default QuizScreen;
