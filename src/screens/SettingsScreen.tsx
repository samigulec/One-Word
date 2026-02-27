import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const levelNames: Record<string, string> = {
    'A1': t('beginner'),
    'A2': 'Elementary',
    'B1': t('intermediate'),
    'B2': 'Upper Intermediate',
    'C1': t('advanced'),
    'C2': 'Mastery',
  };

  const handleReset = () => {
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
  };

  return (
    <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Settings */}
          <Text style={styles.sectionTitle}>{t('yourSettings')}</Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('iSpeak')}</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingFlag}>{nativeLang?.flag}</Text>
                <Text style={styles.settingText}>{nativeLang?.nativeName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('learning')}</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingFlag}>{targetLang?.flag}</Text>
                <Text style={styles.settingText}>{targetLang?.nativeName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('level')}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{proficiencyLevel}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.settingHint}>{t('changeHint')}</Text>

          {/* About */}
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('appName')}</Text>
              <Text style={styles.settingText}>One Word</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('version')}</Text>
              <Text style={styles.settingTextMuted}>1.0.0</Text>
            </View>
          </View>

          {/* Danger Zone */}
          <Text style={styles.sectionTitle}>{t('dangerZone')}</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>{t('resetAllData')}</Text>
            <Text style={styles.resetButtonSubtext}>{t('resetDesc')}</Text>
          </TouchableOpacity>
        </ScrollView>
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
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  closeIcon: { fontSize: 20, color: '#475569', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  placeholder: { width: 40 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  settingValue: { flexDirection: 'row', alignItems: 'center' },
  settingFlag: { fontSize: 20, marginRight: 8 },
  settingText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  settingTextMuted: { fontSize: 15, fontWeight: '500', color: '#94A3B8' },
  levelBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  settingHint: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  resetButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  resetButtonSubtext: {
    fontSize: 13,
    color: '#F87171',
    marginTop: 4,
  },
});

export default SettingsScreen;
