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
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ContentItem, UserProgress, ProficiencyLevel, LevelInfo, DailyTaskId } from '../types';
import { getWordOfTheDay, getTranslation, getExampleTranslation, loadContentForLevel } from '../utils/contentLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateDailyStreak, toggleFavorite, isFavorite, addLearnedWord, getDueWordsForToday, getUserName, getDailyXPStatus, addXP, completeDailyTask, updateWeeklyChallengeGoal, claimWeeklyChallengeBonus } from '../utils/storage';
import { getTranslation as getUITranslation, LanguageCode, LANGUAGES } from '../utils/translations';
import ShareWordCard from '../components/ShareWordCard';
import { SkeletonCard } from '../components/SkeletonLoader';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Kategoriye gore vektor ikon + gradient renkleri
type CategoryStyle = {
  icon: string;
  iconSet: 'ion' | 'mci';
  colors: [string, string];
};

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  greetings:     { icon: 'hand-wave', iconSet: 'mci', colors: ['#FBBF24', '#F59E0B'] },
  daily_life:    { icon: 'home-outline', iconSet: 'mci', colors: ['#60A5FA', '#3B82F6'] },
  home:          { icon: 'home-outline', iconSet: 'mci', colors: ['#60A5FA', '#3B82F6'] },
  people:        { icon: 'people-outline', iconSet: 'ion', colors: ['#F472B6', '#EC4899'] },
  food_drink:    { icon: 'restaurant-outline', iconSet: 'ion', colors: ['#FB923C', '#F97316'] },
  travel:        { icon: 'airplane-outline', iconSet: 'ion', colors: ['#34D399', '#10B981'] },
  work_business: { icon: 'briefcase-outline', iconSet: 'ion', colors: ['#A78BFA', '#8B5CF6'] },
  emotions:      { icon: 'happy-outline', iconSet: 'ion', colors: ['#FCD34D', '#FBBF24'] },
  nature:        { icon: 'leaf-outline', iconSet: 'ion', colors: ['#4ADE80', '#22C55E'] },
  health:        { icon: 'heart-outline', iconSet: 'ion', colors: ['#F87171', '#EF4444'] },
  technology:    { icon: 'laptop-outline', iconSet: 'ion', colors: ['#818CF8', '#6366F1'] },
  education:     { icon: 'school-outline', iconSet: 'ion', colors: ['#67E8F9', '#22D3EE'] },
  culture:       { icon: 'color-palette-outline', iconSet: 'ion', colors: ['#E879F9', '#D946EF'] },
  sports:        { icon: 'football-outline', iconSet: 'ion', colors: ['#34D399', '#10B981'] },
  music:         { icon: 'musical-notes-outline', iconSet: 'ion', colors: ['#C084FC', '#A855F7'] },
  shopping:      { icon: 'cart-outline', iconSet: 'ion', colors: ['#FB923C', '#F97316'] },
  weather:       { icon: 'sunny-outline', iconSet: 'ion', colors: ['#FDE68A', '#FCD34D'] },
  family:        { icon: 'people-circle-outline', iconSet: 'ion', colors: ['#F9A8D4', '#F472B6'] },
  animals:       { icon: 'paw-outline', iconSet: 'ion', colors: ['#86EFAC', '#4ADE80'] },
  colors:        { icon: 'color-palette-outline', iconSet: 'ion', colors: ['#C084FC', '#A855F7'] },
  numbers:       { icon: 'keypad-outline', iconSet: 'ion', colors: ['#93C5FD', '#60A5FA'] },
  time:          { icon: 'time-outline', iconSet: 'ion', colors: ['#FDA4AF', '#FB7185'] },
  body:          { icon: 'body-outline', iconSet: 'ion', colors: ['#FDBA74', '#FB923C'] },
  clothing:      { icon: 'shirt-outline', iconSet: 'ion', colors: ['#A5B4FC', '#818CF8'] },
  city:          { icon: 'business-outline', iconSet: 'ion', colors: ['#67E8F9', '#22D3EE'] },
};

const DEFAULT_STYLE: CategoryStyle = { icon: 'sparkles-outline', iconSet: 'ion', colors: ['#A78BFA', '#8B5CF6'] };

const getCategoryStyle = (category?: string): CategoryStyle => {
  if (!category) return DEFAULT_STYLE;
  return CATEGORY_STYLES[category] || DEFAULT_STYLE;
};

const CategoryIcon: React.FC<{ category?: string; size?: number }> = ({ category, size = 34 }) => {
  const style = getCategoryStyle(category);
  if (style.iconSet === 'mci') {
    return <MaterialCommunityIcons name={style.icon as any} size={size} color="#FFFFFF" />;
  }
  return <Ionicons name={style.icon as any} size={size} color="#FFFFFF" />;
};

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
  /** [GUESS_GAME] Gunun Tahmini oyununu ac */
  onNavigateToGuessGame?: () => void;
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

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToChat, onNavigateToQuests,
  onNavigateToHistory, onNavigateToProfile,
  onNavigateToReview, onNavigateToQuiz,
  onNavigateToPractice, onNavigateToLeaderboard,
  onNavigateToGuessGame,
  nativeLanguage, targetLanguage, proficiencyLevel,
  calmMode,
}) => {
  // Ana state'ler
  const [word, setWord] = useState<ContentItem | null>(null);
  const [wordList, setWordList] = useState<ContentItem[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
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

  // Tutorial overlay state -- ilk kullanim kilavuzu
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const tutorialFade = useRef(new Animated.Value(0)).current;

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

  // Tinder-style swipe animasyonlari
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeY = useRef(new Animated.Value(0)).current;
  const wordListRef = useRef<ContentItem[]>([]);
  const wordIndexRef = useRef(0);
  const unlockedCountRef = useRef(1); // Kac kelime acilmis (1-3)
  const [unlockedCount, setUnlockedCount] = useState(1);

  const SWIPE_THRESHOLD = 100;
  const SWIPE_UP_THRESHOLD = -60;
  const MAX_WORDS = 3;

  // Super like animasyonu
  const [showSuperLike, setShowSuperLike] = useState(false);
  const superLikeScale = useRef(new Animated.Value(0)).current;
  const superLikeOpacity = useRef(new Animated.Value(0)).current;

  // Gunluk key -- acilan kelime sayisini persist etmek icin
  const getDailySwipeKey = () => {
    const d = new Date();
    return `home_unlocked_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  // Karta animasyonlu gecis -- bouncy spring fizigi
  const animateToWord = (targetIndex: number, direction: number) => {
    Animated.timing(swipeX, {
      toValue: direction * (width + 100),
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      wordIndexRef.current = targetIndex;
      setWordIndex(targetIndex);
      const targetWord = wordListRef.current[targetIndex];
      if (targetWord) {
        setWord(targetWord);
        setShowMeaning(false);
        meaningReveal.setValue(0);
        isFavorite(targetWord.id).then(setIsFav);
        // Yeni kelimeye gecildiginde otomatik olarak seslendir
        speakWord(targetWord.target_word);
      }
      swipeX.setValue(0);
      swipeY.setValue(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      cardScale.setValue(0.9);
      cardOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, tension: 70, friction: 5, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  // Super like tetikle -- yukari swipe ile favorilere ekle
  const triggerSuperLike = () => {
    if (!word) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Favori ekle
    toggleFavorite(word.id).then(newFav => {
      setIsFav(newFav);
      if (newFav) {
        addXP('favorite_added').then(r => {
          if (r.leveledUp && r.newLevel) triggerLevelUpAnimation(r.newLevel);
          if (r.gained > 0) triggerFloatingXP(r.gained);
          loadXPStatus();
        });
      }
    });
    // Animasyon -- buyuk ve belirgin
    setShowSuperLike(true);
    superLikeScale.setValue(0.3);
    superLikeOpacity.setValue(1);
    Animated.sequence([
      Animated.spring(superLikeScale, { toValue: 1.3, tension: 80, friction: 4, useNativeDriver: true }),
      Animated.spring(superLikeScale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
    ]).start();
    Animated.timing(superLikeOpacity, { toValue: 0, duration: 1500, delay: 800, useNativeDriver: true })
      .start(() => setShowSuperLike(false));
    // Kart yukari zipla ve geri gel
    Animated.sequence([
      Animated.timing(swipeY, { toValue: -120, duration: 180, useNativeDriver: true }),
      Animated.spring(swipeY, { toValue: 0, tension: 70, friction: 5, useNativeDriver: true }),
    ]).start();
    Animated.spring(swipeX, { toValue: 0, tension: 70, friction: 5, useNativeDriver: true }).start();
  };

  // Swipe islemi -- yeni kelime ac veya acilmis kelimeler arasinda don
  const handleSwipe = (direction: number) => {
    const currentIdx = wordIndexRef.current;
    const total = wordListRef.current.length;
    const unlocked = unlockedCountRef.current;

    if (direction > 0) {
      // Saga cek → sonraki kelime
      const nextIdx = (currentIdx + 1) % total;
      if (nextIdx < unlocked) {
        // Zaten acilmis, dongusel gecis
        animateToWord(nextIdx, 1);
      } else if (unlocked < MAX_WORDS) {
        // Yeni kelime ac
        unlockedCountRef.current = unlocked + 1;
        setUnlockedCount(unlocked + 1);
        AsyncStorage.setItem(getDailySwipeKey(), String(unlocked + 1));
        const newWord = wordListRef.current[nextIdx];
        if (newWord) {
          addLearnedWord(newWord).then(isNew => {
            if (isNew) {
              addXP('word_learned').then(r => {
                if (r.leveledUp && r.newLevel) triggerLevelUpAnimation(r.newLevel);
                if (r.gained > 0) triggerFloatingXP(r.gained);
                loadXPStatus();
              });
            }
          });
        }
        animateToWord(nextIdx, 1);
      } else {
        // Tum kelimeler acik, dongusel
        animateToWord(nextIdx, 1);
      }
    } else {
      // Sola cek → onceki kelime
      const prevIdx = (currentIdx - 1 + total) % total;
      if (prevIdx < unlocked) {
        animateToWord(prevIdx, -1);
      } else {
        // Henuz acilmamis, geri don
        Animated.spring(swipeX, { toValue: 0, tension: 70, friction: 5, useNativeDriver: true }).start();
        Animated.spring(swipeY, { toValue: 0, tension: 70, friction: 5, useNativeDriver: true }).start();
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 8 || Math.abs(gs.dy) > 8,
      onPanResponderMove: Animated.event(
        [null, { dx: swipeX, dy: swipeY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gs) => {
        if (gs.dy < SWIPE_UP_THRESHOLD && Math.abs(gs.dx) < 80) {
          // Yukari swipe → Super Like (favorilere ekle)
          triggerSuperLike();
        } else if (Math.abs(gs.dx) > SWIPE_THRESHOLD) {
          handleSwipe(gs.dx > 0 ? 1 : -1);
        } else {
          Animated.spring(swipeX, { toValue: 0, tension: 70, friction: 5, useNativeDriver: true }).start();
          Animated.spring(swipeY, { toValue: 0, tension: 70, friction: 5, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  // Kart rotation -- swipe esnasinda dramatik tilt (18 derece)
  const cardRotate = swipeX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-18deg', '0deg', '18deg'],
  });

  // Stamp overlay opakliklari
  const stampRightOpacity = swipeX.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [0, 0.6, 1],
    extrapolate: 'clamp',
  });
  const stampLeftOpacity = swipeX.interpolate({
    inputRange: [-120, -60, 0],
    outputRange: [1, 0.6, 0],
    extrapolate: 'clamp',
  });
  const stampUpOpacity = swipeY.interpolate({
    inputRange: [-100, -40, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Stack kartlari icin scale -- arkadaki kartlar buyur
  const backCard1Scale = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: [0.98, 0.95, 0.98],
    extrapolate: 'clamp',
  });
  const backCard2Scale = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: [0.95, 0.90, 0.95],
    extrapolate: 'clamp',
  });

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
    // Ilk kullanim tutorial kontrolu -- AsyncStorage'dan okunur
    checkTutorialStatus();
  }, [targetLanguage, proficiencyLevel]);

  // Tutorial durumunu kontrol et -- daha once gosterilmisse tekrar gosterme
  const checkTutorialStatus = async () => {
    try {
      const seen = await AsyncStorage.getItem('home_tutorial_seen');
      if (!seen) {
        // Icerik yuklenmesini bekle, sonra tutoriali goster
        setTimeout(() => {
          setShowTutorial(true);
          setTutorialStep(0);
          Animated.timing(tutorialFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }, 1200);
      }
    } catch {
      // Hata durumunda tutorial gosterilmez
    }
  };

  // Tutorial adimini ilerlet veya kapat
  const handleTutorialNext = () => {
    if (tutorialStep < 2) {
      setTutorialStep(prev => prev + 1);
    } else {
      // Son adim -- tutoriali kapat ve AsyncStorage'a kaydet
      Animated.timing(tutorialFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setShowTutorial(false);
        AsyncStorage.setItem('home_tutorial_seen', 'true');
      });
    }
  };

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

  // Gunluk icerik yukle -- 3 kelime hazirla (1 ana + 2 bonus)
  const loadDailyContent = async () => {
    try {
      const todaysWord = getWordOfTheDay(targetLanguage, proficiencyLevel);
      // Bonus kelimeler icin ayni seviyedeki diger kelimeleri al
      const allWords = loadContentForLevel(targetLanguage, proficiencyLevel);
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const otherWords = allWords.filter(w => w.id !== todaysWord.id);
      const bonus1 = otherWords[(dayOfYear + 7) % otherWords.length];
      const bonus2 = otherWords[(dayOfYear + 13) % otherWords.length];
      const words = [todaysWord, bonus1, bonus2].filter(Boolean);
      setWordList(words);
      wordListRef.current = words;
      setWordIndex(0);
      wordIndexRef.current = 0;

      // Acilmis kelime sayisini geri yukle
      const savedUnlocked = await AsyncStorage.getItem(getDailySwipeKey());
      const restored = savedUnlocked ? Math.min(parseInt(savedUnlocked, 10), words.length) : 1;
      unlockedCountRef.current = restored;
      setUnlockedCount(restored);

      setWord(todaysWord);
      setShowMeaning(false);
      // Gunun kelimesi yuklendiginde otomatik seslendir
      speakWord(todaysWord.target_word);
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

  // Dil kodundan konusma diline esleme -- tum speech fonksiyonlarinda kullanilir
  const speechLang: Record<string, string> = {
    en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR',
    pt: 'pt-BR', it: 'it-IT', ru: 'ru-RU', ja: 'ja-JP',
    ko: 'ko-KR', zh: 'zh-CN', tr: 'tr-TR',
  };

  // Verilen kelimeyi otomatik seslendir -- yeni kelime geldiginde veya butonla tetiklenir
  const speakWord = (targetWord: string) => {
    Speech.speak(targetWord, {
      language: speechLang[targetLanguage] || 'en-US',
      rate: 0.8,
    });
  };

  // Kelimeyi seslendir (kullanici butona bastiginda)
  const handleSpeak = () => {
    if (!word) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    speakWord(word.target_word);
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
      <LinearGradient colors={['#0D0D1A', '#1A1333', '#120E2E']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' }} />
              <View style={{ width: 50, height: 24, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            </View>
            <View style={styles.cardArea}>
              <SkeletonCard />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const localizedMeaning = getTranslation(word, nativeLanguage);
  const localizedExample = getExampleTranslation(word, nativeLanguage);

  // Kelime karti tab icerik renderla
  const renderMeaningContent = () => {
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
  };

  return (
    <LinearGradient colors={['#0D0D1A', '#1A1333', '#120E2E']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainContent}>
          {/* ── Header: Bayrak + Streak ── */}
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

          {/* Day X -- kartın üstünde belirgin */}
          <Text style={styles.headerDay}>{t('day') || 'Day'} {progress?.streak || 1}</Text>

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

          {/* ── Tinder-Style Kelime Karti + Stack ── */}
          <View style={styles.cardArea}>
            {/* Stack: arka kart izleri -- sadece ince kenar cizgileri */}
            {unlockedCount > 2 && (
              <Animated.View style={[styles.stackLine, styles.stackLine3, { transform: [{ scale: backCard2Scale }] }]} />
            )}
            {unlockedCount > 1 && (
              <Animated.View style={[styles.stackLine, styles.stackLine2, { transform: [{ scale: backCard1Scale }] }]} />
            )}
            {/* On kart -- swipeable */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.card,
                {
                  opacity: cardOpacity,
                  transform: [
                    { translateX: swipeX },
                    { translateY: Animated.multiply(swipeY, 0.4) },
                    { rotate: cardRotate },
                    { scale: cardScale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(124,58,237,0.14)', 'rgba(236,72,153,0.06)', 'rgba(255,255,255,0.02)']}
                style={styles.cardInner}
              >
                {/* Stamp: Saga swipe */}
                <Animated.View style={[styles.stamp, styles.stampRight, { opacity: stampRightOpacity }]}>
                  <Ionicons name="arrow-forward-circle" size={20} color="#34D399" />
                  <Text style={styles.stampTextRight}>NEXT</Text>
                </Animated.View>
                {/* Stamp: Sola swipe */}
                <Animated.View style={[styles.stamp, styles.stampLeft, { opacity: stampLeftOpacity }]}>
                  <Ionicons name="arrow-back-circle" size={20} color="#F87171" />
                  <Text style={styles.stampTextLeft}>BACK</Text>
                </Animated.View>
                {/* Stamp: Yukari swipe -- super like */}
                <Animated.View style={[styles.stamp, styles.stampUp, { opacity: stampUpOpacity }]}>
                  <Ionicons name="star" size={22} color="#FBBF24" />
                </Animated.View>
                {/* Kelime ikonu -- vektor ikon + gradient baloncuk */}
                <View style={styles.emojiBubbleWrapper}>
                  <LinearGradient
                    colors={getCategoryStyle(word.category).colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emojiBubble}
                  >
                    <CategoryIcon category={word.category} />
                  </LinearGradient>
                </View>

                {/* Kelime */}
                <Text style={styles.wordText} accessibilityRole="header" accessibilityLabel={`Word of the day: ${word.target_word}`}>{word.target_word}</Text>

                {/* Telaffuz */}
                {word.pronunciation && (
                  <Text style={styles.pronunciation}>{word.pronunciation}</Text>
                )}

                {/* Aksiyon butonlari */}
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={handleSpeak} style={styles.actionBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Listen to pronunciation">
                    <Text style={styles.actionBtnIcon}>{'\u{1F50A}'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleToggleFavorite} style={styles.actionBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={isFav ? "Remove from favorites" : "Add to favorites"}>
                    <Text style={styles.actionBtnIcon}>{isFav ? '\u2764\uFE0F' : '\u{1F90D}'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShare} style={styles.actionBtn} activeOpacity={0.7} disabled={isSharing} accessibilityRole="button" accessibilityLabel="Share this word">
                    <Text style={styles.actionBtnIcon}>{isSharing ? '\u23F3' : '\u{1F4E4}'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Anlamini Gor butonu */}
                <TouchableOpacity onPress={handleMeaningPress} activeOpacity={0.7} style={styles.meaningToggleBtn}>
                  <LinearGradient
                    colors={showMeaning ? ['rgba(110,231,183,0.15)', 'rgba(52,211,153,0.1)'] : ['rgba(167,139,250,0.15)', 'rgba(99,102,241,0.1)']}
                    style={styles.meaningToggleBtnInner}
                  >
                    <Text style={styles.meaningToggle}>
                      {showMeaning ? `\u25BE ${t('hideMeaning')}` : `\u25B8 ${t('showMeaning')}`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Anlam acildiginda */}
                {showMeaning && (
                  <View style={styles.wordCardTabs}>
                    {renderMeaningContent()}
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Super Like animasyonu */}
          {showSuperLike && (
            <Animated.View style={[styles.superLikeOverlay, { opacity: superLikeOpacity, transform: [{ scale: superLikeScale }] }]} pointerEvents="none">
              <Ionicons name="star" size={80} color="#FBBF24" />
              <Text style={styles.superLikeText}>FAVORITE</Text>
            </Animated.View>
          )}

          {/* Dot indicator + swipe ipucu */}
          <View style={styles.swipeHint}>
            <View style={styles.swipeHintDots}>
              {wordList.slice(0, unlockedCount).map((_, i) => (
                <View key={i} style={[styles.swipeDot, i === wordIndex && styles.swipeDotActive]} />
              ))}
              {unlockedCount < MAX_WORDS && (
                <View style={[styles.swipeDot, styles.swipeDotLocked]} />
              )}
            </View>
          </View>

          {/* [GUESS_GAME] Gunun Tahmini kucuk butonu -- footer tab bar'a tasindi, artik burada gosterilmiyor */}
          {/* Geri donulebilirlik icin kod korunuyor:
          {onNavigateToGuessGame && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNavigateToGuessGame();
              }}
              style={styles.guessGameMiniBtn}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('guessPlayButton' as any)}
            >
              <Text style={styles.guessGameMiniBtnIcon}>{'\u{1F3AF}'}</Text>
              <Text style={styles.guessGameMiniBtnText}>{t('guessPlayButton' as any)}</Text>
            </TouchableOpacity>
          )}
          */}
        </View>
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

      {/* Alt Navigasyon Cubugu -- 5 tab: Home | Quests | Tahmin | History | Profile */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => {}} accessibilityRole="tab" accessibilityLabel="Home" accessibilityState={{ selected: true }}>
          <Ionicons name="home" size={22} color="#C4B5FD" />
          <Text style={styles.tabLabelActive}>{t('tabHome')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToQuests(); }} accessibilityRole="tab" accessibilityLabel="Quests" accessibilityState={{ selected: false }} accessibilityHint="Opens quests and daily tasks">
          <Ionicons name="trophy-outline" size={22} color="rgba(255,255,255,0.4)" />
          <Text style={styles.tabLabel}>{t('tabQuests')}</Text>
        </TouchableOpacity>
        {/* [GUESS_GAME] Gunun Tahmini tab'i -- footer'a tasinmis versiyon */}
        {onNavigateToGuessGame && (
          <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNavigateToGuessGame(); }} accessibilityRole="tab" accessibilityLabel="Guess" accessibilityState={{ selected: false }} accessibilityHint="Opens daily guess game">
            <MaterialCommunityIcons name="bullseye-arrow" size={22} color="rgba(255,255,255,0.4)" />
            <Text style={styles.tabLabel}>{t('guessTabLabel' as any)}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToHistory(); }} accessibilityRole="tab" accessibilityLabel="History" accessibilityState={{ selected: false }} accessibilityHint="Opens word history">
          <Ionicons name="time-outline" size={22} color="rgba(255,255,255,0.4)" />
          <Text style={styles.tabLabel}>{t('tabHistory')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNavigateToProfile(); }} accessibilityRole="tab" accessibilityLabel="Profile" accessibilityState={{ selected: false }} accessibilityHint="Opens profile and settings">
          <Ionicons name="person-outline" size={22} color="rgba(255,255,255,0.4)" />
          <Text style={styles.tabLabel}>{t('tabProfile')}</Text>
        </TouchableOpacity>
      </View>

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

      {/* Ilk Kullanim Tutorial Overlay -- 3 adimli kilavuz */}
      {showTutorial && (
        <Animated.View style={[styles.tutorialOverlay, { opacity: tutorialFade }]}>
          <View style={styles.tutorialContent}>
            {/* Adim gostergesi */}
            <View style={styles.tutorialStepIndicator}>
              {[0, 1, 2].map(i => (
                <View
                  key={i}
                  style={[
                    styles.tutorialStepDot,
                    i === tutorialStep && styles.tutorialStepDotActive,
                    i < tutorialStep && styles.tutorialStepDotDone,
                  ]}
                />
              ))}
            </View>

            {/* Adim 1: Saga/sola kaydirma */}
            {tutorialStep === 0 && (
              <View style={styles.tutorialStepContent}>
                <View style={styles.tutorialIconRow}>
                  <Ionicons name="arrow-back" size={28} color="#F87171" />
                  <View style={styles.tutorialCardIcon}>
                    <Ionicons name="card-outline" size={36} color="#C4B5FD" />
                  </View>
                  <Ionicons name="arrow-forward" size={28} color="#34D399" />
                </View>
                <Text style={styles.tutorialTitle}>Karti saga veya sola kaydir</Text>
                <Text style={styles.tutorialDesc}>Yeni kelime kesfet veya onceki kelimelere geri don</Text>
              </View>
            )}

            {/* Adim 2: Yukari kaydirma */}
            {tutorialStep === 1 && (
              <View style={styles.tutorialStepContent}>
                <View style={styles.tutorialIconRow}>
                  <Ionicons name="arrow-up" size={36} color="#FBBF24" />
                </View>
                <Text style={styles.tutorialTitle}>Yukari kaydir</Text>
                <Text style={styles.tutorialDesc}>Kelimeyi favorilerine ekle</Text>
              </View>
            )}

            {/* Adim 3: Dokunma */}
            {tutorialStep === 2 && (
              <View style={styles.tutorialStepContent}>
                <View style={styles.tutorialIconRow}>
                  <Ionicons name="hand-left-outline" size={36} color="#A78BFA" />
                </View>
                <Text style={styles.tutorialTitle}>Anlamini gormek icin dokun</Text>
                <Text style={styles.tutorialDesc}>"Anlamini Gor" butonuna bas ve kelimenin anlamini, ornegini kesfet</Text>
              </View>
            )}

            {/* Sonraki / Basla butonu */}
            <TouchableOpacity onPress={handleTutorialNext} style={styles.tutorialButton} activeOpacity={0.8}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={styles.tutorialButtonInner}
              >
                <Text style={styles.tutorialButtonText}>
                  {tutorialStep < 2 ? 'Sonraki' : 'Basla!'}
                </Text>
                {tutorialStep < 2 && (
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  mainContent: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  // ── Minimal Header: Bayrak + Streak ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 56,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerFlag: {
    padding: 4,
  },
  headerFlagText: {
    fontSize: 32,
  },
  headerDay: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
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
    color: '#FCD34D',
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

  // ── Tinder-Style Kelime Karti + Stack ──
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: width - 32,
    borderRadius: 28,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
  },
  stackLine: {
    position: 'absolute',
    width: width - 52,
    height: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.12)',
  },
  stackLine2: {
    top: 8,
    opacity: 0.5,
  },
  stackLine3: {
    top: 16,
    opacity: 0.25,
  },
  // Stamp overlays
  stamp: {
    position: 'absolute',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2.5,
  },
  stampRight: {
    top: 20,
    left: 16,
    borderColor: '#34D399',
    transform: [{ rotate: '-15deg' }],
  },
  stampLeft: {
    top: 20,
    right: 16,
    borderColor: '#F87171',
    transform: [{ rotate: '15deg' }],
  },
  stampUp: {
    top: 20,
    alignSelf: 'center',
    left: '38%' as any,
    borderColor: '#FBBF24',
    transform: [{ rotate: '-5deg' }],
  },
  stampTextRight: {
    fontSize: 15,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: 1,
  },
  stampTextLeft: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F87171',
    letterSpacing: 1,
  },
  stampTextUp: {
    fontSize: 18,
  },
  // Super Like overlay
  superLikeOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    top: '35%' as any,
    zIndex: 100,
    alignItems: 'center',
  },
  superLikeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 2,
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardInner: {
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(196,181,253,0.18)',
    minHeight: 420,
    justifyContent: 'center',
  },
  emojiBubbleWrapper: {
    marginBottom: 20,
  },
  emojiBubble: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  wordText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 6,
    textShadowColor: 'rgba(139,92,246,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  pronunciation: {
    fontSize: 14,
    color: 'rgba(167,139,250,0.6)',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 20,
    marginTop: 10,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnIcon: { fontSize: 22 },

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
  tabContentArea: {
    width: '100%',
  },
  meaningText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34D399',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
    textShadowColor: 'rgba(52,211,153,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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

  // ── Swipe Ipucu ──
  swipeHint: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 4,
  },
  swipeHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 0.5,
  },
  swipeHintDots: {
    flexDirection: 'row',
    gap: 8,
  },
  swipeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  swipeDotActive: {
    backgroundColor: '#C4B5FD',
    shadowColor: '#C4B5FD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  swipeDotLocked: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
  },

  // [GUESS_GAME] Gunun Tahmini mini butonu
  guessGameMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(99,102,241,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    gap: 6,
  },
  guessGameMiniBtnIcon: { fontSize: 16 },
  guessGameMiniBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A78BFA',
  },

  // ── Gizli Paylasim Karti ──
  shareCardHidden: {
    position: 'absolute',
    top: -9999,
    left: -9999,
  },

  // ── Alt Navigasyon Cubugu (5 tab: Home | Quests | Tahmin | History | Profile) ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10,14,39,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139,92,246,0.12)',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  tabLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
    marginTop: 4,
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

  // ── Tutorial Overlay Stilleri ──
  tutorialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  tutorialContent: {
    width: width - 64,
    backgroundColor: 'rgba(26,17,69,0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  tutorialStepIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tutorialStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tutorialStepDotActive: {
    backgroundColor: '#C4B5FD',
    width: 24,
    shadowColor: '#C4B5FD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  tutorialStepDotDone: {
    backgroundColor: '#34D399',
  },
  tutorialStepContent: {
    alignItems: 'center',
    marginBottom: 28,
  },
  tutorialIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  tutorialCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  tutorialDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  tutorialButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  tutorialButtonInner: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tutorialButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
