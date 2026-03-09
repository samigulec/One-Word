// HomeScreen.tsx -- v2.0.0 Sadelestirilmis Ana Sayfa
// Kompakt header + gamification bar + kelime karti + aksiyon butonlari
// Gunluk gorevler, haftalik zorluk, rozetler, senaryo kartlari TASINDI

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
import { ContentItem, UserProgress, ProficiencyLevel, LevelInfo, DailyTaskId } from '../types';
import { getWordOfTheDay, getTranslation, getExampleTranslation } from '../utils/contentLoader';
import { updateDailyStreak, toggleFavorite, isFavorite, addLearnedWord, getDueWordsForToday, getUserName, getDailyXPStatus, addXP, completeDailyTask, updateWeeklyChallengeGoal, claimWeeklyChallengeBonus } from '../utils/storage';
import { getTranslation as getUITranslation, LanguageCode, LANGUAGES } from '../utils/translations';
import ShareWordCard from '../components/ShareWordCard';
import CulturalContextModal from '../components/CulturalContextModal';
import GrammarNuggets from '../components/GrammarNuggets';
import RealWorldExamples from '../components/RealWorldExamples';
import { SkeletonCard } from '../components/SkeletonLoader';
import { getCategoryIcon } from '../utils/categoryIcons';

const { width } = Dimensions.get('window');

type HomeScreenProps = {
  onNavigateToChat: (word: ContentItem) => void;
  onNavigateToQuests: () => void;
  onNavigateToHistory: () => void;
  onNavigateToProfile: () => void;
  onNavigateToReview: () => void;
  onNavigateToQuiz: () => void;
  onNavigateToPractice: (word?: ContentItem) => void;
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

// Kelime karti icindeki tab secenekleri
type WordCardTab = 'meaning' | 'example' | 'grammar';

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToChat, onNavigateToQuests,
  onNavigateToHistory, onNavigateToProfile,
  onNavigateToReview, onNavigateToQuiz,
  onNavigateToPractice, onNavigateToLeaderboard,
  nativeLanguage, targetLanguage, proficiencyLevel,
  calmMode,
}) => {
  // Ana state'ler
  const [word, setWord] = useState<ContentItem | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [userName, setUserName] = useState<string>('');

  // XP & seviye state'leri
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [dailyXP, setDailyXP] = useState<number>(0);
  const [dailyGoal, setDailyGoal] = useState<number>(50);
  const [totalXP, setTotalXP] = useState<number>(0);
  const [levelProgress, setLevelProgress] = useState<number>(0);

  // Kelime karti tab state
  const [activeWordTab, setActiveWordTab] = useState<WordCardTab>('meaning');

  // Kulturel baglam modal state
  const [showCulturalContext, setShowCulturalContext] = useState(false);

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
  const levelProgressWidth = useRef(new Animated.Value(0)).current;

  const shareCardRef = useRef<View>(null);

  // Buton press scale animasyonlari -- Pratik Yap ve Quiz Coz butonlari icin
  const practiceScale = useRef(new Animated.Value(1)).current;
  const quizScale = useRef(new Animated.Value(1)).current;

  // Butona basildiginda kuculme efekti
  const handlePressIn = (scaleAnim: Animated.Value) => {
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  // Butondan el kaldirildiginda geri bounce efekti
  const handlePressOut = (scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

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
  }, [targetLanguage, proficiencyLevel]);

  // Giris animasyonlari
  const startAnimations = () => {
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  // XP durumunu yukle ve progress bar animasyonlarini tetikle
  const loadXPStatus = async () => {
    const status = await getDailyXPStatus();
    setLevelInfo(status.levelInfo);
    setDailyXP(status.dailyXP);
    setDailyGoal(status.dailyGoal);
    setTotalXP(status.totalXP);
    setLevelProgress(status.levelProgress);

    Animated.timing(levelProgressWidth, {
      toValue: status.levelProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  };

  // Floating "+X XP" animasyonu olustur
  const triggerFloatingXP = (amount: number) => {
    const id = floatingIdRef.current++;
    const opacity = new Animated.Value(1);
    const translateY = new Animated.Value(0);
    const newFloat: FloatingXP = { id, amount, opacity, translateY };
    setFloatingXPs(prev => [...prev, newFloat]);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -60, duration: 1200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 1200, delay: 300, useNativeDriver: true }),
    ]).start(() => {
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
      setActiveWordTab('meaning');
      const idHash = parseInt(todaysWord.id.replace(/\D/g, '')) || 1;
      const updatedProgress = await updateDailyStreak(idHash);
      setProgress(updatedProgress);
      // Kelimeyi ogrenilmis olarak kaydet -- sadece yeni eklendiyse XP ver
      const isNewWord = await addLearnedWord(todaysWord);
      const favStatus = await isFavorite(todaysWord.id);
      setIsFav(favStatus);
      if (isNewWord) {
        // XP ekle ve level atlama kontrolu yap
        const wordXPResult = await addXP('word_learned');
        if (wordXPResult.leveledUp && wordXPResult.newLevel) {
          triggerLevelUpAnimation(wordXPResult.newLevel);
        }
        if (wordXPResult.gained > 0) triggerFloatingXP(wordXPResult.gained);
        await completeDailyTask('learn_word');
      }
      await loadXPStatus();
      // Haftalik zorluk: kelime ogrenme hedefini guncelle
      const wcResult = await updateWeeklyChallengeGoal('learn_words');
      if (wcResult.justCompleted) {
        const bonus = await claimWeeklyChallengeBonus();
        if (bonus > 0) {
          // Bonus XP ekle ve level atlama kontrolu yap
          const bonusXPResult = await addXP('daily_goal_reached', bonus);
          if (bonusXPResult.leveledUp && bonusXPResult.newLevel) {
            triggerLevelUpAnimation(bonusXPResult.newLevel);
          }
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
      if (result.leveledUp && result.newLevel) triggerLevelUpAnimation(result.newLevel);
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
        if (result.leveledUp && result.newLevel) triggerLevelUpAnimation(result.newLevel);
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
        if (result.leveledUp && result.newLevel) triggerLevelUpAnimation(result.newLevel);
        if (result.gained > 0) triggerFloatingXP(result.gained);
        loadXPStatus();
      });
      completeDailyTask('discover_meaning');
      Animated.spring(meaningReveal, {
        toValue: 1, tension: 50, friction: 6, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(meaningReveal, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }).start(() => setShowMeaning(false));
    }
  };

  // Yukleniyor durumu -- skeleton placeholder gosterilir
  if (!word) {
    return (
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.scrollContent}>
            {/* Skeleton header alani */}
            <View style={styles.header}>
              <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' }} />
              <View style={{ width: 50, height: 24, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            </View>
            {/* Skeleton kelime karti */}
            <SkeletonCard />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const localizedMeaning = getTranslation(word, nativeLanguage);
  const localizedExample = getExampleTranslation(word, nativeLanguage);

  // Kelime karti tab icerik renderla
  const renderWordTabContent = () => {
    switch (activeWordTab) {
      case 'meaning':
        return (
          <Animated.View style={[styles.tabContentArea, {
            opacity: meaningReveal,
            transform: [{
              translateY: meaningReveal.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
            }],
          }]}>
            <Text style={styles.meaningText}>{localizedMeaning}</Text>
            <View style={styles.separator} />
            <View style={styles.exampleArea}>
              <Text style={styles.exampleText}>{targetLanguageFlag} "{word.example_sentence}"</Text>
              {localizedExample && (
                <Text style={styles.exampleTrans}>{nativeLanguageFlag} {localizedExample}</Text>
              )}
            </View>
          </Animated.View>
        );
      case 'example':
        return (
          <Animated.View style={[styles.tabContentArea, { opacity: meaningReveal }]}>
            {word.realWorldExamples && word.realWorldExamples.length > 0 ? (
              <RealWorldExamples word={word} />
            ) : (
              <View style={styles.emptyTabContent}>
                <Text style={styles.emptyTabEmoji}>{'\u{1F4D6}'}</Text>
                <Text style={styles.emptyTabText}>{t('noExamplesYet')}</Text>
              </View>
            )}
          </Animated.View>
        );
      case 'grammar':
        return (
          <Animated.View style={[styles.tabContentArea, { opacity: meaningReveal }]}>
            {(word.grammarNote || (word.sentencePatterns && word.sentencePatterns.length > 0)) ? (
              <GrammarNuggets word={word} />
            ) : (
              <View style={styles.emptyTabContent}>
                <Text style={styles.emptyTabEmoji}>{'\u{1F4DD}'}</Text>
                <Text style={styles.emptyTabText}>{t('noGrammarYet')}</Text>
              </View>
            )}
          </Animated.View>
        );
    }
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
          {/* ── Minimal Header: Bayrak + Streak ── */}
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToProfile(); }}
              activeOpacity={0.7}
              style={styles.headerFlag}
              accessibilityRole="button"
              accessibilityLabel={`Learning ${targetLanguage}`}
            >
              <Text style={styles.headerFlagText}>{targetLanguageFlag}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToLeaderboard(); }}
              activeOpacity={0.7}
              style={styles.headerStreak}
              accessibilityRole="button"
              accessibilityLabel={`Streak ${progress?.streak || 0} days`}
              accessibilityHint="Opens the leaderboard"
            >
              <Text style={styles.headerStreakEmoji}>{'\u{1F525}'}</Text>
              <Text style={styles.headerStreakValue}>{progress?.streak || 0}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Floating XP Animasyonlari -- calmMode aktifken gizlenir */}
          {!calmMode && floatingXPs.map(floatingXP => (
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

          {/* ── Kelime Karti (Sadelestirmis) ── */}
          <View style={styles.cardArea}>
            <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={styles.cardInner}
              >
                {/* Kelime emojisi */}
                <Text style={styles.wordEmoji}>{word.emoji || getCategoryIcon(word.category)}</Text>

                {/* Kelime */}
                <Text style={styles.wordText} accessibilityRole="header" accessibilityLabel={`Word of the day: ${word.target_word}`}>{word.target_word}</Text>

                {/* Telaffuz */}
                {word.pronunciation && (
                  <Text style={styles.pronunciation}>{word.pronunciation}</Text>
                )}

                {/* Aksiyon butonlari */}
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={handleSpeak} style={styles.actionBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Listen to pronunciation" accessibilityHint="Plays the word audio">
                    <Text style={styles.actionBtnIcon}>{'\u{1F50A}'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleToggleFavorite} style={styles.actionBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={isFav ? "Remove from favorites" : "Add to favorites"} accessibilityHint="Toggles favorite status" accessibilityState={{ selected: isFav }}>
                    <Text style={styles.actionBtnIcon}>{isFav ? '\u2764\uFE0F' : '\u{1F90D}'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShare} style={styles.actionBtn} activeOpacity={0.7} disabled={isSharing} accessibilityRole="button" accessibilityLabel="Share this word" accessibilityHint="Opens the share dialog" accessibilityState={{ disabled: isSharing }}>
                    <Text style={styles.actionBtnIcon}>{isSharing ? '\u23F3' : '\u{1F4E4}'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowCulturalContext(true);
                    }}
                    style={styles.actionBtn}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Cultural context"
                    accessibilityHint="Shows cultural background information"
                  >
                    <Text style={styles.actionBtnIcon}>{'\u{1F4A1}'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Anlamini Gor butonu */}
                <TouchableOpacity onPress={handleMeaningPress} activeOpacity={0.7} style={styles.meaningToggleBtn} accessibilityRole="button" accessibilityLabel={showMeaning ? "Hide meaning" : "Show meaning"} accessibilityHint={showMeaning ? "Hides the word meaning and examples" : "Reveals the word meaning and examples"} accessibilityState={{ expanded: showMeaning }}>
                  <LinearGradient
                    colors={showMeaning ? ['rgba(110,231,183,0.15)', 'rgba(52,211,153,0.1)'] : ['rgba(167,139,250,0.15)', 'rgba(99,102,241,0.1)']}
                    style={styles.meaningToggleBtnInner}
                  >
                    <Text style={styles.meaningToggle}>
                      {showMeaning ? `\u25BE ${t('hideMeaning')}` : `\u25B8 ${t('showMeaning')}`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Anlam acildiginda: Tab'lar ile icerik goster */}
                {showMeaning && (
                  <View style={styles.wordCardTabs}>
                    {/* Tab seciciler */}
                    <View style={styles.wordCardTabBar}>
                      <TouchableOpacity
                        style={[styles.wordCardTabItem, activeWordTab === 'meaning' && styles.wordCardTabItemActive]}
                        onPress={() => setActiveWordTab('meaning')}
                        accessibilityRole="tab"
                        accessibilityLabel="Meaning"
                        accessibilityState={{ selected: activeWordTab === 'meaning' }}
                      >
                        <Text style={[styles.wordCardTabText, activeWordTab === 'meaning' && styles.wordCardTabTextActive]}>
                          {t('tabMeaning')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.wordCardTabItem, activeWordTab === 'example' && styles.wordCardTabItemActive]}
                        onPress={() => setActiveWordTab('example')}
                        accessibilityRole="tab"
                        accessibilityLabel="Examples"
                        accessibilityState={{ selected: activeWordTab === 'example' }}
                      >
                        <Text style={[styles.wordCardTabText, activeWordTab === 'example' && styles.wordCardTabTextActive]}>
                          {t('tabExample')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.wordCardTabItem, activeWordTab === 'grammar' && styles.wordCardTabItemActive]}
                        onPress={() => setActiveWordTab('grammar')}
                        accessibilityRole="tab"
                        accessibilityLabel="Grammar"
                        accessibilityState={{ selected: activeWordTab === 'grammar' }}
                      >
                        <Text style={[styles.wordCardTabText, activeWordTab === 'grammar' && styles.wordCardTabTextActive]}>
                          {t('tabGrammar')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Tab icerigi */}
                    {renderWordTabContent()}
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {/* ── Aksiyon Butonlari ── */}
          <View style={styles.actionButtons}>
            {/* Pratik Yap butonu -- press scale efekti ile */}
            <Animated.View style={{ transform: [{ scale: practiceScale }] }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  completeDailyTask('practice_ai');
                  onNavigateToPractice(word);
                }}
                onPressIn={() => handlePressIn(practiceScale)}
                onPressOut={() => handlePressOut(practiceScale)}
                activeOpacity={0.85}
                style={styles.primaryActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Practice"
                accessibilityHint="Opens AI practice session with this word"
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryActionBtnInner}
                >
                  <Text style={styles.primaryActionBtnText}>{'\u{1F4AC}'} {t('practiceNow')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Quiz Coz butonu -- press scale efekti ile */}
            <Animated.View style={{ transform: [{ scale: quizScale }] }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onNavigateToQuiz();
                }}
                onPressIn={() => handlePressIn(quizScale)}
                onPressOut={() => handlePressOut(quizScale)}
                activeOpacity={0.85}
                style={styles.primaryActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Start Quiz"
                accessibilityHint="Opens a vocabulary quiz"
              >
                <LinearGradient
                  colors={['#F59E0B', '#EF4444']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryActionBtnInner}
                >
                  <Text style={styles.primaryActionBtnText}>{'\u{1F9E0}'} {t('startQuiz') || 'Quiz Coz'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Tekrar hatirlatma */}
            {dueCount > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onNavigateToReview();
                }}
                style={styles.reviewBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${dueCount} words to review`}
                accessibilityHint="Opens the review session"
              >
                <Text style={styles.reviewBtnText}>
                  {'\u{1F504}'} {dueCount} {t('wordsToReview')} {'\u203A'}
                </Text>
              </TouchableOpacity>
            )}
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

      {/* Alt Navigasyon Cubugu -- 4 tab: Home | Quests | History | Profile */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => {}} accessibilityRole="tab" accessibilityLabel="Home" accessibilityState={{ selected: true }}>
          <Text style={styles.tabIcon}>{'\u{1F3E0}'}</Text>
          <Text style={styles.tabLabelActive}>{t('tabHome')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToQuests(); }} accessibilityRole="tab" accessibilityLabel="Quests" accessibilityState={{ selected: false }} accessibilityHint="Opens quests and daily tasks">
          <Text style={styles.tabIcon}>{'\u{1F3AF}'}</Text>
          <Text style={styles.tabLabel}>{t('tabQuests')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToHistory(); }} accessibilityRole="tab" accessibilityLabel="History" accessibilityState={{ selected: false }} accessibilityHint="Opens word history">
          <Text style={styles.tabIcon}>{'\u{1F4DA}'}</Text>
          <Text style={styles.tabLabel}>{t('tabHistory')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToProfile(); }} accessibilityRole="tab" accessibilityLabel="Profile" accessibilityState={{ selected: false }} accessibilityHint="Opens profile and settings">
          <Text style={styles.tabIcon}>{'\u{1F464}'}</Text>
          <Text style={styles.tabLabel}>{t('tabProfile')}</Text>
        </TouchableOpacity>
      </View>

      {/* Kulturel Baglam Modali */}
      <CulturalContextModal
        visible={showCulturalContext}
        word={word}
        onClose={() => setShowCulturalContext(false)}
      />

      {/* Level Up Overlay -- calmMode aktifken gizlenir */}
      {!calmMode && showLevelUp && levelInfo && (
        <Animated.View style={[styles.levelUpOverlay, { opacity: levelUpOpacity }]}>
          <Animated.View style={[styles.levelUpCard, { transform: [{ scale: levelUpScale }] }]}>
            <LinearGradient
              colors={['rgba(99,102,241,0.95)', 'rgba(139,92,246,0.95)']}
              style={styles.levelUpContent}
            >
              <Text style={styles.levelUpEmoji}>{levelInfo.emoji}</Text>
              <Text style={styles.levelUpTitle} accessibilityRole="header">{t('levelUp')}</Text>
              <Text style={styles.levelUpLevel}>{t('levelPrefix')}{levelInfo.level}</Text>
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

  // ── Minimal Header: Bayrak + Streak ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerFlag: {
    padding: 4,
  },
  headerFlagText: {
    fontSize: 32,
  },
  headerStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerStreakEmoji: {
    fontSize: 22,
  },
  headerStreakValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FBBF24',
  },

  // ── Floating XP ──
  floatingXP: {
    position: 'absolute',
    top: 100,
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

  // ── Kelime Karti ──
  cardArea: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
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
    fontSize: 32,
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
  actionBtnIcon: { fontSize: 20 },

  // Anlamini Gor butonu
  meaningToggleBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  meaningToggleBtnInner: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  meaningToggle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
  },

  // Kelime karti icindeki tab'lar
  wordCardTabs: {
    width: '100%',
    marginTop: 16,
  },
  wordCardTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  wordCardTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  wordCardTabItemActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
  },
  wordCardTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  wordCardTabTextActive: {
    color: '#A78BFA',
    fontWeight: '700',
  },
  tabContentArea: {
    width: '100%',
  },
  meaningText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6EE7B7',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  separator: {
    width: '60%' as any,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
    alignSelf: 'center',
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
  emptyTabContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTabEmoji: { fontSize: 28, marginBottom: 8, opacity: 0.5 },
  emptyTabText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  // ── Aksiyon Butonlari ──
  actionButtons: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 8,
  },
  primaryActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryActionBtnInner: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryActionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewBtn: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingVertical: 14,
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

  // ── Gizli Paylasim Karti ──
  shareCardHidden: {
    position: 'absolute',
    top: -9999,
    left: -9999,
  },

  // ── Alt Navigasyon Cubugu (4 tab) ──
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

  // ── Level Up Overlay ──
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
  levelUpEmoji: { fontSize: 64, marginBottom: 12 },
  levelUpTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  levelUpLevel: { fontSize: 36, fontWeight: '900', color: '#FBBF24', marginBottom: 4 },
  levelUpName: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
});

export default HomeScreen;
