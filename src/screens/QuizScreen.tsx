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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { QuizQuestion, QuizResult, LearnedWord } from '../types';
import { LanguageCode, getTranslation } from '../utils/translations';
import { getLearnedWords, updateWordSRS, addXP } from '../utils/storage';
import { generateQuizQuestions, checkTypeAnswer, calculateQuizScore, scoreToConfidence } from '../utils/quiz';

const { width } = Dimensions.get('window');

type QuizScreenProps = {
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  onClose: () => void;
};

// Secenek harfleri
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// Coktan secmeli soru bileseni - gelistirilmis
const MultipleChoiceView: React.FC<{
  question: QuizQuestion;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  t: (key: any) => string;
}> = ({ question, onAnswer, t }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  // Her secenek icin giris animasyonu
  const optionAnims = useRef(
    (question.options || []).map((_, i) => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Secenekleri sirayla goster
    optionAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: i * 80,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleSelect = (option: string) => {
    if (revealed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(option);
    setRevealed(true);
    const isCorrect = option === question.correctAnswer;
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Yanlis cevap icin shake efekti
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    setTimeout(() => onAnswer(option, isCorrect), 1200);
  };

  const getOptionStyle = (option: string) => {
    if (!revealed) return {};
    if (option === question.correctAnswer) return { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.12)' };
    if (option === selected) return { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.12)' };
    return { opacity: 0.4 };
  };

  const getOptionTextColor = (option: string) => {
    if (!revealed) return 'rgba(255,255,255,0.85)';
    if (option === question.correctAnswer) return '#34D399';
    if (option === selected) return '#F87171';
    return 'rgba(255,255,255,0.3)';
  };

  const getLetterStyle = (option: string) => {
    if (!revealed) return { backgroundColor: 'rgba(99,102,241,0.15)', color: '#A78BFA' };
    if (option === question.correctAnswer) return { backgroundColor: 'rgba(16,185,129,0.2)', color: '#34D399' };
    if (option === selected) return { backgroundColor: 'rgba(239,68,68,0.2)', color: '#F87171' };
    return { backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' };
  };

  return (
    <Animated.View style={[mcStyles.container, { transform: [{ translateX: shakeAnim }] }]}>
      <Text style={mcStyles.questionLabel}>{t('whatDoesThisMean')}</Text>
      <View style={mcStyles.wordRow}>
        {question.word.emoji && <Text style={mcStyles.wordEmoji}>{question.word.emoji}</Text>}
        <Text style={mcStyles.wordText}>{question.word.target_word}</Text>
      </View>
      <Text style={mcStyles.exampleText}>"{question.word.example_sentence}"</Text>

      <View style={mcStyles.optionsContainer}>
        {question.options?.map((option, i) => {
          const letterStyle = getLetterStyle(option);
          return (
            <Animated.View
              key={i}
              style={{
                opacity: optionAnims[i],
                transform: [{
                  translateY: optionAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              }}
            >
              <TouchableOpacity
                onPress={() => handleSelect(option)}
                disabled={revealed}
                activeOpacity={0.7}
                style={[mcStyles.option, getOptionStyle(option)]}
              >
                <View style={[mcStyles.optionLetter, { backgroundColor: letterStyle.backgroundColor }]}>
                  <Text style={[mcStyles.optionLetterText, { color: letterStyle.color }]}>
                    {OPTION_LETTERS[i]}
                  </Text>
                </View>
                <Text style={[mcStyles.optionText, { color: getOptionTextColor(option) }]}>
                  {option}
                </Text>
                {revealed && option === question.correctAnswer && (
                  <Text style={mcStyles.checkMark}>{'\u2713'}</Text>
                )}
                {revealed && option === selected && option !== question.correctAnswer && (
                  <Text style={mcStyles.crossMark}>{'\u2717'}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const mcStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  questionLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  wordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  wordEmoji: { fontSize: 28, marginRight: 8 },
  wordText: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  exampleText: { fontSize: 14, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  optionsContainer: { width: '100%' },
  option: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterText: { fontSize: 13, fontWeight: '800' },
  optionText: { fontSize: 15, fontWeight: '600', flex: 1 },
  checkMark: { fontSize: 18, color: '#10B981', fontWeight: '700' },
  crossMark: { fontSize: 18, color: '#EF4444', fontWeight: '700' },
});

// Flashcard bileseni - gelistirilmis
const FlashcardView: React.FC<{
  question: QuizQuestion;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  t: (key: any) => string;
}> = ({ question, onAnswer, t }) => {
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const handleFlip = () => {
    if (flipped) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFlipped(true);
    Animated.parallel([
      Animated.spring(flipAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(buttonSlide, { toValue: 0, duration: 400, delay: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleKnew = (knew: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (knew) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onAnswer(knew ? question.correctAnswer : '', knew);
  };

  return (
    <View style={fcStyles.container}>
      <TouchableOpacity onPress={handleFlip} activeOpacity={0.9} style={fcStyles.cardTouchable}>
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
          style={fcStyles.card}
        >
          <View style={fcStyles.cardInner}>
            {question.word.emoji && <Text style={fcStyles.wordEmoji}>{question.word.emoji}</Text>}
            <Text style={fcStyles.wordText}>{question.word.target_word}</Text>
            <Text style={fcStyles.exampleText}>"{question.word.example_sentence}"</Text>

            {!flipped ? (
              <View style={fcStyles.flipHint}>
                <Text style={fcStyles.flipHintIcon}>{'\u{1F447}'}</Text>
                <Text style={fcStyles.flipHintText}>{t('tapToFlip')}</Text>
              </View>
            ) : (
              <Animated.View style={[fcStyles.answerContainer, {
                opacity: flipAnim,
                transform: [{ translateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }],
              }]}>
                <View style={fcStyles.divider} />
                <Text style={fcStyles.meaningLabel}>{t('meaning')}</Text>
                <Text style={fcStyles.meaningText}>{question.correctAnswer}</Text>
              </Animated.View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {flipped && (
        <Animated.View style={[fcStyles.buttonsRow, {
          opacity: buttonOpacity,
          transform: [{ translateY: buttonSlide }],
        }]}>
          <TouchableOpacity onPress={() => handleKnew(false)} activeOpacity={0.7} style={fcStyles.buttonWrapper}>
            <View style={[fcStyles.button, fcStyles.buttonWrong]}>
              <Text style={[fcStyles.buttonText, { color: '#F87171' }]}>{t('iDidntKnowIt')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleKnew(true)} activeOpacity={0.7} style={fcStyles.buttonWrapper}>
            <View style={[fcStyles.button, fcStyles.buttonCorrect]}>
              <Text style={[fcStyles.buttonText, { color: '#34D399' }]}>{t('iKnewIt')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const fcStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 20, justifyContent: 'center' },
  cardTouchable: { width: '100%' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardInner: {
    padding: 28,
    alignItems: 'center',
    minHeight: 240,
    justifyContent: 'center',
  },
  wordEmoji: { fontSize: 40, marginBottom: 8 },
  wordText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 },
  exampleText: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  flipHint: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  flipHintIcon: { fontSize: 14, marginRight: 6 },
  flipHintText: { fontSize: 13, color: '#A78BFA', fontWeight: '600' },
  answerContainer: { width: '100%', alignItems: 'center', marginTop: 20 },
  divider: { width: '50%', height: 1, backgroundColor: 'rgba(16,185,129,0.2)', marginBottom: 14 },
  meaningLabel: { fontSize: 10, color: 'rgba(52,211,153,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  meaningText: { fontSize: 22, fontWeight: '700', color: '#6EE7B7', textAlign: 'center' },
  buttonsRow: { flexDirection: 'row', marginTop: 20, width: '100%' },
  buttonWrapper: { flex: 1, marginHorizontal: 6 },
  button: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  buttonWrong: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.15)',
  },
  buttonCorrect: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.15)',
  },
  buttonText: { fontSize: 14, fontWeight: '700' },
});

// Yazarak cevap bileseni - gelistirilmis
const TypeAnswerView: React.FC<{
  question: QuizQuestion;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  t: (key: any) => string;
}> = ({ question, onAnswer, t }) => {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleSubmit = () => {
    if (!text.trim() || submitted) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const correct = checkTypeAnswer(text, question.correctAnswer);
    setIsCorrect(correct);
    setSubmitted(true);

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Shake animasyonu
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    Animated.spring(feedbackAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
    setTimeout(() => onAnswer(text, correct), 1500);
  };

  return (
    <KeyboardAvoidingView style={taStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={taStyles.questionLabel}>{t('typeTheTranslation')}</Text>
      <View style={taStyles.wordRow}>
        {question.word.emoji && <Text style={taStyles.wordEmoji}>{question.word.emoji}</Text>}
        <Text style={taStyles.wordText}>{question.word.target_word}</Text>
      </View>
      <Text style={taStyles.exampleText}>"{question.word.example_sentence}"</Text>

      <Animated.View style={[
        taStyles.inputWrapper,
        submitted && (isCorrect ? taStyles.inputCorrect : taStyles.inputIncorrect),
        { transform: [{ translateX: shakeAnim }] },
      ]}>
        <TextInput
          style={taStyles.input}
          placeholder="..."
          placeholderTextColor="rgba(255,255,255,0.15)"
          value={text}
          onChangeText={setText}
          editable={!submitted}
          autoCapitalize="none"
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
      </Animated.View>

      {submitted && (
        <Animated.View style={[taStyles.feedbackContainer, {
          opacity: feedbackAnim,
          transform: [{ scale: feedbackAnim }],
        }]}>
          <View style={[taStyles.feedbackBadge, { backgroundColor: isCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
            <Text style={[taStyles.feedbackIcon]}>
              {isCorrect ? '\u2713' : '\u2717'}
            </Text>
            <Text style={[taStyles.feedbackText, { color: isCorrect ? '#34D399' : '#F87171' }]}>
              {isCorrect ? t('correct') : t('incorrect')}
            </Text>
          </View>
          {!isCorrect && (
            <Text style={taStyles.correctAnswerText}>
              {t('correctAnswerIs')}: <Text style={{ color: '#6EE7B7', fontWeight: '700' }}>{question.correctAnswer}</Text>
            </Text>
          )}
        </Animated.View>
      )}

      {!submitted && (
        <TouchableOpacity onPress={handleSubmit} disabled={!text.trim()} activeOpacity={0.8} style={{ width: '100%', marginTop: 20 }}>
          <LinearGradient
            colors={text.trim() ? ['#6366F1', '#7C3AED'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            style={taStyles.submitButton}
          >
            <Text style={[taStyles.submitText, !text.trim() && { color: 'rgba(255,255,255,0.2)' }]}>
              {t('continue')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
};

const taStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 20, justifyContent: 'center' },
  questionLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  wordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  wordEmoji: { fontSize: 28, marginRight: 8 },
  wordText: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  exampleText: { fontSize: 14, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  inputWrapper: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
  },
  inputCorrect: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)' },
  inputIncorrect: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' },
  input: { fontSize: 18, color: '#FFFFFF', paddingVertical: 16, textAlign: 'center', fontWeight: '600' },
  feedbackContainer: { marginTop: 16, alignItems: 'center' },
  feedbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  feedbackIcon: { fontSize: 16, fontWeight: '800', marginRight: 6, color: '#FFFFFF' },
  feedbackText: { fontSize: 16, fontWeight: '800' },
  correctAnswerText: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 10 },
  submitButton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

// Eslestirme bileseni - gelistirilmis
const MatchingView: React.FC<{
  question: QuizQuestion;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  t: (key: any) => string;
}> = ({ question, onAnswer, t }) => {
  const pairs = question.matchPairs || [];
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ word: string; translation: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const matchedCount = matched.size / 2;

  // Karisik listeler
  const [shuffledWords] = useState(() => [...pairs].sort(() => Math.random() - 0.5).map(p => p.word));
  const [shuffledTranslations] = useState(() => [...pairs].sort(() => Math.random() - 0.5).map(p => p.translation));

  const handleWordPress = (word: string) => {
    if (matched.has(word)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWord(word);
    setWrongPair(null);
  };

  const handleTranslationPress = (translation: string) => {
    if (!selectedWord || matched.has(translation)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const correctPair = pairs.find(p => p.word === selectedWord);
    if (correctPair && correctPair.translation === translation) {
      // Dogru eslestirme
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newMatched = new Set(matched);
      newMatched.add(selectedWord);
      newMatched.add(translation);
      setMatched(newMatched);
      setSelectedWord(null);

      // Tumu eslestiyse tamamla
      if (newMatched.size === pairs.length * 2) {
        setTimeout(() => onAnswer('matched', mistakes === 0), 600);
      }
    } else {
      // Yanlis eslestirme
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrongPair({ word: selectedWord, translation });
      setMistakes(prev => prev + 1);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedWord(null);
      }, 800);
    }
  };

  const getWordStyle = (word: string) => {
    if (matched.has(word)) return { borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.08)' };
    if (wrongPair?.word === word) return { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.12)' };
    if (selectedWord === word) return { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.12)' };
    return {};
  };

  const getTranslationStyle = (trans: string) => {
    if (matched.has(trans)) return { borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.08)' };
    if (wrongPair?.translation === trans) return { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.12)' };
    return {};
  };

  return (
    <View style={matchStyles.container}>
      <Text style={matchStyles.title}>{t('matchThePairs')}</Text>
      <View style={matchStyles.progressRow}>
        <Text style={matchStyles.progressText}>{matchedCount}/{pairs.length}</Text>
        <View style={matchStyles.miniProgress}>
          <View style={[matchStyles.miniProgressFill, { width: `${(matchedCount / pairs.length) * 100}%` }]} />
        </View>
      </View>
      <View style={matchStyles.columns}>
        <View style={matchStyles.column}>
          {shuffledWords.map((word, i) => (
            <TouchableOpacity
              key={`w-${i}`}
              onPress={() => handleWordPress(word)}
              disabled={matched.has(word)}
              activeOpacity={0.7}
              style={[matchStyles.item, getWordStyle(word), matched.has(word) && matchStyles.matchedItem]}
            >
              <Text style={[matchStyles.itemText, matched.has(word) && matchStyles.matchedText]}>{word}</Text>
              {matched.has(word) && <Text style={matchStyles.matchedCheck}>{'\u2713'}</Text>}
            </TouchableOpacity>
          ))}
        </View>
        <View style={matchStyles.columnDivider}>
          <View style={matchStyles.columnDividerLine} />
        </View>
        <View style={matchStyles.column}>
          {shuffledTranslations.map((trans, i) => (
            <TouchableOpacity
              key={`t-${i}`}
              onPress={() => handleTranslationPress(trans)}
              disabled={matched.has(trans) || !selectedWord}
              activeOpacity={0.7}
              style={[matchStyles.item, matchStyles.translationItem, getTranslationStyle(trans), matched.has(trans) && matchStyles.matchedItem]}
            >
              <Text style={[matchStyles.itemText, matched.has(trans) && matchStyles.matchedText]}>{trans}</Text>
              {matched.has(trans) && <Text style={matchStyles.matchedCheck}>{'\u2713'}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const matchStyles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  progressText: { fontSize: 13, fontWeight: '700', color: '#A78BFA', marginRight: 8 },
  miniProgress: { width: 60, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 2 },
  columns: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1 },
  columnDivider: { width: 12, alignItems: 'center', paddingTop: 8 },
  columnDividerLine: { width: 1, height: '90%', backgroundColor: 'rgba(255,255,255,0.05)' },
  item: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  translationItem: { backgroundColor: 'rgba(99,102,241,0.05)' },
  matchedItem: { opacity: 0.5 },
  itemText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)', textAlign: 'center', flex: 1 },
  matchedText: { color: '#34D399', textDecorationLine: 'line-through' },
  matchedCheck: { fontSize: 14, color: '#10B981', marginLeft: 4 },
});

// Soru tipi gostergesi
const QuestionTypeBadge: React.FC<{ type: string; t: (key: any) => string }> = ({ type, t }) => {
  const config: Record<string, { emoji: string; label: string; color: string }> = {
    multiple_choice: { emoji: '\u{1F4DD}', label: t('quiz'), color: '#6366F1' },
    flashcard: { emoji: '\u{1F0CF}', label: 'Flashcard', color: '#8B5CF6' },
    type_answer: { emoji: '\u{2328}\u{FE0F}', label: t('quizWrite'), color: '#3B82F6' },
    matching: { emoji: '\u{1F517}', label: t('quizMatch'), color: '#10B981' },
  };
  const c = config[type] || config.multiple_choice;

  return (
    <View style={[qtStyles.badge, { backgroundColor: `${c.color}20`, borderColor: `${c.color}30` }]}>
      <Text style={qtStyles.badgeEmoji}>{c.emoji}</Text>
      <Text style={[qtStyles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
};

const qtStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeEmoji: { fontSize: 12, marginRight: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

// Ana QuizScreen
const QuizScreen: React.FC<QuizScreenProps> = ({ nativeLanguage, targetLanguage, onClose }) => {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notEnoughWords, setNotEnoughWords] = useState(false);
  const [totalXPGained, setTotalXPGained] = useState(0);

  // Animasyonlar
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const completeScale = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    const learnedWords = await getLearnedWords();
    if (learnedWords.length < 2) {
      setNotEnoughWords(true);
      setIsLoading(false);
      return;
    }

    const quizQuestions = generateQuizQuestions(learnedWords, nativeLanguage, 5);
    setQuestions(quizQuestions);
    setIsLoading(false);

    // Giris animasyonu
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const handleAnswer = async (answer: string, isCorrect: boolean) => {
    const question = questions[currentIndex];
    const result: QuizResult = {
      questionIndex: currentIndex,
      isCorrect,
      wordId: question.word.id,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      timeTaken: 0,
    };

    const newResults = [...results, result];
    setResults(newResults);

    // SRS guncelle -- yanlis cevap quality=1, dogru cevap quality=4
    const confidence = isCorrect ? 4 : 1;
    await updateWordSRS(question.word.id, confidence);

    // Dogru cevap icin XP
    if (isCorrect) {
      const xpResult = await addXP('quiz_correct_answer');
      setTotalXPGained(prev => prev + xpResult.gained);
    }

    const nextIndex = currentIndex + 1;

    // Ilerleme cubugu animasyonu
    Animated.timing(progressWidth, {
      toValue: nextIndex / questions.length,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    if (nextIndex >= questions.length) {
      const quizXP = await addXP('quiz_completed');
      setTotalXPGained(prev => prev + quizXP.gained);

      const allCorrect = newResults.every(r => r.isCorrect);
      if (allCorrect) {
        const perfectXP = await addXP('quiz_perfect');
        setTotalXPGained(prev => prev + perfectXP.gained);
      }

      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(completeScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }).start();
      return;
    }

    // Sonraki soru gecisi - yumusak fade
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.95, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrentIndex(nextIndex);
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  };

  // Yeterli kelime yok
  if (notEnoughWords) {
    return (
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>{'\u2190'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('quiz')}</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>{'\u{1F4DA}'}</Text>
            <Text style={styles.emptyTitle}>{t('needMoreWords')}</Text>
            <Text style={styles.emptyHint}>{t('needMoreWordsHint')}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={{ width: '100%', paddingHorizontal: 40, marginTop: 32 }}>
              <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.backBtn}>
                <Text style={styles.backBtnText}>{t('backToHome')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Yukleniyor
  if (isLoading) {
    return (
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.emptyEmoji}>{'\u{1F504}'}</Text>
          <Text style={styles.emptyHint}>{t('loading')}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Tamamlandi
  if (isComplete) {
    const score = calculateQuizScore(results);
    const correctCount = results.filter(r => r.isCorrect).length;
    const isPerfect = correctCount === results.length;

    return (
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>{'\u2190'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('quiz')}</Text>
            <View style={styles.placeholder} />
          </View>

          <Animated.View style={[styles.centered, { transform: [{ scale: completeScale }] }]}>
            <Text style={styles.completeEmoji}>
              {isPerfect ? '\u{1F31F}' : score >= 80 ? '\u{1F389}' : score >= 50 ? '\u{1F44D}' : '\u{1F4AA}'}
            </Text>
            <Text style={styles.completeTitle}>{t('quizComplete')}</Text>

            {/* Skor dairesi */}
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreValue, { color: score >= 80 ? '#34D399' : score >= 50 ? '#FBBF24' : '#F87171' }]}>
                {score}%
              </Text>
            </View>

            <Text style={styles.scoreDetail}>
              {correctCount}/{results.length} {t('correct').replace('!', '')}
            </Text>

            {/* Soru detaylari */}
            <View style={styles.resultsList}>
              {results.map((result, i) => (
                <View key={i} style={styles.resultItem}>
                  <Text style={[styles.resultIcon, { color: result.isCorrect ? '#34D399' : '#F87171' }]}>
                    {result.isCorrect ? '\u2713' : '\u2717'}
                  </Text>
                  <Text style={styles.resultWord} numberOfLines={1}>
                    {questions[i]?.word.target_word}
                  </Text>
                </View>
              ))}
            </View>

            {totalXPGained > 0 && (
              <View style={styles.xpGainedBadge}>
                <Text style={styles.xpGainedText}>{'\u26A1'} +{totalXPGained} XP</Text>
              </View>
            )}

            <View style={styles.completeButtons}>
              <TouchableOpacity
                onPress={() => {
                  setCurrentIndex(0);
                  setResults([]);
                  setIsComplete(false);
                  setTotalXPGained(0);
                  progressWidth.setValue(0);
                  completeScale.setValue(0);
                  loadQuiz();
                }}
                activeOpacity={0.8}
                style={styles.completeBtnWrapper}
              >
                <View style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>{t('tryAgain')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.completeBtnWrapper}>
                <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.completeBtn}>
                  <Text style={styles.completeBtnText}>{t('backToHome')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Quiz soru gorunumu
  const currentQuestion = questions[currentIndex];

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <QuestionTypeBadge type={currentQuestion.type} t={t} />
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{currentIndex + 1}/{questions.length}</Text>
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
          {/* Ilerleme noktasi */}
          <Animated.View
            style={[
              styles.progressDot,
              {
                left: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Soru */}
        <Animated.View style={[styles.questionContainer, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          {currentQuestion.type === 'multiple_choice' && (
            <MultipleChoiceView question={currentQuestion} onAnswer={handleAnswer} t={t} />
          )}
          {currentQuestion.type === 'flashcard' && (
            <FlashcardView question={currentQuestion} onAnswer={handleAnswer} t={t} />
          )}
          {currentQuestion.type === 'type_answer' && (
            <TypeAnswerView question={currentQuestion} onAnswer={handleAnswer} t={t} />
          )}
          {currentQuestion.type === 'matching' && (
            <MatchingView question={currentQuestion} onAnswer={handleAnswer} t={t} />
          )}
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  closeIcon: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  placeholder: { width: 38 },
  counterBadge: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  counterText: { fontSize: 13, fontWeight: '700', color: '#A78BFA' },

  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'visible',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
  },
  progressDot: {
    position: 'absolute',
    top: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#A78BFA',
    marginLeft: -4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },

  questionContainer: { flex: 1, justifyContent: 'center' },

  // Bos durum
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 22 },
  backBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  backBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // Tamamlandi
  completeEmoji: { fontSize: 64, marginBottom: 12 },
  completeTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 20 },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreValue: { fontSize: 32, fontWeight: '800' },
  scoreDetail: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 16 },

  // Sonuc listesi
  resultsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resultIcon: { fontSize: 12, fontWeight: '800', marginRight: 4 },
  resultWord: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  xpGainedBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  xpGainedText: { fontSize: 15, fontWeight: '800', color: '#FBBF24' },
  completeButtons: { flexDirection: 'row', marginTop: 8, width: '100%' },
  completeBtnWrapper: { flex: 1, marginHorizontal: 6 },
  retryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  completeBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  completeBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

export default QuizScreen;
