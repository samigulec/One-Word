import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
// @ts-ignore
import * as Speech from 'expo-speech';
// @ts-ignore
import { captureRef } from 'react-native-view-shot';
// @ts-ignore
import * as Sharing from 'expo-sharing';
import { ContentItem, UserProgress, ProficiencyLevel, LevelInfo, DailyTasksData, DailyTaskId } from '../types';
import { getWordOfTheDay, getTranslation, getExampleTranslation } from '../utils/contentLoader';
import { updateDailyStreak, toggleFavorite, isFavorite, addLearnedWord, getDueWordsForToday, getUserName, getDailyXPStatus, addXP, getDailyTasks, completeDailyTask, claimDailyTasksBonus, getWeeklyChallenge, updateWeeklyChallengeGoal, claimWeeklyChallengeBonus } from '../utils/storage';
import { WeeklyChallengeData } from '../types';
import { getTranslation as getUITranslation, LanguageCode, LANGUAGES } from '../utils/translations';
import ShareWordCard from '../components/ShareWordCard';
import CulturalContextModal from '../components/CulturalContextModal';
import GrammarNuggets from '../components/GrammarNuggets';
import RealWorldExamples from '../components/RealWorldExamples';
import WeeklyChallengePanel from '../components/WeeklyChallengePanel';
import { getCategoryIcon } from '../utils/categoryIcons';

const { width } = Dimensions.get('window');

// Gunluk gorev ikon ve label eslestirmesi
const TASK_CONFIG: Record<DailyTaskId, { icon: string; labelKey: 'taskLearnWord' | 'taskDiscoverMeaning' | 'taskPracticeAI' }> = {
  learn_word: { icon: '\u{1F4D6}', labelKey: 'taskLearnWord' },
  discover_meaning: { icon: '\u{1F50D}', labelKey: 'taskDiscoverMeaning' },
  practice_ai: { icon: '\u{1F4AC}', labelKey: 'taskPracticeAI' },
};

type HomeScreenProps = {
  onNavigateToChat: (word: ContentItem) => void;
  onNavigateToJourney: () => void;
  onNavigateToSettings: () => void;
  onNavigateToHistory: () => void;
  onNavigateToReview: () => void;
  onNavigateToQuiz: () => void;
  onNavigateToBadges: () => void;
  onNavigateToWeeklySummary: () => void;
  onNavigateToLeaderboard: () => void;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  proficiencyLevel: ProficiencyLevel;
  calmMode?: boolean;
};

// XP kazanim animasyonu icin floating text verisi
interface FloatingXP {
  id: number;
  amount: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToChat, onNavigateToJourney, onNavigateToSettings,
  onNavigateToHistory, onNavigateToReview, onNavigateToQuiz,
  onNavigateToBadges, onNavigateToWeeklySummary, onNavigateToLeaderboard,
  nativeLanguage, targetLanguage, proficiencyLevel,
}) => {
  const [word, setWord] = useState<ContentItem | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<DailyTasksData | null>(null);
  // Kulturel baglam modal state
  const [showCulturalContext, setShowCulturalContext] = useState(false);
  // Haftalik zorluk state
  const [weeklyChallenge, setWeeklyChallenge] = useState<WeeklyChallengeData | null>(null);

  // XP widget state'leri
  const [dailyXP, setDailyXP] = useState<number>(0);
  const [dailyGoal, setDailyGoal] = useState<number>(50);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [levelProgress, setLevelProgress] = useState<number>(0);
  const [dailyGoalStreak, setDailyGoalStreak] = useState<number>(0);

  // Floating XP animasyonlari
  const [floatingXPs, setFloatingXPs] = useState<FloatingXP[]>([]);
  const floatingIdRef = useRef(0);

  // Animasyonlar
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const meaningReveal = useRef(new Animated.Value(0)).current;
  const levelUpScale = useRef(new Animated.Value(0)).current;
  const levelUpOpacity = useRef(new Animated.Value(0)).current;
  const xpWidgetOpacity = useRef(new Animated.Value(0)).current;
  const dailyProgressWidth = useRef(new Animated.Value(0)).current;
  const levelProgressWidth = useRef(new Animated.Value(0)).current;

  // Gorev tamamlanma animasyonlari (her gorev icin ayri)
  const taskCheckScales = useRef<Record<string, Animated.Value>>({
    learn_word: new Animated.Value(0),
    discover_meaning: new Animated.Value(0),
    practice_ai: new Animated.Value(0),
  }).current;

  const shareCardRef = useRef<View>(null);

  const t = (key: Parameters<typeof getUITranslation>[0]) => getUITranslation(key, nativeLanguage);
  const targetLanguageFlag = LANGUAGES.find(lang => lang.code === targetLanguage)?.flag || '';
  const nativeLanguageFlag = LANGUAGES.find(lang => lang.code === nativeLanguage)?.flag || '';

  // Selamlama mesaji -- saate gore degisir
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    let greeting: string;
    if (hour < 12) greeting = t('goodMorning');
    else if (hour < 18) greeting = t('goodAfternoon');
    else greeting = t('goodEvening');
    return userName ? `${greeting}, ${userName}!` : `${greeting}!`;
  };

  useEffect(() => {
    loadDailyContent();
    startAnimations();
    getUserName().then(name => setUserName(name));
    loadXPStatus();
    loadDailyTasks();
    loadWeeklyChallenge();
  }, [targetLanguage, proficiencyLevel]);

  // Giris animasyonlari
  const startAnimations = () => {
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(xpWidgetOpacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  };

  // Haftalik zorlugu yukle
  const loadWeeklyChallenge = async () => {
    const data = await getWeeklyChallenge();
    setWeeklyChallenge(data);
  };

  // Gunluk gorevleri yukle
  const loadDailyTasks = async () => {
    const tasks = await getDailyTasks();
    setDailyTasks(tasks);
    // Tamamlanmis gorevlerin checkmark'larini goster
    tasks.tasks.forEach(task => {
      if (task.completed) {
        taskCheckScales[task.id].setValue(1);
      }
    });
  };

  // Gorev tamamla ve animasyonu tetikle
  const handleCompleteTask = async (taskId: DailyTaskId) => {
    const result = await completeDailyTask(taskId);
    setDailyTasks(result.tasksData);

    // Gorev tamamlandiginda checkmark animasyonu
    if (result.xpGained > 0) {
      // Checkmark animasyonu
      Animated.spring(taskCheckScales[taskId], {
        toValue: 1,
        tension: 80,
        friction: 5,
        useNativeDriver: true,
      }).start();

      // Floating XP animasyonu
      triggerFloatingXP(result.xpGained);

      // XP ekle
      const xpResult = await addXP('word_learned', result.xpGained);
      if (xpResult.leveledUp && xpResult.newLevel) {
        triggerLevelUpAnimation(xpResult.newLevel);
      }
      // XP durumunu guncelle
      await loadXPStatus();
    }

    // Tum gorevler tamamlandiginda bonus
    if (result.allJustCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const bonus = await claimDailyTasksBonus();
      if (bonus > 0) {
        await addXP('daily_goal_reached', bonus);
        triggerFloatingXP(bonus);
        await loadXPStatus();
      }
    }
  };

  // XP durumunu yukle ve progress bar animasyonlarini tetikle
  const loadXPStatus = async () => {
    const status = await getDailyXPStatus();
    setLevelInfo(status.levelInfo);
    setDailyXP(status.dailyXP);
    setDailyGoal(status.dailyGoal);
    setTotalXP(status.totalXP);
    setLevelProgress(status.levelProgress);
    setDailyGoalStreak(status.dailyGoalStreak);

    // Progress bar animasyonlari (useNativeDriver: false cunku width degisecek)
    Animated.parallel([
      Animated.timing(dailyProgressWidth, {
        toValue: Math.min(status.dailyXP / status.dailyGoal, 1),
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(levelProgressWidth, {
        toValue: status.levelProgress,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Floating "+X XP" animasyonu olustur
  const triggerFloatingXP = (amount: number) => {
    const id = floatingIdRef.current++;
    const opacity = new Animated.Value(1);
    const translateY = new Animated.Value(0);

    const newFloat: FloatingXP = { id, amount, opacity, translateY };
    setFloatingXPs(prev => [...prev, newFloat]);

    // Yukari kayip solma animasyonu
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -60,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animasyon bitince listeden cikar
      setFloatingXPs(prev => prev.filter(f => f.id !== id));
    });
  };

  // Level atlama animasyonu
  const triggerLevelUpAnimation = (newLevel: LevelInfo) => {
    setLevelInfo(newLevel);
    setShowLevelUp(true);
    levelUpScale.setValue(0);
    levelUpOpacity.setValue(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(levelUpScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.timing(levelUpOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.timing(levelUpOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setShowLevelUp(false);
      });
    }, 3000);
  };

  // Gunluk icerik yukle
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
      await addXP('word_learned');
      await loadXPStatus();
      handleCompleteTask('learn_word');
      // Haftalik zorluk: kelime ogrenme hedefini guncelle
      const wcResult = await updateWeeklyChallengeGoal('learn_words');
      setWeeklyChallenge(wcResult.data);
      if (wcResult.justCompleted) {
        const bonus = await claimWeeklyChallengeBonus();
        if (bonus > 0) {
          await addXP('daily_goal_reached', bonus);
          triggerFloatingXP(bonus);
          await loadXPStatus();
        }
      }
      const dueWords = await getDueWordsForToday();
      setDueCount(dueWords.length);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  // Kelimeyi seslendir
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

  // Favori toggler
  const handleToggleFavorite = async () => {
    if (!word) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newFav = await toggleFavorite(word.id);
    setIsFav(newFav);
    if (newFav) {
      const result = await addXP('favorite_added');
      if (result.gained > 0) triggerFloatingXP(result.gained);
      await loadXPStatus();
    }
  };

  // Paylasim islemi
  const handleShare = useCallback(async () => {
    if (!word || !shareCardRef.current) return;
    try {
      setIsSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureRef(shareCardRef, {
        format: 'png', quality: 1, result: 'tmpfile',
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png', dialogTitle: 'Share Word',
        });
        const result = await addXP('word_shared');
        if (result.gained > 0) triggerFloatingXP(result.gained);
        await loadXPStatus();
      } else {
        Alert.alert('Share', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  }, [word]);

  // Anlam goster/gizle
  const handleMeaningPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!showMeaning) {
      setShowMeaning(true);
      addXP('meaning_revealed').then(result => {
        if (result.gained > 0) triggerFloatingXP(result.gained);
        loadXPStatus();
      });
      handleCompleteTask('discover_meaning');
      Animated.spring(meaningReveal, {
        toValue: 1, tension: 50, friction: 6, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(meaningReveal, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }).start(() => setShowMeaning(false));
    }
  };

  // AI ile pratik yap
  const handlePracticePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (word) {
      handleCompleteTask('practice_ai');
      setTimeout(() => onNavigateToChat(word), 150);
    }
  };

  // Yukleniyor durumu
  if (!word) {
    return (
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const localizedMeaning = getTranslation(word, nativeLanguage);
  const localizedExample = getExampleTranslation(word, nativeLanguage);

  // Gorev etiketini getir
  const getTaskLabel = (taskId: DailyTaskId): string => {
    const config = TASK_CONFIG[taskId];
    return config ? t(config.labelKey) : taskId;
  };

  // Gorev ikonunu getir
  const getTaskIcon = (taskId: DailyTaskId): string => {
    const config = TASK_CONFIG[taskId];
    return config ? config.icon : '\u{2753}';
  };

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <View style={styles.headerBadges}>
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToLeaderboard(); }}
                style={styles.headerBadge}
                activeOpacity={0.7}
              >
                <Text style={styles.headerBadgeText}>{levelInfo?.emoji || '\u{1F331}'} Lv.{levelInfo?.level || 1}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToJourney(); }}
                style={[styles.headerBadge, progress && progress.streak > 0 && styles.headerBadgeStreak]}
                activeOpacity={0.7}
              >
                <Text style={styles.headerBadgeText}>
                  {progress && progress.streak > 0 ? '\u{1F525}' : '\u2728'} {progress?.streak || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* XP Widget -- Seviye ilerleme + Gunluk XP */}
          <Animated.View style={[styles.xpWidget, { opacity: xpWidgetOpacity }]}>
            <LinearGradient
              colors={['rgba(99,102,241,0.12)', 'rgba(139,92,246,0.08)']}
              style={styles.xpWidgetInner}
            >
              {/* Toplam XP ve Seviye */}
              <View style={styles.xpTopRow}>
                <View style={styles.xpLevelBadge}>
                  <Text style={styles.xpLevelEmoji}>{levelInfo?.emoji || '\u{1F331}'}</Text>
                  <View>
                    <Text style={styles.xpLevelTitle}>{levelInfo?.title || 'Merakli'}</Text>
                    <Text style={styles.xpLevelNumber}>Lv. {levelInfo?.level || 1}</Text>
                  </View>
                </View>
                <View style={styles.xpTotalBadge}>
                  <Text style={styles.xpTotalValue}>{totalXP.toLocaleString()}</Text>
                  <Text style={styles.xpTotalLabel}>XP</Text>
                </View>
              </View>

              {/* Seviye ilerleme cubugu */}
              <View style={styles.progressSection}>
                <View style={styles.progressBarBg}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      styles.levelProgressFill,
                      {
                        width: levelProgressWidth.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {levelInfo ? `${totalXP - levelInfo.minXP} / ${levelInfo.maxXP - levelInfo.minXP} XP` : ''}
                </Text>
              </View>

              {/* Ayirici cizgi */}
              <View style={styles.xpDivider} />

              {/* Gunluk XP hedef ve ilerleme */}
              <View style={styles.dailyXPSection}>
                <View style={styles.dailyXPHeader}>
                  <Text style={styles.dailyXPTitle}>{'\u{1F3AF}'} {t('dailyTasks')}</Text>
                  <Text style={styles.dailyXPCount}>
                    {dailyXP}/{dailyGoal} XP
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      styles.dailyProgressFill,
                      dailyXP >= dailyGoal && styles.dailyProgressComplete,
                      {
                        width: dailyProgressWidth.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Streak bilgisi */}
              {(progress?.streak || 0) > 0 && (
                <View style={styles.streakRow}>
                  <View style={styles.streakItem}>
                    <Text style={styles.streakIcon}>{'\u{1F525}'}</Text>
                    <Text style={styles.streakValue}>{progress?.streak || 0} {t('dayStreak')}</Text>
                  </View>
                  {dailyGoalStreak > 0 && (
                    <View style={styles.streakItem}>
                      <Text style={styles.streakIcon}>{'\u{1F3AF}'}</Text>
                      <Text style={styles.streakValue}>{dailyGoalStreak} {t('dailyTasksStreak')}</Text>
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Floating XP Animasyonlari -- XP widget uzerinde gosterilir */}
          {floatingXPs.map(floatingXP => (
            <Animated.View
              key={floatingXP.id}
              style={[
                styles.floatingXP,
                {
                  opacity: floatingXP.opacity,
                  transform: [{ translateY: floatingXP.translateY }],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.floatingXPText}>+{floatingXP.amount} XP</Text>
            </Animated.View>
          ))}

          {/* Kelime Karti */}
          <View style={styles.cardArea}>
            <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={styles.cardInner}
              >
                <Text style={styles.wordEmoji}>{word.emoji || getCategoryIcon(word.category)}</Text>
                <Text style={styles.wordText}>{word.target_word}</Text>
                {word.pronunciation && (
                  <Text style={styles.pronunciation}>{word.pronunciation}</Text>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={handleSpeak} style={styles.actionBtn} activeOpacity={0.7}>
                    <Text style={styles.actionBtnIcon}>{'\u{1F50A}'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleToggleFavorite} style={styles.actionBtn} activeOpacity={0.7}>
                    <Text style={styles.actionBtnIcon}>{isFav ? '\u2764\uFE0F' : '\u{1F90D}'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShare} style={styles.actionBtn} activeOpacity={0.7} disabled={isSharing}>
                    <Text style={styles.actionBtnIcon}>{isSharing ? '\u23F3' : '\u{1F4E4}'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowCulturalContext(true);
                    }}
                    style={styles.actionBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnIcon}>{'\u{1F4A1}'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleMeaningPress} activeOpacity={0.7}>
                  <Text style={styles.meaningToggle}>
                    {showMeaning ? `\u25BE ${t('hideMeaning')}` : `\u25B8 ${t('showMeaning')}`}
                  </Text>
                </TouchableOpacity>

                {showMeaning && (
                  <Animated.View style={[styles.meaningArea, {
                    opacity: meaningReveal,
                    transform: [{
                      translateY: meaningReveal.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
                    }],
                  }]}>
                    <Text style={styles.meaningText}>{localizedMeaning}</Text>
                  </Animated.View>
                )}

                <View style={styles.separator} />

                <View style={styles.exampleArea}>
                  <Text style={styles.exampleText}>{targetLanguageFlag} "{word.example_sentence}"</Text>
                  {localizedExample && (
                    <Text style={styles.exampleTrans}>{nativeLanguageFlag} {localizedExample}</Text>
                  )}
                </View>

                {/* Ozellik 2: Dilbilgisi Kapsulleri */}
                {showMeaning && (word.grammarNote || (word.sentencePatterns && word.sentencePatterns.length > 0)) && (
                  <>
                    <View style={styles.separator} />
                    <GrammarNuggets word={word} />
                  </>
                )}

                {/* Ozellik 5: Canli Kullanim Ornekleri */}
                {showMeaning && word.realWorldExamples && word.realWorldExamples.length > 0 && (
                  <>
                    <View style={styles.separator} />
                    <RealWorldExamples word={word} />
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Gunluk Gorev Paneli */}
          {dailyTasks && (
            <View style={styles.dailyTasksPanel}>
              <View style={styles.dailyTasksHeader}>
                <Text style={styles.dailyTasksTitle}>{'\u{2705}'} {t('dailyTasks')}</Text>
                {dailyTasks.allCompleted && (
                  <View style={styles.dailyTasksCompleteBadge}>
                    <Text style={styles.dailyTasksCompleteText}>{t('dailyTasksComplete')}</Text>
                  </View>
                )}
              </View>
              {dailyTasks.tasks.map((task) => (
                <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
                  <View style={styles.taskLeft}>
                    {/* Checkmark veya gorev ikonu */}
                    <View style={[styles.taskIconContainer, task.completed && styles.taskIconCompleted]}>
                      {task.completed ? (
                        <Animated.View style={{ transform: [{ scale: taskCheckScales[task.id] }] }}>
                          <Text style={styles.taskCheckmark}>{'\u2713'}</Text>
                        </Animated.View>
                      ) : (
                        <Text style={styles.taskIcon}>{getTaskIcon(task.id)}</Text>
                      )}
                    </View>
                    <Text style={[styles.taskLabel, task.completed && styles.taskLabelCompleted]}>
                      {getTaskLabel(task.id)}
                    </Text>
                  </View>
                  <View style={[styles.taskXPBadge, task.completed && styles.taskXPBadgeCompleted]}>
                    <Text style={[styles.taskXPText, task.completed && styles.taskXPTextCompleted]}>
                      +{task.xp} XP
                    </Text>
                  </View>
                </View>
              ))}
              {/* Bonus bilgisi */}
              {dailyTasks.allCompleted && dailyTasks.bonusClaimed && (
                <View style={styles.bonusRow}>
                  <Text style={styles.bonusText}>{'\u{1F381}'} {t('dailyTasksBonus')}: +30 XP</Text>
                </View>
              )}
            </View>
          )}

          {/* Haftalik Zorluk Paneli */}
          <WeeklyChallengePanel data={weeklyChallenge} />

          {/* Alt Aksiyonlar */}
          <View style={styles.bottomActions}>
            {dueCount > 0 && (
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNavigateToReview(); }}
                style={styles.reviewBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.reviewBtnText}>{'\u{1F504}'} {dueCount} {t('wordsToReview')}</Text>
              </TouchableOpacity>
            )}

            {/* Quiz Butonu */}
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNavigateToQuiz(); }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quizBtn}
              >
                <Text style={styles.quizBtnText}>{'\u{1F9E0}'} {t('startQuiz') || 'Quiz\'e Başla'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Pratik Yap - Zenginlestirilmis */}
            <View style={styles.practiceSection}>
              <Text style={styles.practiceSectionTitle}>
                {'\u{1F4AC}'} {userName ? `${userName}, ` : ''}{word ? `"${word.target_word}" ${t('practiceWithAI') || 'ile pratik yap'}` : t('practiceWithAI')}
              </Text>
              <Text style={styles.practiceSectionSubtitle}>
                {t('practiceSubtitle') || 'Bir senaryo seç ve konuşmaya başla!'}
              </Text>
              <View style={styles.scenarioGrid}>
                <TouchableOpacity
                  style={styles.scenarioCard}
                  activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleCompleteTask('practice_ai'); if (word) onNavigateToChat(word); }}
                >
                  <Text style={styles.scenarioEmoji}>{'\u2615'}</Text>
                  <Text style={styles.scenarioLabel}>{t('scenarioCafe') || 'Kafede'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scenarioCard}
                  activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleCompleteTask('practice_ai'); if (word) onNavigateToChat(word); }}
                >
                  <Text style={styles.scenarioEmoji}>{'\u2708\uFE0F'}</Text>
                  <Text style={styles.scenarioLabel}>{t('scenarioTravel') || 'Seyahatte'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scenarioCard}
                  activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleCompleteTask('practice_ai'); if (word) onNavigateToChat(word); }}
                >
                  <Text style={styles.scenarioEmoji}>{'\u{1F6D2}'}</Text>
                  <Text style={styles.scenarioLabel}>{t('scenarioShopping') || 'Alışverişte'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scenarioCard}
                  activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleCompleteTask('practice_ai'); if (word) onNavigateToChat(word); }}
                >
                  <Text style={styles.scenarioEmoji}>{'\u{1F4BC}'}</Text>
                  <Text style={styles.scenarioLabel}>{t('scenarioWork') || 'İş Yerinde'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scenarioCard}
                  activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleCompleteTask('practice_ai'); if (word) onNavigateToChat(word); }}
                >
                  <Text style={styles.scenarioEmoji}>{'\u{1F393}'}</Text>
                  <Text style={styles.scenarioLabel}>{t('scenarioSchool') || 'Okulda'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scenarioCard}
                  activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleCompleteTask('practice_ai'); if (word) onNavigateToChat(word); }}
                >
                  <Text style={styles.scenarioEmoji}>{'\u{1F46B}'}</Text>
                  <Text style={styles.scenarioLabel}>{t('scenarioFriends') || 'Arkadaşlarla'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Gizli paylasim karti (ekran disi) */}
      {word && (
        <View style={styles.shareCardHidden} pointerEvents="none">
          <ShareWordCard
            ref={shareCardRef}
            word={word}
            translation={getTranslation(word, nativeLanguage)}
            exampleTranslation={getExampleTranslation(word, nativeLanguage)}
            targetLanguageFlag={targetLanguageFlag}
            nativeLanguageFlag={nativeLanguageFlag}
          />
        </View>
      )}

      {/* Alt Navigasyon Cubugu */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => {}}>
          <Text style={styles.tabIcon}>{'\u{1F3E0}'}</Text>
          <Text style={styles.tabLabelActive}>{t('tabHome')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToHistory(); }}>
          <Text style={styles.tabIcon}>{'\u{1F4DA}'}</Text>
          <Text style={styles.tabLabel}>{t('tabHistory')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToBadges(); }}>
          <Text style={styles.tabIcon}>{'\u{1F3C6}'}</Text>
          <Text style={styles.tabLabel}>{t('tabBadges')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToJourney(); }}>
          <Text style={styles.tabIcon}>{'\u{1F680}'}</Text>
          <Text style={styles.tabLabel}>{t('tabJourney')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToSettings(); }}>
          <Text style={styles.tabIcon}>{'\u2699\uFE0F'}</Text>
          <Text style={styles.tabLabel}>{t('tabSettings')}</Text>
        </TouchableOpacity>
      </View>

      {/* Kulturel Baglam Modali */}
      <CulturalContextModal
        visible={showCulturalContext}
        word={word}
        onClose={() => setShowCulturalContext(false)}
      />

      {/* Level Up Overlay -- seviye atladiginda gosterilir */}
      {showLevelUp && levelInfo && (
        <Animated.View style={[styles.levelUpOverlay, { opacity: levelUpOpacity }]}>
          <Animated.View style={[styles.levelUpCard, { transform: [{ scale: levelUpScale }] }]}>
            <LinearGradient
              colors={['rgba(99,102,241,0.95)', 'rgba(139,92,246,0.95)']}
              style={styles.levelUpContent}
            >
              <Text style={styles.levelUpEmoji}>{levelInfo.emoji}</Text>
              <Text style={styles.levelUpTitle}>Seviye Atladin!</Text>
              <Text style={styles.levelUpLevel}>Seviye {levelInfo.level}</Text>
              <Text style={styles.levelUpName}>{levelInfo.title}</Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  // ─── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    flex: 1,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeStreak: {
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },

  // ─── XP Widget ───────────────────────────────────────────
  xpWidget: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  xpWidgetInner: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  xpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpLevelEmoji: {
    fontSize: 32,
  },
  xpLevelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
  },
  xpLevelNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  xpTotalBadge: {
    alignItems: 'flex-end',
  },
  xpTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FBBF24',
  },
  xpTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(251,191,36,0.6)',
    letterSpacing: 1,
  },

  // ─── Progress Bar ────────────────────────────────────────
  progressSection: {
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelProgressFill: {
    backgroundColor: '#8B5CF6',
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    textAlign: 'right',
  },
  xpDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 10,
  },

  // ─── Gunluk XP Hedef ────────────────────────────────────
  dailyXPSection: {
    marginBottom: 4,
  },
  dailyXPHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailyXPTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  dailyXPCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  dailyProgressFill: {
    backgroundColor: '#6EE7B7',
  },
  dailyProgressComplete: {
    backgroundColor: '#34D399',
  },

  // ─── Streak Gosterimi ────────────────────────────────────
  streakRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakIcon: {
    fontSize: 14,
  },
  streakValue: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },

  // ─── Floating XP Animasyonu ──────────────────────────────
  floatingXP: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    zIndex: 100,
  },
  floatingXPText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FBBF24',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ─── Kelime Karti ────────────────────────────────────────
  cardArea: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    width: width - 40,
    borderRadius: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardInner: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  wordEmoji: {
    fontSize: 28,
    marginBottom: 12,
  },
  wordText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 4,
  },
  pronunciation: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnIcon: {
    fontSize: 20,
  },
  meaningToggle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
    marginBottom: 4,
    paddingVertical: 4,
  },
  meaningArea: {
    marginTop: 8,
    alignItems: 'center',
  },
  meaningText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6EE7B7',
    textAlign: 'center',
    lineHeight: 26,
  },
  separator: {
    width: '60%' as any,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 16,
  },
  exampleArea: {
    width: '100%' as any,
  },
  exampleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  exampleTrans: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 20,
  },

  // ─── Gunluk Gorev Paneli ─────────────────────────────────
  dailyTasksPanel: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  dailyTasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dailyTasksTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
  },
  dailyTasksCompleteBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dailyTasksCompleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  taskCardCompleted: {
    backgroundColor: 'rgba(52,211,153,0.06)',
    borderColor: 'rgba(52,211,153,0.15)',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIconCompleted: {
    backgroundColor: 'rgba(52,211,153,0.2)',
  },
  taskIcon: {
    fontSize: 18,
  },
  taskCheckmark: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34D399',
  },
  taskLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  taskLabelCompleted: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'line-through',
  },
  taskXPBadge: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskXPBadgeCompleted: {
    backgroundColor: 'rgba(52,211,153,0.1)',
  },
  taskXPText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBBF24',
  },
  taskXPTextCompleted: {
    color: '#34D399',
  },
  bonusRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  bonusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
  },

  // ─── Alt Aksiyonlar ──────────────────────────────────────
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  reviewBtn: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  reviewBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FBBF24',
  },
  practiceBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  practiceBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quizBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  quizBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  practiceSection: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
    marginTop: 4,
  },
  practiceSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  practiceSectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 14,
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  scenarioCard: {
    width: (width - 72) / 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  scenarioEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  scenarioLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },

  // ─── Gizli Paylasim Karti ───────────────────────────────
  shareCardHidden: {
    position: 'absolute',
    top: -9999,
    left: -9999,
  },

  // ─── Alt Navigasyon Cubugu ───────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15,10,46,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  tabLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
  },

  // ─── Level Up Overlay ────────────────────────────────────
  levelUpOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  levelUpCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  levelUpContent: {
    paddingHorizontal: 40,
    paddingVertical: 36,
    alignItems: 'center',
    borderRadius: 24,
  },
  levelUpEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  levelUpTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  levelUpLevel: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FBBF24',
    marginBottom: 4,
  },
  levelUpName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
});

export default HomeScreen;
