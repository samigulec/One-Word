// App.tsx -- v2.0.0 Ana navigasyon (UX yeniden tasarimi)
// Yeni tab yapisi: Home | Quests | History | Profile

import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, ActivityIndicator, StyleSheet } from 'react-native';
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

// Tipler ve utility'ler
import { ContentItem, ProficiencyLevel, UserProgress, Badge } from './src/types';
import { LanguageCode } from './src/utils/translations';
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
import { checkStreakBadges, checkWordBadges, checkSpecialBadges, createEarnedBadge } from './src/utils/badges';

LogBox.ignoreLogs(['Non-serializable values']);

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
  | 'Leaderboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Loading');
  const [selectedWord, setSelectedWord] = useState<ContentItem | null>(null);
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
  const navigateToChat = async (word: ContentItem) => {
    await addLearnedWord(word);
    setSelectedWord(word);
    setCurrentScreen('Chat');
    await checkAndAwardBadges();
  };

  const navigateToHome = () => {
    setCurrentScreen('Home');
    setSelectedWord(null);
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

  const handleReset = () => {
    setUserProgress(null);
    setSelectedWord(null);
    setNativeLanguage('en');
    setTargetLanguage('es');
    setProficiencyLevel('A1');
    setCurrentScreen('Onboarding');
  };

  // Loading screen
  if (currentScreen === 'Loading') {
    return (
      <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#8B5CF6" />
      </LinearGradient>
    );
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
        <WeeklySummaryScreen onClose={navigateToHome} targetLanguage={targetLanguage} />
      )}
      {currentScreen === 'Leaderboard' && (
        <LeaderboardScreen onClose={navigateToHome} />
      )}
      {currentScreen === 'Chat' && selectedWord && (
        <ChatScreen
          word={selectedWord}
          onNavigateBack={navigateToHome}
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Sentry ile App bileseni sarmalanarak export ediliyor
export default Sentry.wrap(App);
