import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import JourneyScreen from './src/screens/JourneyScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { ContentItem, ProficiencyLevel, UserProgress } from './src/types';
import { LanguageCode } from './src/utils/translations';
import { getLanguagePreferences, saveLanguagePreferences, getUserProgress, addLearnedWord } from './src/utils/storage';

LogBox.ignoreLogs(['Non-serializable values']);

type Screen = 'Loading' | 'Onboarding' | 'Home' | 'Chat' | 'Journey' | 'Settings' | 'History';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Loading');
  const [selectedWord, setSelectedWord] = useState<ContentItem | null>(null);
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode>('en');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('es');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>('A1');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    checkLanguagePreferences();
    loadUserProgress();
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
    } else {
      setCurrentScreen('Onboarding');
    }
  };

  const handleOnboardingComplete = async (native: LanguageCode, target: LanguageCode, level: ProficiencyLevel) => {
    await saveLanguagePreferences({
      nativeLanguage: native,
      targetLanguage: target,
      proficiencyLevel: level,
    });
    setNativeLanguage(native);
    setTargetLanguage(target);
    setProficiencyLevel(level);
    setCurrentScreen('Home');
  };

  const navigateToChat = async (word: ContentItem) => {
    // Save word as learned when user starts practicing
    await addLearnedWord(word);
    setSelectedWord(word);
    setCurrentScreen('Chat');
  };

  const navigateToHome = () => {
    setCurrentScreen('Home');
    setSelectedWord(null);
    loadUserProgress();
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

  const handleReset = () => {
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
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          proficiencyLevel={proficiencyLevel}
        />
      )}
      {currentScreen === 'Journey' && (
        <JourneyScreen
          currentStreak={userProgress?.streak || 0}
          totalWordsLearned={userProgress?.totalIdiomsLearned || 0}
          nativeLanguage={nativeLanguage}
          onClose={navigateToHome}
        />
      )}
      {currentScreen === 'Settings' && (
        <SettingsScreen
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          proficiencyLevel={proficiencyLevel}
          onClose={navigateToHome}
          onReset={handleReset}
        />
      )}
      {currentScreen === 'History' && (
        <HistoryScreen
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
        />
      )}
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
