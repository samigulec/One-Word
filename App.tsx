// App.tsx -- v2.0.0 Ana navigasyon (UX yeniden tasarimi)
// Yeni tab yapisi: Home | Quests | History | Profile

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, ActivityIndicator, StyleSheet, Animated, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sentry from '@sentry/react-native';

// Sentry baslatma -- hata izleme ve performans takibi
Sentry.init({
  dsn: 'https://placeholder@sentry.io/0', // KULLANICI: Kendi DSN degerinizi buraya yazin
  tracesSampleRate: 1.0,
  debug: __DEV__, // Sadece gelistirme modunda debug acik
  enabled: !__DEV__, // Sadece production'da aktif
});

// Ekranlar
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import QuestsScreen from './src/screens/QuestsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import QuizScreen from './src/screens/QuizScreen';
import WeeklySummaryScreen from './src/screens/WeeklySummaryScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import BadgeUnlockedModal from './src/components/BadgeUnlockedModal';
// [GUESS_GAME] Gunun Tahmini mini oyunu
import DailyGuessGame from './src/components/DailyGuessGame';

// Tipler ve utility'ler
import { ContentItem, ProficiencyLevel, UserProgress, Badge } from './src/types';
import { LanguageCode, getTranslation as getUITranslation } from './src/utils/translations';
import {
  getLanguagePreferences,
  saveLanguagePreferences,
  getUserProgress,
  addLearnedWord,
  getNotificationSettings,
  getEarnedBadges,
  addEarnedBadge,
  getCalmMode,
} from './src/utils/storage';
import { requestNotificationPermission, scheduleAllNotifications } from './src/utils/notifications';
// [GUESS_GAME] Gunun kelimesini almak icin
import { getWordOfTheDay } from './src/utils/contentLoader';
import { checkStreakBadges, checkWordBadges, checkSpecialBadges, createEarnedBadge } from './src/utils/badges';

LogBox.ignoreLogs(['Non-serializable values']);

// Splash Screen -- fade-in animasyonlu giris ekrani
const SplashScreen: React.FC = () => {
  // Fade-in animasyon degerleri
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const fadeSlogan = useRef(new Animated.Value(0)).current;
  const fadeSpinner = useRef(new Animated.Value(0)).current;
  const scaleTitle = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Sirali fade-in: baslik → slogan → spinner
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeTitle, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleTitle, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]),
      Animated.timing(fadeSlogan, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeSpinner, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={splashStyles.container}>
      <StatusBar style="light" />
      <View style={splashStyles.content}>
        <Animated.Text
          style={[
            splashStyles.title,
            { opacity: fadeTitle, transform: [{ scale: scaleTitle }] },
          ]}
        >
          One Word
        </Animated.Text>
        <Animated.Text style={[splashStyles.slogan, { opacity: fadeSlogan }]}>
          {getUITranslation('slogan', 'en')}
        </Animated.Text>
        <Animated.View style={{ opacity: fadeSpinner, marginTop: 32 }}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(139,92,246,0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
    marginBottom: 12,
  },
  slogan: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(196,181,253,0.7)',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

// Tum ekran tipleri -- v2.0.0 guncellendi
type Screen =
  | 'Loading'
  | 'Onboarding'
  | 'Home'
  | 'Chat'
  | 'Quests'
  | 'Profile'
  | 'Practice'
  | 'History'
  | 'Review'
  | 'Quiz'
  | 'WeeklySummary'
  | 'Leaderboard'
  | 'GuessGame'; // [GUESS_GAME]

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Loading');
  const [selectedWord, setSelectedWord] = useState<ContentItem | null>(null);
  // Secilen senaryo ID'si (cafe, travel, shopping, vb.)
  const [selectedScenario, setSelectedScenario] = useState<string | undefined>(undefined);
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode>('en');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('es');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>('A1');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  // Calm mode state
  const [calmMode, setCalmModeState] = useState(false);

  // Rozet sistemi state
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  useEffect(() => {
    checkLanguagePreferences();
    loadUserProgress();
    getCalmMode().then(setCalmModeState);
  }, []);

  const loadUserProgress = async () => {
    const progress = await getUserProgress();
    setUserProgress(progress);
  };

  const checkLanguagePreferences = async () => {
    const savedPreferences = await getLanguagePreferences();
    if (savedPreferences && savedPreferences.proficiencyLevel) {
      setNativeLanguage(savedPreferences.nativeLanguage as LanguageCode);
      setTargetLanguage(savedPreferences.targetLanguage as LanguageCode);
      setProficiencyLevel(savedPreferences.proficiencyLevel as ProficiencyLevel);
      setCurrentScreen('Home');

      // Bildirim ayarlarini yukle ve zamanla
      initializeNotifications();
    } else {
      setCurrentScreen('Onboarding');
    }
  };

  // Bildirimleri baslat
  const initializeNotifications = async () => {
    const notifSettings = await getNotificationSettings();
    if (notifSettings.enabled) {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        await scheduleAllNotifications(notifSettings);
      }
    }
  };

  const handleOnboardingComplete = async (native: LanguageCode, target: LanguageCode, level: ProficiencyLevel, userName?: string) => {
    await saveLanguagePreferences({
      nativeLanguage: native,
      targetLanguage: target,
      proficiencyLevel: level,
      userName: userName || '',
    });
    setNativeLanguage(native);
    setTargetLanguage(target);
    setProficiencyLevel(level);
    setCurrentScreen('Home');
  };

  // Rozet kontrolu -- streak, kelime sayisi, ozel rozetler
  const checkAndAwardBadges = useCallback(async () => {
    const progress = await getUserProgress();
    const earned = await getEarnedBadges();
    const pendingBadges: Badge[] = [];

    const newStreakBadges = checkStreakBadges(progress.streak, earned);
    pendingBadges.push(...newStreakBadges);

    const totalWords = (progress.learnedWords || []).length;
    const newWordBadges = checkWordBadges(totalWords, earned);
    pendingBadges.push(...newWordBadges);

    const currentHour = new Date().getHours();
    const hasFavorite = (progress.favorites || []).length > 0;
    const newSpecialBadges = checkSpecialBadges({ hasFavorite, currentHour }, earned);
    pendingBadges.push(...newSpecialBadges);

    if (pendingBadges.length > 0) {
      for (const badge of pendingBadges) {
        await addEarnedBadge(createEarnedBadge(badge.id));
      }
      setUnlockedBadge(pendingBadges[0]);
      setShowBadgeModal(true);
    }
  }, []);

  // Navigasyon fonksiyonlari
  // Senaryo secimi ile chat ekranina gecis
  const navigateToChat = async (word: ContentItem, scenarioId?: string) => {
    await addLearnedWord(word);
    setSelectedWord(word);
    setSelectedScenario(scenarioId);
    setCurrentScreen('Chat');
    await checkAndAwardBadges();
  };

  const navigateToHome = () => {
    setCurrentScreen('Home');
    setSelectedWord(null);
    setSelectedScenario(undefined);
    loadUserProgress();
    checkAndAwardBadges();
  };

  const navigateToQuests = () => {
    setCurrentScreen('Quests');
  };

  const navigateToProfile = () => {
    setCurrentScreen('Profile');
  };

  const navigateToPractice = (word?: ContentItem) => {
    if (word) setSelectedWord(word);
    setCurrentScreen('Practice');
  };

  const navigateToWeeklySummary = () => {
    setCurrentScreen('WeeklySummary');
  };

  const navigateToHistory = () => {
    setCurrentScreen('History');
  };

  const navigateToReview = () => {
    setCurrentScreen('Review');
  };

  const navigateToQuiz = () => {
    setCurrentScreen('Quiz');
  };

  const navigateToLeaderboard = () => {
    setCurrentScreen('Leaderboard');
  };

  // [GUESS_GAME] Gunun Tahmini ekranina git
  const navigateToGuessGame = () => {
    setCurrentScreen('GuessGame');
  };

  const handleReset = () => {
    setUserProgress(null);
    setSelectedWord(null);
    setNativeLanguage('en');
    setTargetLanguage('es');
    setProficiencyLevel('A1');
    setCurrentScreen('Onboarding');
  };

  // Splash Screen -- fade-in animasyonu ile One Word markasi
  if (currentScreen === 'Loading') {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar style="light" />
      {currentScreen === 'Onboarding' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}
      {currentScreen === 'Home' && (
        <HomeScreen
          onNavigateToChat={navigateToChat}
          onNavigateToQuests={navigateToQuests}
          onNavigateToHistory={navigateToHistory}
          onNavigateToProfile={navigateToProfile}
          onNavigateToReview={navigateToReview}
          onNavigateToQuiz={navigateToQuiz}
          onNavigateToPractice={(w?: ContentItem) => navigateToPractice(w)}
          onNavigateToLeaderboard={navigateToLeaderboard}
          onNavigateToGuessGame={navigateToGuessGame}
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          proficiencyLevel={proficiencyLevel}
          calmMode={calmMode}
        />
      )}
      {currentScreen === 'Quests' && (
        <QuestsScreen
          nativeLanguage={nativeLanguage}
          onClose={navigateToHome}
          onNavigateToWeeklySummary={navigateToWeeklySummary}
          onOpenGuessGame={navigateToGuessGame}
        />
      )}
      {currentScreen === 'Profile' && (
        <ProfileScreen
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          proficiencyLevel={proficiencyLevel}
          onClose={navigateToHome}
          onReset={handleReset}
          calmMode={calmMode}
          onCalmModeChange={setCalmModeState}
        />
      )}
      {currentScreen === 'Practice' && (
        <PracticeScreen
          word={selectedWord}
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          onSelectScenario={navigateToChat}
          onClose={navigateToHome}
        />
      )}
      {currentScreen === 'History' && (
        <HistoryScreen
          nativeLanguage={nativeLanguage}
          onClose={navigateToHome}
        />
      )}
      {currentScreen === 'Review' && (
        <ReviewScreen
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          onClose={navigateToHome}
        />
      )}
      {currentScreen === 'Quiz' && (
        <QuizScreen
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          onClose={navigateToHome}
        />
      )}
      {currentScreen === 'WeeklySummary' && (
        <WeeklySummaryScreen onClose={navigateToHome} targetLanguage={targetLanguage} nativeLanguage={nativeLanguage} />
      )}
      {currentScreen === 'Leaderboard' && (
        <LeaderboardScreen onClose={navigateToHome} nativeLanguage={nativeLanguage} />
      )}
      {/* [GUESS_GAME] Gunun Tahmini ekrani */}
      {currentScreen === 'GuessGame' && (
        <DailyGuessGame
          word={getWordOfTheDay(targetLanguage, proficiencyLevel)}
          nativeLanguage={nativeLanguage}
          onClose={navigateToHome}
        />
      )}
      {currentScreen === 'Chat' && selectedWord && (
        <ChatScreen
          word={selectedWord}
          onNavigateBack={navigateToHome}
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          scenario={selectedScenario}
        />
      )}

      {/* Rozet kazanildi modal */}
      <BadgeUnlockedModal
        badge={unlockedBadge}
        visible={showBadgeModal}
        onClose={() => {
          setShowBadgeModal(false);
          setUnlockedBadge(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({});

// Sentry ile App bileseni sarmalanarak export ediliyor
export default Sentry.wrap(App);
