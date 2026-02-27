import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, Language, LanguageCode } from '../utils/translations';
import { ProficiencyLevel } from '../types';

const { width } = Dimensions.get('window');

type OnboardingScreenProps = {
  onComplete: (nativeLanguage: LanguageCode, targetLanguage: LanguageCode, level: ProficiencyLevel) => void;
};

interface SimplifiedLevel {
  id: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  subtitle: string;
  description: string;
  cerfLevel: ProficiencyLevel;
  color: string;
  bgColor: string;
}

const SIMPLIFIED_LEVELS: SimplifiedLevel[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    subtitle: 'Just starting out',
    description: 'Basic words like "Hello", "Thank you"',
    cerfLevel: 'A1',
    color: '#10B981',
    bgColor: '#F0FDF4'
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    subtitle: 'I know the basics',
    description: 'Everyday conversations',
    cerfLevel: 'B1',
    color: '#F59E0B',
    bgColor: '#FFFBEB'
  },
  {
    id: 'advanced',
    title: 'Advanced',
    subtitle: 'I\'m quite confident',
    description: 'Complex topics & expressions',
    cerfLevel: 'C1',
    color: '#8B5CF6',
    bgColor: '#F5F3FF'
  },
];

const LanguageItem: React.FC<{
  item: Language;
  isSelected: boolean;
  onSelect: (lang: Language) => void;
}> = ({ item, isSelected, onSelect }) => {
  const itemScale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(itemScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(itemScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onSelect(item);
  };

  return (
    <Animated.View style={{ transform: [{ scale: itemScale }] }}>
      <TouchableOpacity
        style={[
          styles.languageItem,
          isSelected && styles.languageItemSelected,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.flagEmoji}>{item.flag}</Text>
        <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
          {item.nativeName}
        </Text>
        {isSelected && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkMark}>{'\u2713'}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const LevelCard: React.FC<{
  item: SimplifiedLevel;
  isSelected: boolean;
  onSelect: (level: SimplifiedLevel) => void;
}> = ({ item, isSelected, onSelect }) => {
  const cardScale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(cardScale, { toValue: 0.97, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onSelect(item);
  };

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <TouchableOpacity
        style={[
          styles.levelCard,
          { backgroundColor: isSelected ? item.bgColor : '#FFFFFF', borderColor: isSelected ? item.color : '#E2E8F0' },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.levelCardContent}>
          <View style={[styles.levelDot, { backgroundColor: item.color }]} />
          <View style={styles.levelTextContent}>
            <Text style={[styles.levelTitle, { color: isSelected ? item.color : '#1E293B' }]}>
              {item.title}
            </Text>
            <Text style={[styles.levelSubtitle, { color: isSelected ? item.color : '#64748B' }]}>
              {item.subtitle}
            </Text>
            <Text style={styles.levelDescription}>{item.description}</Text>
          </View>
          {isSelected && (
            <View style={[styles.levelCheckBadge, { backgroundColor: item.color }]}>
              <Text style={styles.levelCheckMark}>{'\u2713'}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SimplifiedLevel | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleLanguageSelect = (lang: Language) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step === 1) {
      setNativeLanguage(lang.code);
    } else if (step === 2) {
      if (lang.code === nativeLanguage) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setTargetLanguage(lang.code);
    }
  };

  const handleLevelSelect = (level: SimplifiedLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLevel(level);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (step === 1 && nativeLanguage) {
      animateTransition(() => setStep(2));
    } else if (step === 2 && targetLanguage) {
      animateTransition(() => setStep(3));
    } else if (step === 3 && selectedLevel && nativeLanguage && targetLanguage) {
      onComplete(nativeLanguage, targetLanguage, selectedLevel.cerfLevel);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 2) {
      animateTransition(() => {
        setStep(1);
        setTargetLanguage(null);
      });
    } else if (step === 3) {
      animateTransition(() => {
        setStep(2);
        setSelectedLevel(null);
      });
    }
  };

  const canContinue =
    (step === 1 && nativeLanguage) ||
    (step === 2 && targetLanguage) ||
    (step === 3 && selectedLevel);

  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: 'Welcome',
          subtitle: 'What language do you speak?',
        };
      case 2:
        return {
          title: 'Great choice',
          subtitle: 'What do you want to learn?',
        };
      case 3:
        return {
          title: 'Almost done',
          subtitle: 'What\'s your current level?',
        };
    }
  };

  const content = getStepContent();
  const availableLanguages = step === 2
    ? LANGUAGES.filter(lang => lang.code !== nativeLanguage)
    : LANGUAGES;

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <LanguageItem
      item={item}
      isSelected={(step === 1 ? nativeLanguage : targetLanguage) === item.code}
      onSelect={handleLanguageSelect}
    />
  );

  return (
    <LinearGradient colors={['#4F46E5', '#6366F1', '#818CF8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{step}/3</Text>
        </View>

        {/* Back Button */}
        {step > 1 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
        )}

        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={styles.headerTitle}>{content.title}</Text>
          <Text style={styles.headerSubtitle}>{content.subtitle}</Text>
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {step < 3 ? (
            <FlatList
              key={`language-list-step-${step}`}
              data={availableLanguages}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              numColumns={2}
              contentContainerStyle={styles.languageGrid}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.columnWrapper}
            />
          ) : (
            <View style={styles.levelContainer}>
              {SIMPLIFIED_LEVELS.map((level) => (
                <LevelCard
                  key={level.id}
                  item={level}
                  isSelected={selectedLevel?.id === level.id}
                  onSelect={handleLevelSelect}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Continue Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !canContinue && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueButtonText, !canContinue && styles.continueButtonTextDisabled]}>
              {step === 3 ? "Let's Start" : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },

  // Back Button
  backButton: {
    position: 'absolute',
    left: 20,
    top: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
  },

  // Content
  contentContainer: {
    flex: 1,
  },
  languageGrid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Language Item
  languageItem: {
    width: (width - 48) / 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
  },
  flagEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  languageNameSelected: {
    color: '#059669',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Level Cards
  levelContainer: {
    paddingHorizontal: 20,
  },
  levelCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
  },
  levelCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  levelTextContent: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  levelSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  levelDescription: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  levelCheckBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelCheckMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Bottom / Continue
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 16,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4F46E5',
  },
  continueButtonTextDisabled: {
    color: 'rgba(255,255,255,0.6)',
  },
});

export default OnboardingScreen;
