import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Easing,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, Language, LanguageCode, getTranslation } from '../utils/translations';
import { ProficiencyLevel } from '../types';

const { width, height } = Dimensions.get('window');

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
  emoji: string;
}

const SIMPLIFIED_LEVELS: SimplifiedLevel[] = [
  {
    id: 'beginner',
    title: '',
    subtitle: '',
    description: '',
    cerfLevel: 'A1',
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.15)',
    emoji: '\u{1F331}',
  },
  {
    id: 'intermediate',
    title: '',
    subtitle: '',
    description: '',
    cerfLevel: 'B1',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.15)',
    emoji: '\u{1F525}',
  },
  {
    id: 'advanced',
    title: '',
    subtitle: '',
    description: '',
    cerfLevel: 'C1',
    color: '#8B5CF6',
    bgColor: 'rgba(139,92,246,0.15)',
    emoji: '\u{1F680}',
  },
];

// Floating orb for background
const FloatingOrb: React.FC<{ delay: number; size: number; x: number; y: number; color: string }> = ({ delay, size, x, y, color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 1000,
      delay,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.15,
        transform: [
          { scale: Animated.multiply(scale, anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] })) },
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] }) },
        ],
      }}
    />
  );
};

const LanguageItem: React.FC<{
  item: Language;
  isSelected: boolean;
  onSelect: (lang: Language) => void;
}> = ({ item, isSelected, onSelect }) => {
  const itemScale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(itemScale, { toValue: 0.92, useNativeDriver: true }),
      Animated.spring(itemScale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
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
      Animated.spring(cardScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
    ]).start();
    onSelect(item);
  };

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <TouchableOpacity
        style={[
          styles.levelCard,
          {
            backgroundColor: isSelected ? item.bgColor : 'rgba(255,255,255,0.06)',
            borderColor: isSelected ? item.color : 'rgba(255,255,255,0.1)',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.levelCardContent}>
          <View style={[styles.levelEmoji, { backgroundColor: isSelected ? `${item.color}30` : 'rgba(255,255,255,0.08)' }]}>
            <Text style={styles.levelEmojiText}>{item.emoji}</Text>
          </View>
          <View style={styles.levelTextContent}>
            <Text style={[styles.levelTitle, { color: isSelected ? item.color : 'rgba(255,255,255,0.9)' }]}>
              {item.title}
            </Text>
            <Text style={[styles.levelSubtitle, { color: isSelected ? item.color : 'rgba(255,255,255,0.5)' }]}>
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
  const continueScale = useRef(new Animated.Value(1)).current;

  const orbs = useMemo(() => [
    { delay: 0, size: 120, x: -30, y: height * 0.15, color: '#8B5CF6' },
    { delay: 300, size: 80, x: width - 60, y: height * 0.3, color: '#6366F1' },
    { delay: 600, size: 100, x: width * 0.3, y: height * 0.7, color: '#A78BFA' },
    { delay: 900, size: 60, x: width * 0.7, y: height * 0.55, color: '#818CF8' },
    { delay: 1200, size: 90, x: 20, y: height * 0.8, color: '#C4B5FD' },
  ], []);

  const stepEmojis = ['\u{1F30D}', '\u{1F3AF}', '\u{1F4AA}'];

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -40, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(40);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
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

    Animated.sequence([
      Animated.spring(continueScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(continueScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

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

  const t = (key: Parameters<typeof getTranslation>[0]) =>
    getTranslation(key, nativeLanguage || 'en');

  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: t('welcome'),
          subtitle: t('whatLanguage'),
        };
      case 2:
        return {
          title: t('greatChoice'),
          subtitle: t('whatLearn'),
        };
      case 3:
        return {
          title: t('almostDone'),
          subtitle: t('whatLevel'),
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
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
      {/* Floating Orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {orbs.map((orb, i) => (
          <FloatingOrb key={i} {...orb} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                s <= step && styles.progressDotActive,
                s === step && styles.progressDotCurrent,
              ]}>
                <Text style={[styles.progressDotText, s <= step && styles.progressDotTextActive]}>
                  {s < step ? '\u2713' : s === step ? stepEmojis[step - 1] : s}
                </Text>
              </View>
              {s < 3 && (
                <View style={[styles.progressLine, s < step && styles.progressLineActive]} />
              )}
            </View>
          ))}
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
          <Text style={styles.stepEmoji}>{stepEmojis[step - 1]}</Text>
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
                  item={{
                    ...level,
                    title: t(level.id === 'beginner' ? 'beginner' : level.id === 'intermediate' ? 'intermediate' : 'advanced'),
                    subtitle: t(level.id === 'beginner' ? 'beginnerDesc' : level.id === 'intermediate' ? 'intermediateDesc' : 'advancedDesc'),
                    description: t(level.id === 'beginner' ? 'beginnerHint' : level.id === 'intermediate' ? 'intermediateHint' : 'advancedHint'),
                  }}
                  isSelected={selectedLevel?.id === level.id}
                  onSelect={() => handleLevelSelect(level)}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Continue Button */}
        <View style={styles.bottomContainer}>
          <Animated.View style={{ transform: [{ scale: continueScale }] }}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!canContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={canContinue
                  ? (step === 3 ? ['#10B981', '#059669'] : ['#6366F1', '#8B5CF6'])
                  : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueButton}
              >
                <Text style={[styles.continueButtonText, !canContinue && styles.continueButtonTextDisabled]}>
                  {step === 3 ? `${t('letsStart')} \u{1F389}` : t('continue')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
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

  // Progress Dots
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 40,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressDotActive: {
    backgroundColor: 'rgba(99,102,241,0.3)',
    borderColor: '#6366F1',
  },
  progressDotCurrent: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
  },
  progressDotTextActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    width: 50,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#6366F1',
  },

  // Back Button
  backButton: {
    position: 'absolute',
    left: 20,
    top: 76,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  stepEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
    textAlign: 'center',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  languageItemSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  flagEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  languageNameSelected: {
    color: '#34D399',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
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
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 2,
  },
  levelCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelEmoji: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  levelEmojiText: {
    fontSize: 24,
  },
  levelTextContent: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  levelSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  levelDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },
  levelCheckBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
});

export default OnboardingScreen;
