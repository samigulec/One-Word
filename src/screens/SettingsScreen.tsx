import React, { useState } from 'react';
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

  const levelNames: Record<string, string> = {
    'A1': `🌱 ${t('beginner')}`,
    'A2': '🌿 Elementary',
    'B1': `📚 ${t('intermediate')}`,
    'B2': '📖 Upper Intermediate',
    'C1': `🚀 ${t('advanced')}`,
    'C2': '⭐ Mastery',
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
    <LinearGradient colors={['#F5F7FA', '#E8ECF1']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>←</Text>
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
              <Text style={styles.settingText}>{levelNames[proficiencyLevel] || proficiencyLevel}</Text>
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
              <Text style={styles.settingText}>1.0.0</Text>
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
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeIcon: { fontSize: 22, color: '#3D5A80', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#3D5A80' },
  placeholder: { width: 40 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78909C',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingLabel: { fontSize: 16, color: '#78909C', fontWeight: '500' },
  settingValue: { flexDirection: 'row', alignItems: 'center' },
  settingFlag: { fontSize: 22, marginRight: 8 },
  settingText: { fontSize: 16, fontWeight: '700', color: '#3D5A80' },
  settingHint: {
    fontSize: 13,
    color: '#90A4AE',
    textAlign: 'center',
    marginTop: 12,
  },
  divider: { height: 1, backgroundColor: '#F0F4F8', marginHorizontal: 16 },
  resetButton: {
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFCDD2',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E53935',
  },
  resetButtonSubtext: {
    fontSize: 13,
    color: '#EF9A9A',
    marginTop: 4,
  },
});

export default SettingsScreen;

