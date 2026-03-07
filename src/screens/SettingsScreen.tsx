import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LanguageCode, LANGUAGES, getTranslation } from '../utils/translations';
import { ProficiencyLevel } from '../types';
import { clearAllData } from '../utils/storage';

type SettingsScreenProps = {
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  proficiencyLevel: ProficiencyLevel;
  onClose: () => void;
  onReset: () => void;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  nativeLanguage, targetLanguage, proficiencyLevel, onClose, onReset
}) => {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);
  const nativeLang = LANGUAGES.find(l => l.code === nativeLanguage);
  const targetLang = LANGUAGES.find(l => l.code === targetLanguage);

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const resetScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const levelNames: Record<string, string> = {
    'A1': t('beginner'),
    'A2': 'Elementary',
    'B1': t('intermediate'),
    'B2': 'Upper Intermediate',
    'C1': t('advanced'),
    'C2': 'Mastery',
  };

  const levelEmojis: Record<string, string> = {
    'A1': '\u{1F331}', 'A2': '\u{1F33F}',
    'B1': '\u{1F525}', 'B2': '\u{1F4A5}',
    'C1': '\u{1F680}', 'C2': '\u{1F451}',
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Animated.sequence([
      Animated.spring(resetScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(resetScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${t('resetConfirmTitle')}\n${t('resetConfirmMsg')}`);
      if (confirmed) {
        clearAllData().then(() => onReset());
      }
    } else {
      Alert.alert(
        t('resetConfirmTitle'),
        t('resetConfirmMsg'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('reset'),
            style: 'destructive',
            onPress: async () => {
              await clearAllData();
              onReset();
            }
          },
        ]
      );
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
          <Text style={styles.headerTitle}>{'\u{2699}\u{FE0F}'} {t('settings')}</Text>
          <View style={styles.placeholder} />
        </View>

        <Animated.View style={{ flex: 1, opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Current Settings */}
            <Text style={styles.sectionTitle}>{t('yourSettings')}</Text>

            <View style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingLabelRow}>
                  <Text style={styles.settingEmoji}>{'\u{1F5E3}'}</Text>
                  <Text style={styles.settingLabel}>{t('iSpeak')}</Text>
                </View>
                <View style={styles.settingValue}>
                  <Text style={styles.settingFlag}>{nativeLang?.flag}</Text>
                  <Text style={styles.settingText}>{nativeLang?.nativeName}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLabelRow}>
                  <Text style={styles.settingEmoji}>{'\u{1F4DA}'}</Text>
                  <Text style={styles.settingLabel}>{t('learning')}</Text>
                </View>
                <View style={styles.settingValue}>
                  <Text style={styles.settingFlag}>{targetLang?.flag}</Text>
                  <Text style={styles.settingText}>{targetLang?.nativeName}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLabelRow}>
                  <Text style={styles.settingEmoji}>{levelEmojis[proficiencyLevel] || '\u{2B50}'}</Text>
                  <Text style={styles.settingLabel}>{t('level')}</Text>
                </View>
                <LinearGradient
                  colors={['rgba(99,102,241,0.2)', 'rgba(139,92,246,0.2)']}
                  style={styles.levelBadge}
                >
                  <Text style={styles.levelBadgeText}>{proficiencyLevel}</Text>
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.settingHint}>{t('changeHint')}</Text>

            {/* About */}
            <Text style={styles.sectionTitle}>{t('about')}</Text>
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingLabelRow}>
                  <Text style={styles.settingEmoji}>{'\u{2726}'}</Text>
                  <Text style={styles.settingLabel}>{t('appName')}</Text>
                </View>
                <Text style={styles.settingText}>One Word</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingLabelRow}>
                  <Text style={styles.settingEmoji}>{'\u{1F4E6}'}</Text>
                  <Text style={styles.settingLabel}>{t('version')}</Text>
                </View>
                <Text style={styles.settingTextMuted}>1.0.0</Text>
              </View>
            </View>

            {/* Danger Zone */}
            <Text style={styles.sectionTitle}>{'\u{26A0}\u{FE0F}'} {t('dangerZone')}</Text>
            <Animated.View style={{ transform: [{ scale: resetScale }] }}>
              <TouchableOpacity onPress={handleReset} activeOpacity={0.8}>
                <LinearGradient
                  colors={['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.08)']}
                  style={styles.resetButton}
                >
                  <Text style={styles.resetEmoji}>{'\u{1F5D1}'}</Text>
                  <Text style={styles.resetButtonText}>{t('resetAllData')}</Text>
                  <Text style={styles.resetButtonSubtext}>{t('resetDesc')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
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
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 28,
    marginBottom: 14,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  settingLabel: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  settingValue: { flexDirection: 'row', alignItems: 'center' },
  settingFlag: { fontSize: 22, marginRight: 8 },
  settingText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  settingTextMuted: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.3)' },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A78BFA',
  },
  settingHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 12,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16 },
  resetButton: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  resetEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F87171',
  },
  resetButtonSubtext: {
    fontSize: 13,
    color: 'rgba(248,113,113,0.6)',
    marginTop: 4,
  },
});

export default SettingsScreen;
