import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import JourneyScreen from './src/screens/JourneyScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import QuizScreen from './src/screens/QuizScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import WeeklySummaryScreen from './src/screens/WeeklySummaryScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import BadgeUnlockedModal from './src/components/BadgeUnlockedModal';
import { ContentItem, ProficiencyLevel, UserProgress, Badge } from './src/types';
import { LanguageCode } from './src/utils/translations';
import { getLanguagePreferences, saveLanguagePreferences, getUserProgress, addLearnedWord, getNotificationSettings, getEarnedBadges, addEarnedBadge, getCalmMode } from './src/utils/storage';
import { requestNotificationPermission, scheduleAllNotifications } from './src/utils/notifications';
import { checkStreakBadges, checkWordBadges, checkSpecialBadges, createEarnedBadge } from './src/utils/badges';

LogBox.ignoreLogs(['Non-serializable values']);

type Screen = 'Loading' | 'Onboarding' | 'Home' | 'Chat' | 'Journey' | 'Settings' | 'History' | 'Review' | 'Quiz' | 'Badges' | 'WeeklySummary' | 'Leaderboard';

export default function App() {
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

    // Streak rozetleri
    const newStreakBadges = checkStreakBadges(progress.streak, earned);
    pendingBadges.push(...newStreakBadges);

    // Kelime rozetleri
    const totalWords = (progress.learnedWords || []).length;
    const newWordBadges = checkWordBadges(totalWords, earned);
    pendingBadges.push(...newWordBadges);

    // Ozel rozetler (saat bazli)
    const currentHour = new Date().getHours();
    const hasFavorite = (progress.favorites || []).length > 0;
    const newSpecialBadges = checkSpecialBadges({ hasFavorite, currentHour }, earned);
    pendingBadges.push(...newSpecialBadges);

    // Yeni rozetleri kaydet ve goster
    if (pendingBadges.length > 0) {
      for (const badge of pendingBadges) {
        await addEarnedBadge(createEarnedBadge(badge.id));
      }
      // Ilk yeni rozeti modal olarak goster
      setUnlockedBadge(pendingBadges[0]);
      setShowBadgeModal(true);
    }
  }, []);

  const navigateToChat = async (word: ContentItem) => {
    // Save word as learned when user starts practicing
    await addLearnedWord(word);
    setSelectedWord(word);
    setCurrentScreen('Chat');

    // Kelime ogrenildikten sonra rozet kontrolu
    await checkAndAwardBadges();
  };

  const navigateToHome = () => {
    setCurrentScreen('Home');
    setSelectedWord(null);
    loadUserProgress();
    // Her ana sayfaya donuste rozet kontrolu
    checkAndAwardBadges();
  };

  const navigateToBadges = () => {
    setCurrentScreen('Badges');
  };

  const navigateToWeeklySummary = () => {
    setCurrentScreen('WeeklySummary');
  };

  const navigateToJourney = () => {
    loadUserProgress();
    setCurrentScreen('Journey');
  };

  const navigateToSettings = () => {
    setCurrentScreen('Settings');
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
          onNavigateToJourney={navigateToJourney}
          onNavigateToSettings={navigateToSettings}
          onNavigateToHistory={navigateToHistory}
          onNavigateToReview={navigateToReview}
          onNavigateToQuiz={navigateToQuiz}
          onNavigateToBadges={navigateToBadges}
          onNavigateToWeeklySummary={navigateToWeeklySummary}
          onNavigateToLeaderboard={navigateToLeaderboard}
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          proficiencyLevel={proficiencyLevel}
          calmMode={calmMode}
        />
      )}
      {currentScreen === 'Journey' && (
        <JourneyScreen
          currentStreak={userProgress?.streak || 0}
          totalWordsLearned={userProgress?.totalIdiomsLearned || 0}
          nativeLanguage={nativeLanguage}
          onClose={navigateToHome}
          onNavigateToWeeklySummary={navigateToWeeklySummary}
        />
      )}
      {currentScreen === 'Settings' && (
        <SettingsScreen
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          proficiencyLevel={proficiencyLevel}
          onClose={navigateToHome}
          onReset={handleReset}
          calmMode={calmMode}
          onCalmModeChange={setCalmModeState}
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
      {currentScreen === 'Badges' && (
        <BadgesScreen onClose={navigateToHome} />
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
