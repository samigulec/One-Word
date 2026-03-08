// PracticeScreen.tsx -- Senaryo secim ekrani (Pratik Yap)
// v2.0.0 UX yeniden tasarimi: Ana sayfadan ayrildi, kendi ekrani oldu

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ContentItem } from '../types';
import { LanguageCode, getTranslation as getUITranslation } from '../utils/translations';

const { width } = Dimensions.get('window');

// Senaryo listesi
const SCENARIOS = [
  { id: 'cafe', emoji: '\u2615', labelKey: 'scenarioCafe', fallback: 'Kafede' },
  { id: 'travel', emoji: '\u2708\uFE0F', labelKey: 'scenarioTravel', fallback: 'Seyahatte' },
  { id: 'shopping', emoji: '\u{1F6D2}', labelKey: 'scenarioShopping', fallback: 'Alisveriste' },
  { id: 'work', emoji: '\u{1F4BC}', labelKey: 'scenarioWork', fallback: 'Is Yerinde' },
  { id: 'school', emoji: '\u{1F393}', labelKey: 'scenarioSchool', fallback: 'Okulda' },
  { id: 'friends', emoji: '\u{1F46B}', labelKey: 'scenarioFriends', fallback: 'Arkadaslarla' },
];

type PracticeScreenProps = {
  word: ContentItem | null;
  nativeLanguage: LanguageCode;
  onSelectScenario: (word: ContentItem) => void;
  onClose: () => void;
};

const PracticeScreen: React.FC<PracticeScreenProps> = ({
  word,
  nativeLanguage,
  onSelectScenario,
  onClose,
}) => {
  const t = (key: Parameters<typeof getUITranslation>[0]) => getUITranslation(key, nativeLanguage);

  // Animasyonlar
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleScenarioPress = (scenario: typeof SCENARIOS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (word) {
      onSelectScenario(word);
    }
  };

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'\u{1F4AC}'} Pratik Yap</Text>
          <View style={styles.placeholder} />
        </View>

        <Animated.View style={[styles.content, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Aktif kelime bilgisi */}
          {word && (
            <LinearGradient
              colors={['rgba(99,102,241,0.12)', 'rgba(139,92,246,0.08)']}
              style={styles.wordBanner}
            >
              <Text style={styles.wordBannerEmoji}>{word.emoji || '\u{1F4AC}'}</Text>
              <View style={styles.wordBannerText}>
                <Text style={styles.wordBannerWord}>"{word.target_word}"</Text>
                <Text style={styles.wordBannerHint}>
                  {t('practiceWithAI') || 'ile pratik yap'}
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Alt baslik */}
          <Text style={styles.subtitle}>
            {t('practiceSubtitle') || 'Bir senaryo sec ve konusmaya basla!'}
          </Text>

          {/* Senaryo grid */}
          <View style={styles.scenarioGrid}>
            {SCENARIOS.map((scenario) => (
              <TouchableOpacity
                key={scenario.id}
                style={styles.scenarioCard}
                activeOpacity={0.7}
                onPress={() => handleScenarioPress(scenario)}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                  style={styles.scenarioCardInner}
                >
                  <Text style={styles.scenarioEmoji}>{scenario.emoji}</Text>
                  <Text style={styles.scenarioLabel}>
                    {t(scenario.labelKey as any) || scenario.fallback}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Serbest pratik butonu */}
          <TouchableOpacity
            style={styles.freeButton}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (word) onSelectScenario(word);
            }}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.freeButtonInner}
            >
              <Text style={styles.freeButtonText}>{'\u{2728}'} Serbest Konusma</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeIcon: { fontSize: 20, color: '#FFFFFF', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  placeholder: { width: 42 },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Kelime banner
  wordBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  wordBannerEmoji: { fontSize: 32, marginRight: 14 },
  wordBannerText: { flex: 1 },
  wordBannerWord: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  wordBannerHint: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },

  // Alt baslik
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Senaryo grid
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  scenarioCard: {
    width: (width - 52) / 2,
    borderRadius: 18,
    overflow: 'hidden',
  },
  scenarioCardInner: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scenarioEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  scenarioLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  // Serbest pratik
  freeButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  freeButtonInner: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },
  freeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PracticeScreen;
