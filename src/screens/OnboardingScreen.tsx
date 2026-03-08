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
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, Language, LanguageCode, getTranslation, getLanguageName } from '../utils/translations';
import { ProficiencyLevel } from '../types';

const { width, height } = Dimensions.get('window');

type OnboardingScreenProps = {
  onComplete: (nativeLanguage: LanguageCode, targetLanguage: LanguageCode, level: ProficiencyLevel, userName?: string) => void;
};

interface SimplifiedLevel {
  id: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  subtitle: string;
  description: string;
  cerfLevel: ProficiencyLevel;
  color: string;
  gradientColors: [string, string];
  bgColor: string;
  emoji: string;
  icon: string;
}

const SIMPLIFIED_LEVELS: SimplifiedLevel[] = [
  {
    id: 'beginner',
    title: '',
    subtitle: '',
    description: '',
    cerfLevel: 'A1',
    color: '#10B981',
    gradientColors: ['#10B981', '#34D399'],
    bgColor: 'rgba(16,185,129,0.15)',
    emoji: '\u{1F331}',
    icon: '\u{1F423}',
  },
  {
    id: 'intermediate',
    title: '',
    subtitle: '',
    description: '',
    cerfLevel: 'B1',
    color: '#F59E0B',
    gradientColors: ['#F59E0B', '#FBBF24'],
    bgColor: 'rgba(245,158,11,0.15)',
    emoji: '\u{1F525}',
    icon: '\u{1F3C3}',
  },
  {
    id: 'advanced',
    title: '',
    subtitle: '',
    description: '',
    cerfLevel: 'C1',
    color: '#8B5CF6',
    gradientColors: ['#8B5CF6', '#A78BFA'],
    bgColor: 'rgba(139,92,246,0.15)',
    emoji: '\u{1F680}',
    icon: '\u{1F9D9}',
  },
];

// Animated sparkle for background
const Sparkle: React.FC<{ delay: number; x: number; y: number }> = ({ delay, x, y }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      opacity.setValue(0);
      scale.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        ]),
        Animated.delay(800 + Math.random() * 1200),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        Animated.delay(Math.random() * 2000),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        top: y,
        fontSize: 14,
        opacity,
        transform: [{ scale }],
      }}
    >
      {'\u2728'}
    </Animated.Text>
  );
};

// Animated floating bubble
const FloatingBubble: React.FC<{ delay: number; size: number; x: number; color: string }> = ({ delay, size, x, color }) => {
  const translateY = useRef(new Animated.Value(height + 50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(height + 50);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 6000 + Math.random() * 4000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.3, duration: 1000, delay, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 3000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
};

const LanguageCard: React.FC<{
  item: Language;
  isSelected: boolean;
  onSelect: (lang: Language) => void;
  index: number;
  isDisabled?: boolean;
  displayName?: string;
}> = ({ item, isSelected, onSelect, index, isDisabled, displayName }) => {
  const itemScale = useRef(new Animated.Value(1)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 60,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    if (isDisabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Animated.sequence([
      Animated.spring(itemScale, { toValue: 0.88, useNativeDriver: true }),
      Animated.spring(itemScale, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }),
    ]).start();
    onSelect(item);
  };

  return (
    <Animated.View style={{
      transform: [
        { scale: Animated.multiply(itemScale, enterAnim) },
        { translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
      ],
      opacity: enterAnim,
    }}>
      <TouchableOpacity
        style={[
          styles.languageCard,
          isSelected && styles.languageCardSelected,
          isDisabled && styles.languageCardDisabled,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {isSelected && (
          <LinearGradient
            colors={['rgba(16,185,129,0.2)', 'rgba(52,211,153,0.1)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <Text style={styles.flagEmoji}>{item.flag}</Text>
        <Text style={[
          styles.languageName,
          isSelected && styles.languageNameSelected,
          isDisabled && styles.languageNameDisabled,
        ]}>
          {displayName || item.nativeName}
        </Text>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedCheck}>{'\u2713'}</Text>
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
  index: number;
}> = ({ item, isSelected, onSelect, index }) => {
  const cardScale = useRef(new Animated.Value(1)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 120,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isSelected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isSelected]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(cardScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
    ]).start();
    onSelect(item);
  };

  return (
    <Animated.View style={{
      transform: [
        { scale: Animated.multiply(cardScale, enterAnim) },
        { translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
      ],
      opacity: enterAnim,
    }}>
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
        {isSelected && (
          <Animated.View style={[
            styles.levelGlow,
            {
              backgroundColor: item.color,
              opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.15] }),
            },
          ]} />
        )}
        <View style={styles.levelCardContent}>
          <View style={[styles.levelIconContainer, { backgroundColor: isSelected ? `${item.color}30` : 'rgba(255,255,255,0.08)' }]}>
            <Text style={styles.levelIconText}>{item.icon}</Text>
            <Text style={styles.levelIconEmoji}>{item.emoji}</Text>
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
          {isSelected ? (
            <LinearGradient
              colors={item.gradientColors}
              style={styles.levelCheckBadge}
            >
              <Text style={styles.levelCheckMark}>{'\u2713'}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.levelUnselectedCircle} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [userName, setUserName] = useState<string>('');
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SimplifiedLevel | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const continueScale = useRef(new Animated.Value(1)).current;
  const titleBounce = useRef(new Animated.Value(0)).current;
  const mascotBounce = useRef(new Animated.Value(0)).current;

  // Sparkles
  const sparkles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 500,
      x: Math.random() * (width - 30),
      y: Math.random() * (height * 0.4) + height * 0.1,
    })), []);

  // Floating bubbles
  const bubbles = useMemo(() => {
    const colors = ['#818CF8', '#A78BFA', '#F0ABFC', '#67E8F9', '#34D399', '#FCD34D'];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 700,
      size: 8 + Math.random() * 16,
      x: Math.random() * width,
      color: colors[i % colors.length],
    }));
  }, []);

  useEffect(() => {
    // Mascot bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotBounce, { toValue: -12, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(mascotBounce, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const stepTitles = [
    { emoji: '\u{1F44B}', big: '\u{1F44B}' },
    { emoji: '\u{1F30D}', big: '\u{1F30D}' },
    { emoji: '\u{1F4DA}', big: '\u{1F3AF}' },
    { emoji: '\u{1F3C6}', big: '\u{1F4AA}' },
  ];

  // Fun greetings in different languages for dynamic display
  const greetings: Record<LanguageCode, string[]> = {
    en: ['Hey there!', 'Awesome!', 'Let\'s go!'],
    tr: ['Merhaba!', 'Harika!', 'Hadi!'],
    es: ['Hola!', 'Genial!', 'Vamos!'],
    de: ['Hallo!', 'Super!', 'Los geht\'s!'],
    fr: ['Salut!', 'G\u00e9nial!', 'Allons-y!'],
    pt: ['Oi!', 'Legal!', 'Vamos!'],
    it: ['Ciao!', 'Fantastico!', 'Andiamo!'],
    ru: ['\u041F\u0440\u0438\u0432\u0435\u0442!', '\u041A\u043B\u0430\u0441\u0441!', '\u041F\u043E\u0435\u0445\u0430\u043B\u0438!'],
    ja: ['\u3084\u3042!', '\u3059\u3054\u3044!', '\u884C\u3053\u3046!'],
    ko: ['\uC548\uB155!', '\uBA4B\uC838\uC694!', '\uAC00\uC790!'],
    zh: ['\u4F60\u597D!', '\u592A\u68D2\u4E86!', '\u51FA\u53D1!'],
  };

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

    if (step === 2) {
      setNativeLanguage(lang.code);
    } else if (step === 3) {
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

    if (step === 1 && userName.trim().length > 0) {
      animateTransition(() => setStep(2));
    } else if (step === 2 && nativeLanguage) {
      animateTransition(() => setStep(3));
    } else if (step === 3 && targetLanguage) {
      animateTransition(() => setStep(4));
    } else if (step === 4 && selectedLevel && nativeLanguage && targetLanguage) {
      onComplete(nativeLanguage, targetLanguage, selectedLevel.cerfLevel, userName.trim());
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 2) {
      animateTransition(() => {
        setStep(1);
        setNativeLanguage(null);
      });
    } else if (step === 3) {
      animateTransition(() => {
        setStep(2);
        setTargetLanguage(null);
      });
    } else if (step === 4) {
      animateTransition(() => {
        setStep(3);
        setSelectedLevel(null);
      });
    }
  };

  const canContinue =
    (step === 1 && userName.trim().length > 0) ||
    (step === 2 && nativeLanguage) ||
    (step === 3 && targetLanguage) ||
    (step === 4 && selectedLevel);

  const t = (key: Parameters<typeof getTranslation>[0]) =>
    getTranslation(key, nativeLanguage || 'en');

  const getStepContent = () => {
    const nativeGreeting = nativeLanguage ? greetings[nativeLanguage][0] : '';
    const targetFlag = targetLanguage ? LANGUAGES.find(l => l.code === targetLanguage)?.flag || '' : '';
    switch (step) {
      case 1:
        return {
          title: 'One Word',
          subtitle: t('whatsYourName'),
          funText: userName.trim() ? `${t('nameStepTitle')} ${userName.trim()}` : t('slogan'),
        };
      case 2:
        return {
          title: userName.trim() ? `${userName.trim()}, ${t('welcome').toLowerCase()}` : t('welcome'),
          subtitle: t('whatLanguage'),
          funText: nativeLanguage ? `${greetings[nativeLanguage][1]} ${LANGUAGES.find(l => l.code === nativeLanguage)?.flag || ''}` : '',
        };
      case 3:
        return {
          title: nativeGreeting ? `${nativeGreeting} ${t('greatChoice')}` : t('greatChoice'),
          subtitle: t('whatLearn'),
          funText: targetLanguage ? `${targetFlag} ${greetings[targetLanguage!][0]}` : '',
        };
      case 4:
        return {
          title: t('almostDone'),
          subtitle: t('whatLevel'),
          funText: targetLanguage && nativeLanguage ? `${LANGUAGES.find(l => l.code === nativeLanguage)?.flag || ''} \u2192 ${targetFlag}` : '',
        };
    }
  };

  const content = getStepContent();
  const availableLanguages = LANGUAGES;

  const renderLanguageItem = ({ item, index }: { item: Language; index: number }) => (
    <LanguageCard
      item={item}
      isSelected={(step === 2 ? nativeLanguage : targetLanguage) === item.code}
      onSelect={handleLanguageSelect}
      index={index}
      isDisabled={step === 3 && item.code === nativeLanguage}
      displayName={step === 3 && nativeLanguage ? getLanguageName(item.code, nativeLanguage) : undefined}
    />
  );

  return (
    <LinearGradient
      colors={step === 1
        ? ['#0F0A2E', '#1A1145', '#251B5E']
        : step === 2
        ? ['#0F0A2E', '#1A1145', '#251B5E']
        : step === 3
        ? ['#0A1628', '#111B3E', '#1A2555']
        : ['#1A0A2E', '#251145', '#301B5E']
      }
      style={styles.container}
    >
      {/* Floating Bubbles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {bubbles.map(b => (
          <FloatingBubble key={b.id} {...b} />
        ))}
      </View>

      {/* Sparkles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {sparkles.map(s => (
          <Sparkle key={s.id} {...s} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Top Section: Progress + Back */}
        <View style={styles.topSection}>
          {step > 1 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backArrow}>{'\u2190'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((s) => (
              <View key={s} style={styles.progressStep}>
                <View style={[
                  styles.progressDot,
                  s <= step && styles.progressDotActive,
                  s === step && styles.progressDotCurrent,
                ]}>
                  <Text style={[styles.progressDotText, s <= step && styles.progressDotTextActive]}>
                    {s < step ? '\u2713' : stepTitles[s - 1].emoji}
                  </Text>
                </View>
                {s < 4 && (
                  <View style={[styles.progressLine, s < step && styles.progressLineActive]} />
                )}
              </View>
            ))}
          </View>

          <View style={styles.backPlaceholder} />
        </View>

        {/* Header with Mascot */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Animated.Text style={[styles.headerMascot, { transform: [{ translateY: mascotBounce }] }]}>
            {stepTitles[step - 1].big}
          </Animated.Text>
          <Text style={styles.headerTitle}>{content.title}</Text>
          <Text style={styles.headerSubtitle}>{content.subtitle}</Text>
          {content.funText ? (
            <View style={styles.funTextBubble}>
              <Text style={styles.funTextContent}>{content.funText}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {step === 1 ? (
            // Isim girisi adimi
            <View style={styles.nameInputContainer}>
              <TextInput
                style={styles.nameInput}
                placeholder={t('namePlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={userName}
                onChangeText={setUserName}
                autoFocus
                maxLength={20}
                returnKeyType="next"
                onSubmitEditing={() => { if (userName.trim()) handleContinue(); }}
              />
            </View>
          ) : (step === 2 || step === 3) ? (
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
            <ScrollView style={styles.levelScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.levelContainer}>
                {SIMPLIFIED_LEVELS.map((level, index) => (
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
                    index={index}
                  />
                ))}
              </View>
            </ScrollView>
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
                  ? (step === 4 ? ['#10B981', '#34D399'] : ['#6366F1', '#A855F7'])
                  : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.continueButton, canContinue && styles.continueButtonActive]}
              >
                <Text style={[styles.continueButtonText, !canContinue && styles.continueButtonTextDisabled]}>
                  {step === 4 ? `\u{1F680} ${t('letsStart')} \u{1F389}` : `${t('continue')} \u{2192}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Step indicator with emojis */}
          <View style={styles.stepIndicatorRow}>
            {[1, 2, 3, 4].map((s) => (
              <Text key={s} style={[styles.stepIndicatorDot, s <= step && styles.stepIndicatorDotActive]}>
                {s <= step ? '\u2B50' : '\u26AA'}
              </Text>
            ))}
          </View>
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

  // Top Section
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  progressDotActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderColor: '#6366F1',
  },
  progressDotCurrent: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  progressDotText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },
  progressDotTextActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 6,
    borderRadius: 1,
  },
  progressLineActive: {
    backgroundColor: '#6366F1',
  },

  // Back Button
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  backArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerMascot: {
    fontSize: 52,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    textAlign: 'center',
  },
  funTextBubble: {
    marginTop: 10,
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  funTextContent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#A78BFA',
    textAlign: 'center',
  },

  // Content
  contentContainer: {
    flex: 1,
  },
  languageGrid: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  // Language Card
  languageCard: {
    width: (width - 42) / 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  languageCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.08)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  languageCardDisabled: {
    opacity: 0.35,
  },
  flagEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  languageNameSelected: {
    color: '#34D399',
    fontWeight: '800',
  },
  languageNameDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#10B981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCheck: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Name Input
  nameInputContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 18,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.3)',
  },

  // Level Cards
  levelScrollView: {
    flex: 1,
  },
  levelContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  levelCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 2,
    overflow: 'hidden',
  },
  levelGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  levelCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  levelIconText: {
    fontSize: 28,
  },
  levelIconEmoji: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 14,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  levelCheckMark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  levelUnselectedCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Bottom / Continue
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  continueButton: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 40,
    width: width - 48,
    alignItems: 'center',
  },
  continueButtonActive: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  continueButtonText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  continueButtonTextDisabled: {
    color: 'rgba(255,255,255,0.25)',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  stepIndicatorDot: {
    fontSize: 12,
  },
  stepIndicatorDotActive: {
    fontSize: 14,
  },
});

export default OnboardingScreen;
