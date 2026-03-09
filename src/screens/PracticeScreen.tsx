// PracticeScreen.tsx -- Kesfet ekrani (ExploreScreen)
// Gunun kelimesini 4 asamada derinlemesine ogren
// v3.0.0 - One Word: her gun bir kelimeyi derinlemesine ogren

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { ContentItem } from '../types';
import { LanguageCode, getTranslation as getUITranslation } from '../utils/translations';
import { addXP, completeDailyTask } from '../utils/storage';

const { width } = Dimensions.get('window');

// Hedef dil icin konusma kodu haritasi
const SPEECH_LANG_MAP: Record<string, string> = {
  en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR',
  pt: 'pt-BR', it: 'it-IT', ru: 'ru-RU', ja: 'ja-JP',
  ko: 'ko-KR', zh: 'zh-CN', tr: 'tr-TR',
};

// Asama tanimlari
interface StageDefinition {
  id: number;
  emoji: string;
  titleKey: 'listenRepeat' | 'culturalContextTitle' | 'practiceWithLingo' | 'miniQuiz';
  descKey: 'listenRepeatDesc' | 'culturalContextDesc' | 'practiceWithLingoDesc' | 'miniQuizDesc';
  xp: number;
}

const STAGES: StageDefinition[] = [
  { id: 1, emoji: '\u{1F3A7}', titleKey: 'listenRepeat', descKey: 'listenRepeatDesc', xp: 5 },
  { id: 2, emoji: '\u{1F30D}', titleKey: 'culturalContextTitle', descKey: 'culturalContextDesc', xp: 5 },
  { id: 3, emoji: '\u{1F4AC}', titleKey: 'practiceWithLingo', descKey: 'practiceWithLingoDesc', xp: 10 },
  { id: 4, emoji: '\u270D\uFE0F', titleKey: 'miniQuiz', descKey: 'miniQuizDesc', xp: 15 },
];

// Quiz soru tipleri
type QuizQuestionType = 'multiple_choice' | 'true_false' | 'fill_blank';

interface QuizQuestion {
  type: QuizQuestionType;
  question: string;
  options?: string[];
  correctIndex: number;
  explanation?: string;
}

type PracticeScreenProps = {
  word: ContentItem | null;
  nativeLanguage: LanguageCode;
  targetLanguage?: LanguageCode;
  onSelectScenario: (word: ContentItem, scenarioId?: string) => void;
  onClose: () => void;
};

// Quiz sorularini kelime verisinden olustur
const generateQuizQuestions = (
  word: ContentItem,
  nativeLanguage: LanguageCode,
): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  const translation = word.translations?.[nativeLanguage] || word.translations?.['en'] || '';
  // Yanlis secenekler icin rastgele ceviri turetmeleri
  const dummyOptions = generateDummyTranslations(translation, nativeLanguage);

  // Soru 1: Coktan secmeli -- kelimenin anlami
  const correctIdx = Math.floor(Math.random() * 4);
  const options = [...dummyOptions.slice(0, 3)];
  options.splice(correctIdx, 0, translation);
  questions.push({
    type: 'multiple_choice',
    question: `"${word.target_word}"`,
    options,
    correctIndex: correctIdx,
  });

  // Soru 2: Dogru/Yanlis -- ornek cumle
  const exampleSentence = word.example_sentence || `I use "${word.target_word}" in daily life.`;
  const isTrue = Math.random() > 0.4; // Cogunlukla dogru gosterelim
  let tfSentence = exampleSentence;
  if (!isTrue && word.translations) {
    // Yanlis bir cumle olustur -- kelimeyi farkli anlamla goster
    tfSentence = exampleSentence.replace(
      word.target_word,
      dummyOptions[0] || 'something else',
    );
  }
  questions.push({
    type: 'true_false',
    question: isTrue ? exampleSentence : tfSentence,
    options: undefined,
    correctIndex: isTrue ? 0 : 1, // 0 = true, 1 = false
    explanation: isTrue ? exampleSentence : `Correct: "${exampleSentence}"`,
  });

  // Soru 3: Bosluk doldurma -- ornek cumlede kelimeyi bul
  const blankSentence = exampleSentence.replace(
    new RegExp(escapeRegex(word.target_word), 'i'),
    '______',
  );
  // Eger kelime cumlede bulunamazsa, basit bir soru olustur
  const hasBlanked = blankSentence.includes('______');
  if (hasBlanked) {
    const fillCorrectIdx = Math.floor(Math.random() * 4);
    const fillOptions = [...(dummyOptions.slice(0, 3).map((_, i) =>
      ['always', 'never', 'sometimes', 'quickly', 'slowly', 'carefully'][i] || `word${i}`
    ))];
    fillOptions.splice(fillCorrectIdx, 0, word.target_word);
    questions.push({
      type: 'fill_blank',
      question: blankSentence,
      options: fillOptions,
      correctIndex: fillCorrectIdx,
    });
  } else {
    // Alternatif bosluk sorusu
    const altCorrectIdx = Math.floor(Math.random() * 4);
    const altOptions = [...dummyOptions.slice(0, 3)];
    altOptions.splice(altCorrectIdx, 0, translation);
    questions.push({
      type: 'fill_blank',
      question: `"${word.target_word}" = ______`,
      options: altOptions,
      correctIndex: altCorrectIdx,
    });
  }

  return questions;
};

// Regex ozel karakterlerini kacir
const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Sahte ceviri secenekleri olustur
const generateDummyTranslations = (
  correctTranslation: string,
  _lang: LanguageCode,
): string[] => {
  // Basit sahte secenekler -- kelimenin anlamina benzer ama farkli
  const dummies: Record<string, string[]> = {
    en: ['to walk', 'to think', 'beautiful', 'quickly', 'important', 'difficult'],
    tr: ['yurumek', 'dusunmek', 'guzel', 'hizlica', 'onemli', 'zor'],
    es: ['caminar', 'pensar', 'hermoso', 'rapido', 'importante', 'dificil'],
    de: ['gehen', 'denken', 'schon', 'schnell', 'wichtig', 'schwierig'],
    fr: ['marcher', 'penser', 'beau', 'vite', 'important', 'difficile'],
    pt: ['andar', 'pensar', 'bonito', 'rapido', 'importante', 'dificil'],
    it: ['camminare', 'pensare', 'bello', 'veloce', 'importante', 'difficile'],
    ru: ['ходить', 'думать', 'красивый', 'быстро', 'важный', 'трудный'],
    ja: ['歩く', '考える', '美しい', '早く', '大切な', '難しい'],
    ko: ['걷다', '생각하다', '아름다운', '빠르게', '중요한', '어려운'],
    zh: ['走路', '思考', '美丽', '快速', '重要', '困难'],
  };
  const pool = dummies[_lang] || dummies['en'];
  // Dogru cevabi icermeyen secenekler sec
  const filtered = pool.filter(d => d.toLowerCase() !== correctTranslation.toLowerCase());
  // Karistir ve 3 tane al
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

const PracticeScreen: React.FC<PracticeScreenProps> = ({
  word,
  nativeLanguage,
  targetLanguage,
  onSelectScenario,
  onClose,
}) => {
  // Ceviri yardimcisi
  const t = (key: Parameters<typeof getUITranslation>[0]) => getUITranslation(key, nativeLanguage);

  // Asama durumu -- her ziyarette sifirlanir
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
  const [activeStage, setActiveStage] = useState<number | null>(null);

  // Quiz durumu
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([null, null, null]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);

  // Animasyonlar
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(STAGES.map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Giris animasyonu
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Kart animasyonlari -- sirali giris
    STAGES.forEach((_, index) => {
      Animated.timing(cardAnims[index], {
        toValue: 1,
        duration: 350,
        delay: 200 + index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Nabiz animasyonu -- aktif kart icin
  useEffect(() => {
    if (activeStage !== null) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [activeStage]);

  // Ilerleme cubugu animasyonu
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: completedStages.size / 4,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [completedStages.size]);

  // Quiz sorularini hazirla
  useEffect(() => {
    if (word) {
      setQuizQuestions(generateQuizQuestions(word, nativeLanguage));
    }
  }, [word, nativeLanguage]);

  // Kelimenin cevirisi
  const wordTranslation = useMemo(() => {
    if (!word) return '';
    return word.translations?.[nativeLanguage] || word.translations?.['en'] || '';
  }, [word, nativeLanguage]);

  // Hedef dil kodu -- konusma icin
  const speechLanguageCode = useMemo(() => {
    if (targetLanguage) return SPEECH_LANG_MAP[targetLanguage] || 'en-US';
    return 'en-US';
  }, [targetLanguage]);

  // Bir asama acik mi kontrol et
  const isStageUnlocked = useCallback((stageId: number): boolean => {
    if (stageId === 1) return true;
    return completedStages.has(stageId - 1);
  }, [completedStages]);

  // Asama tamamlandi mi kontrol et
  const isStageCompleted = useCallback((stageId: number): boolean => {
    return completedStages.has(stageId);
  }, [completedStages]);

  // Kelimeyi seslendir
  const handleListenWord = useCallback(() => {
    if (!word) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.speak(word.target_word, {
      language: speechLanguageCode,
      rate: 0.75,
    });
  }, [word, speechLanguageCode]);

  // Asama tamamla ve XP kazan
  const handleCompleteStage = useCallback(async (stageId: number, xpAmount: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setCompletedStages(prev => {
      const next = new Set(prev);
      next.add(stageId);
      return next;
    });
    setActiveStage(null);

    // XP ekle ve gunluk gorevi tamamla
    try {
      await addXP('chat_started', xpAmount);
      await completeDailyTask('practice_ai');
    } catch (_e) {
      // Sessizce devam et
    }
  }, []);

  // Asama kartina tikla
  const handleStagePress = useCallback((stageId: number) => {
    if (!isStageUnlocked(stageId) || isStageCompleted(stageId)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (activeStage === stageId) {
      setActiveStage(null);
    } else {
      setActiveStage(stageId);
      // Quiz icin sifirla
      if (stageId === 4) {
        setCurrentQuizIndex(0);
        setQuizAnswers([null, null, null]);
        setQuizCompleted(false);
        setSelectedQuizOption(null);
      }
    }
  }, [activeStage, isStageUnlocked, isStageCompleted]);

  // Stage 3: Lingo ile sohbet -- ChatScreen'e yonlendir
  const handleChatWithLingo = useCallback(() => {
    if (!word) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Asamayi tamamlanmis say (ChatScreen kendi XP'sini verecek)
    setCompletedStages(prev => {
      const next = new Set(prev);
      next.add(3);
      return next;
    });
    onSelectScenario(word);
  }, [word, onSelectScenario]);

  // Quiz cevap secimi
  const handleQuizAnswer = useCallback((optionIndex: number) => {
    if (selectedQuizOption !== null) return; // Cift tiklama onle
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQuizOption(optionIndex);

    const isCorrect = optionIndex === quizQuestions[currentQuizIndex]?.correctIndex;
    const newAnswers = [...quizAnswers];
    newAnswers[currentQuizIndex] = isCorrect ? 1 : 0;
    setQuizAnswers(newAnswers);

    // Kisa bir bekleme sonrasi sonraki soruya gec
    setTimeout(() => {
      if (currentQuizIndex < 2) {
        setCurrentQuizIndex(prev => prev + 1);
        setSelectedQuizOption(null);
      } else {
        // Quiz tamamlandi
        setQuizCompleted(true);
        const correctCount = newAnswers.filter(a => a === 1).length;
        const xpReward = correctCount === 3 ? 15 : correctCount === 2 ? 10 : correctCount === 1 ? 7 : 5;
        handleCompleteStage(4, xpReward);
      }
    }, 800);
  }, [selectedQuizOption, quizQuestions, currentQuizIndex, quizAnswers, handleCompleteStage]);

  // Quiz skoru
  const quizScore = useMemo(() => {
    return quizAnswers.filter(a => a === 1).length;
  }, [quizAnswers]);

  // Tesvik mesaji
  const getEncouragementKey = useCallback((): 'encouragePerfect' | 'encourageGood' | 'encourageOk' | 'encourageTryMore' => {
    if (quizScore === 3) return 'encouragePerfect';
    if (quizScore === 2) return 'encourageGood';
    if (quizScore === 1) return 'encourageOk';
    return 'encourageTryMore';
  }, [quizScore]);

  // ---- RENDER ----

  // Asama 1 icerigi: Dinle & Tekrarla
  const renderStage1Content = () => (
    <View style={styles.stageContent}>
      {/* Kelime ve telaffuz */}
      <View style={styles.listenWordContainer}>
        <Text style={styles.listenWordText}>{word?.target_word}</Text>
        {word?.pronunciation && (
          <Text style={styles.pronunciationText}>/{word.pronunciation}/</Text>
        )}
        <Text style={styles.translationSmall}>{wordTranslation}</Text>
      </View>

      {/* Dinle butonu */}
      <TouchableOpacity
        style={styles.listenButton}
        onPress={handleListenWord}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('listenToWord')}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.listenButtonInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.listenButtonEmoji}>{'\u{1F50A}'}</Text>
          <Text style={styles.listenButtonText}>{t('listenToWord')}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Pratik yaptim butonu */}
      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => handleCompleteStage(1, 5)}
        activeOpacity={0.7}
      >
        <Text style={styles.completeButtonText}>{'\u2705'} {t('iPracticed')}</Text>
      </TouchableOpacity>
    </View>
  );

  // Asama 2 icerigi: Kulturel Baglam
  const renderStage2Content = () => {
    const culturalContext = word?.culturalContext || '';
    const usageNotes = word?.usageNotes || '';
    const funFact = word?.funFact || '';
    const hasContent = culturalContext || usageNotes || funFact;

    return (
      <View style={styles.stageContent}>
        <ScrollView style={styles.culturalScroll} nestedScrollEnabled>
          {culturalContext ? (
            <View style={styles.culturalCard}>
              <Text style={styles.culturalLabel}>{'\u{1F30D}'} {t('culturalContextTitle')}</Text>
              <Text style={styles.culturalText}>{culturalContext}</Text>
            </View>
          ) : null}

          {usageNotes ? (
            <View style={styles.culturalCard}>
              <Text style={styles.culturalLabel}>{'\u{1F4DD}'} Notes</Text>
              <Text style={styles.culturalText}>{usageNotes}</Text>
            </View>
          ) : null}

          {funFact ? (
            <View style={styles.culturalCard}>
              <Text style={styles.culturalLabel}>{'\u{1F4A1}'} Fun Fact</Text>
              <Text style={styles.culturalText}>{funFact}</Text>
            </View>
          ) : null}

          {!hasContent && (
            <View style={styles.culturalCard}>
              <Text style={styles.culturalLabel}>{'\u{1F4DA}'} {t('culturalContextTitle')}</Text>
              <Text style={styles.culturalText}>
                "{word?.target_word}" -- {wordTranslation}
              </Text>
              {word?.grammarNote && (
                <Text style={styles.culturalText}>{'\n'}{word.grammarNote}</Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Anladim butonu */}
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleCompleteStage(2, 5)}
          activeOpacity={0.7}
        >
          <Text style={styles.completeButtonText}>{'\u{1F44D}'} {t('gotIt')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Asama 3 icerigi: Lingo ile Pratik
  const renderStage3Content = () => (
    <View style={styles.stageContent}>
      <View style={styles.lingoPreview}>
        <Text style={styles.lingoEmoji}>{'\u{1F916}'}</Text>
        <Text style={styles.lingoText}>
          {t('chatWithLingo')}: "{word?.target_word}"
        </Text>
      </View>

      <TouchableOpacity
        style={styles.lingoButton}
        onPress={handleChatWithLingo}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.lingoButtonInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.lingoButtonText}>{'\u{1F4AC}'} {t('chatWithLingo')}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Asama 4 icerigi: Mini Quiz
  const renderStage4Content = () => {
    if (quizCompleted) {
      return (
        <View style={styles.stageContent}>
          <View style={styles.quizResultContainer}>
            <Text style={styles.quizResultEmoji}>
              {quizScore === 3 ? '\u{1F3C6}' : quizScore >= 2 ? '\u{1F31F}' : '\u{1F4AA}'}
            </Text>
            <Text style={styles.quizResultScore}>{quizScore}/3</Text>
            <Text style={styles.quizResultText}>{t(getEncouragementKey())}</Text>
            <Text style={styles.quizXPText}>
              +{quizScore === 3 ? 15 : quizScore === 2 ? 10 : quizScore === 1 ? 7 : 5} XP
            </Text>
          </View>
        </View>
      );
    }

    const currentQ = quizQuestions[currentQuizIndex];
    if (!currentQ) return null;

    return (
      <View style={styles.stageContent}>
        {/* Soru ilerleme gostergesi */}
        <View style={styles.quizProgress}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.quizDot,
                i === currentQuizIndex && styles.quizDotActive,
                i < currentQuizIndex && (quizAnswers[i] === 1 ? styles.quizDotCorrect : styles.quizDotWrong),
              ]}
            />
          ))}
        </View>

        {/* Soru tipi etiketi */}
        <Text style={styles.quizTypeLabel}>
          {currentQ.type === 'multiple_choice'
            ? t('whatDoesMean')
            : currentQ.type === 'true_false'
            ? t('trueOrFalse')
            : t('fillInBlank')}
        </Text>

        {/* Soru metni */}
        <Text style={styles.quizQuestionText}>{currentQ.question}</Text>

        {/* Secenekler */}
        {currentQ.type === 'true_false' ? (
          <View style={styles.quizTFContainer}>
            {[0, 1].map(idx => {
              const isSelected = selectedQuizOption === idx;
              const isCorrect = idx === currentQ.correctIndex;
              const showResult = selectedQuizOption !== null;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.quizTFButton,
                    showResult && isSelected && isCorrect && styles.quizOptionCorrect,
                    showResult && isSelected && !isCorrect && styles.quizOptionWrong,
                    showResult && !isSelected && isCorrect && styles.quizOptionCorrectHint,
                  ]}
                  onPress={() => handleQuizAnswer(idx)}
                  disabled={selectedQuizOption !== null}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quizTFText}>
                    {idx === 0 ? `\u2705 ${t('true')}` : `\u274C ${t('false')}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.quizOptionsContainer}>
            {currentQ.options?.map((option, idx) => {
              const isSelected = selectedQuizOption === idx;
              const isCorrect = idx === currentQ.correctIndex;
              const showResult = selectedQuizOption !== null;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.quizOption,
                    showResult && isSelected && isCorrect && styles.quizOptionCorrect,
                    showResult && isSelected && !isCorrect && styles.quizOptionWrong,
                    showResult && !isSelected && isCorrect && styles.quizOptionCorrectHint,
                  ]}
                  onPress={() => handleQuizAnswer(idx)}
                  disabled={selectedQuizOption !== null}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.quizOptionText,
                    showResult && isCorrect && styles.quizOptionTextCorrect,
                    showResult && isSelected && !isCorrect && styles.quizOptionTextWrong,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Asama icerigi secici
  const renderActiveStageContent = (stageId: number) => {
    switch (stageId) {
      case 1: return renderStage1Content();
      case 2: return renderStage2Content();
      case 3: return renderStage3Content();
      case 4: return renderStage4Content();
      default: return null;
    }
  };

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'\u{1F50D}'} {t('explore')}</Text>
          <View style={styles.placeholder} />
        </View>

        <Animated.View
          style={[
            styles.content,
            { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Kelime banner */}
            {word && (
              <LinearGradient
                colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.10)']}
                style={styles.wordBanner}
              >
                <Text style={styles.wordEmoji}>{word.emoji || '\u{1F4D6}'}</Text>
                <View style={styles.wordInfo}>
                  <Text style={styles.wordText}>{word.target_word}</Text>
                  <Text style={styles.wordTranslation}>{wordTranslation}</Text>
                  {word.pronunciation && (
                    <Text style={styles.wordPronunciation}>/{word.pronunciation}/</Text>
                  )}
                </View>
                <TouchableOpacity onPress={handleListenWord} style={styles.miniListenBtn}>
                  <Text style={styles.miniListenIcon}>{'\u{1F50A}'}</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}

            {/* Ilerleme cubugu */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {completedStages.size}/4 {t('stagesCompleted')}
              </Text>
            </View>

            {/* Tum asamalar tamamlandi mesaji */}
            {completedStages.size === 4 && (
              <View style={styles.allCompleteContainer}>
                <Text style={styles.allCompleteEmoji}>{'\u{1F389}'}</Text>
                <Text style={styles.allCompleteText}>{t('allStagesComplete')}</Text>
              </View>
            )}

            {/* Asama kartlari */}
            {STAGES.map((stage, index) => {
              const unlocked = isStageUnlocked(stage.id);
              const completed = isStageCompleted(stage.id);
              const isActive = activeStage === stage.id;
              // Siradaki acilacak asama (mevcut ilerlemenin bir sonrasi)
              const isNext = !completed && unlocked && activeStage !== stage.id;

              return (
                <Animated.View
                  key={stage.id}
                  style={[
                    {
                      opacity: cardAnims[index],
                      transform: [
                        {
                          translateY: cardAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [30, 0],
                          }),
                        },
                        ...(isActive ? [{ scale: pulseAnim }] : []),
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={unlocked ? 0.7 : 1}
                    onPress={() => handleStagePress(stage.id)}
                    disabled={!unlocked || completed}
                  >
                    <LinearGradient
                      colors={
                        completed
                          ? ['rgba(16,185,129,0.12)', 'rgba(5,150,105,0.08)']
                          : isActive
                          ? ['rgba(99,102,241,0.18)', 'rgba(139,92,246,0.12)']
                          : isNext
                          ? ['rgba(99,102,241,0.08)', 'rgba(139,92,246,0.05)']
                          : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']
                      }
                      style={[
                        styles.stageCard,
                        completed && styles.stageCardCompleted,
                        isActive && styles.stageCardActive,
                        !unlocked && styles.stageCardLocked,
                      ]}
                    >
                      {/* Kart baslik satiri */}
                      <View style={styles.stageHeader}>
                        <View style={styles.stageLeft}>
                          <Text style={[
                            styles.stageEmoji,
                            !unlocked && styles.stageEmojiLocked,
                          ]}>
                            {stage.emoji}
                          </Text>
                          <View>
                            <Text style={[
                              styles.stageTitle,
                              !unlocked && styles.stageTitleLocked,
                            ]}>
                              {t(stage.titleKey)}
                            </Text>
                            <Text style={[
                              styles.stageDesc,
                              !unlocked && styles.stageDescLocked,
                            ]}>
                              {t(stage.descKey)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.stageRight}>
                          <Text style={[
                            styles.stageXP,
                            completed && styles.stageXPCompleted,
                            !unlocked && styles.stageXPLocked,
                          ]}>
                            +{stage.xp} XP
                          </Text>
                          <Text style={styles.stageStatus}>
                            {completed ? '\u2705' : !unlocked ? '\u{1F512}' : '\u25B6\uFE0F'}
                          </Text>
                        </View>
                      </View>

                      {/* Kilitli mesaj */}
                      {!unlocked && (
                        <Text style={styles.lockMessage}>{t('unlockPrevious')}</Text>
                      )}

                      {/* Aktif asama icerigi */}
                      {isActive && renderActiveStageContent(stage.id)}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}

            {/* Alt bosluk */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ---- STYLES ----

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
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

  // Icerik alani
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  // Kelime banner
  wordBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  wordEmoji: { fontSize: 38, marginRight: 14 },
  wordInfo: { flex: 1 },
  wordText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  wordTranslation: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  wordPronunciation: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(139,92,246,0.7)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  miniListenBtn: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniListenIcon: { fontSize: 20 },

  // Ilerleme cubugu
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  // Tum asamalar tamamlandi
  allCompleteContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  allCompleteEmoji: { fontSize: 36, marginBottom: 8 },
  allCompleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
  },

  // Asama karti
  stageCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  stageCardCompleted: {
    borderColor: 'rgba(16,185,129,0.3)',
  },
  stageCardActive: {
    borderColor: 'rgba(99,102,241,0.4)',
    borderWidth: 1.5,
  },
  stageCardLocked: {
    opacity: 0.5,
  },

  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stageEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  stageEmojiLocked: {
    opacity: 0.4,
  },
  stageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stageTitleLocked: {
    color: 'rgba(255,255,255,0.4)',
  },
  stageDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  stageDescLocked: {
    color: 'rgba(255,255,255,0.25)',
  },
  stageRight: {
    alignItems: 'flex-end',
  },
  stageXP: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  stageXPCompleted: {
    color: '#10B981',
  },
  stageXPLocked: {
    color: 'rgba(255,255,255,0.25)',
  },
  stageStatus: {
    fontSize: 18,
  },
  lockMessage: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Asama icerigi (genisletilmis)
  stageContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },

  // Stage 1: Dinle & Tekrarla
  listenWordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  listenWordText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pronunciationText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(139,92,246,0.8)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  translationSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },
  listenButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  listenButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  listenButtonEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  listenButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },

  // Stage 2: Kulturel Baglam
  culturalScroll: {
    maxHeight: 200,
    marginBottom: 12,
  },
  culturalCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  culturalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  culturalText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },

  // Stage 3: Lingo ile Pratik
  lingoPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  lingoEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },
  lingoText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  lingoButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  lingoButtonInner: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  lingoButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Stage 4: Mini Quiz
  quizProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  quizDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  quizDotActive: {
    backgroundColor: '#8B5CF6',
    width: 24,
    borderRadius: 5,
  },
  quizDotCorrect: {
    backgroundColor: '#10B981',
  },
  quizDotWrong: {
    backgroundColor: '#EF4444',
  },
  quizTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 8,
  },
  quizQuestionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 26,
  },
  quizOptionsContainer: {
    gap: 10,
  },
  quizOption: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quizOptionCorrect: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderColor: 'rgba(16,185,129,0.5)',
  },
  quizOptionWrong: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderColor: 'rgba(239,68,68,0.5)',
  },
  quizOptionCorrectHint: {
    borderColor: 'rgba(16,185,129,0.4)',
  },
  quizOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  quizOptionTextCorrect: {
    color: '#10B981',
  },
  quizOptionTextWrong: {
    color: '#EF4444',
  },
  quizTFContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quizTFButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  quizTFText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  quizResultContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  quizResultEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },
  quizResultScore: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  quizResultText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 8,
  },
  quizXPText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
});

export default PracticeScreen;
