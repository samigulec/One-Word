// ProfileScreen.tsx -- Profil, ayarlar, istatistikler ve paylasim
// v2.0.0 UX yeniden tasarimi: Settings + istatistikler + paylasim birlestirildi

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { LanguageCode, LANGUAGES, getTranslation, getLanguageName } from '../utils/translations';
import { ProficiencyLevel, NotificationSettings, FeedbackIntensity, UserProgress, LevelInfo } from '../types';
import {
  clearAllData,
  getNotificationSettings,
  saveNotificationSettings,
  getStreakFreezeStatus,
  getCalmMode,
  setCalmMode,
  getFeedbackIntensity,
  setFeedbackIntensity,
  getUserProgress,
  getDailyXPStatus,
  getUserName,
} from '../utils/storage';
import {
  requestNotificationPermission,
  scheduleAllNotifications,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../utils/notifications';

// Profil tab secenekleri
type ProfileTab = 'stats' | 'settings';

type ProfileScreenProps = {
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  proficiencyLevel: ProficiencyLevel;
  onClose: () => void;
  onReset: () => void;
  calmMode: boolean;
  onCalmModeChange: (enabled: boolean) => void;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  nativeLanguage, targetLanguage, proficiencyLevel, onClose, onReset,
  calmMode, onCalmModeChange,
}) => {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);
  const nativeLang = LANGUAGES.find(l => l.code === nativeLanguage);
  const targetLang = LANGUAGES.find(l => l.code === targetLanguage);

  // Tab state
  const [activeTab, setActiveTab] = useState<ProfileTab>('stats');

  // Kullanici bilgileri
  const [userName, setUserName] = useState<string>('');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [totalXP, setTotalXP] = useState<number>(0);

  // Animasyonlar
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const resetScale = useRef(new Animated.Value(1)).current;

  // Bildirim ayarlari state'i
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  // Streak freeze state'i
  const [freezeCount, setFreezeCount] = useState(0);
  const [freezeActive, setFreezeActive] = useState(false);
  // Geri bildirim siddeti state'i
  const [feedbackMode, setFeedbackMode] = useState<FeedbackIntensity>('balanced');

  useEffect(() => {
    loadAllData();
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Tum verileri yukle
  const loadAllData = async () => {
    const [notifs, freezeStatus, feedback, progress, xpStatus, name] = await Promise.all([
      getNotificationSettings(),
      getStreakFreezeStatus(),
      getFeedbackIntensity(),
      getUserProgress(),
      getDailyXPStatus(),
      getUserName(),
    ]);

    setNotifSettings(notifs);
    setFreezeCount(freezeStatus.count);
    setFreezeActive(freezeStatus.isActive);
    setFeedbackMode(feedback);
    setUserProgress(progress);
    setLevelInfo(xpStatus.levelInfo);
    setTotalXP(xpStatus.totalXP);
    setUserName(name);
  };

  // Bildirim ayarlarini guncelle ve kaydet
  const updateNotifSetting = useCallback(async (updates: Partial<NotificationSettings>) => {
    const updated = { ...notifSettings, ...updates };
    setNotifSettings(updated);
    await saveNotificationSettings(updated);
    await scheduleAllNotifications(updated);
  }, [notifSettings]);

  // Ana bildirim toggle
  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Bildirim Izni',
          'Bildirimleri kullanabilmek icin ayarlardan izin vermeniz gerekiyor.',
          [{ text: 'Tamam' }]
        );
        return;
      }
    }
    await updateNotifSetting({ enabled: value });
  }, [updateNotifSetting]);

  // Saat secimi icin +/- kontrolleri
  const adjustTime = useCallback((
    field: 'dailyWordTime' | 'streakReminderTime' | 'quizReminderTime',
    part: 'hour' | 'minute',
    delta: number
  ) => {
    const current = notifSettings[field];
    let newVal = current[part] + delta;
    if (part === 'hour') {
      newVal = ((newVal % 24) + 24) % 24;
    } else {
      newVal = ((newVal % 60) + 60) % 60;
    }
    updateNotifSetting({ [field]: { ...current, [part]: newVal } });
  }, [notifSettings, updateNotifSetting]);

  // Saat gosterim formati
  const formatTime = (time: { hour: number; minute: number }): string => {
    return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
  };

  const levelNames: Record<string, string> = {
    'A1': t('beginner'), 'A2': 'Elementary',
    'B1': t('intermediate'), 'B2': 'Upper Intermediate',
    'C1': t('advanced'), 'C2': 'Mastery',
  };

  const levelEmojis: Record<string, string> = {
    'A1': '\u{1F331}', 'A2': '\u{1F33F}',
    'B1': '\u{1F525}', 'B2': '\u{1F4A5}',
    'C1': '\u{1F680}', 'C2': '\u{1F451}',
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
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

  // Istatistikler tab icerigi
  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      {/* Profil karti */}
      <LinearGradient
        colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.1)']}
        style={styles.profileCard}
      >
        <Text style={styles.profileEmoji}>{levelInfo?.emoji || '\u{1F331}'}</Text>
        <Text style={styles.profileName}>{userName || 'Kullanici'}</Text>
        <Text style={styles.profileLevel}>
          Lv. {levelInfo?.level || 1} - {levelInfo?.title || 'Merakli'}
        </Text>
        <View style={styles.profileXPBadge}>
          <Text style={styles.profileXPValue}>{totalXP.toLocaleString()}</Text>
          <Text style={styles.profileXPLabel}>XP</Text>
        </View>
      </LinearGradient>

      {/* Istatistik kartlari */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>{'\u{1F525}'}</Text>
          <Text style={styles.statValue}>{userProgress?.streak || 0}</Text>
          <Text style={styles.statLabel}>{t('dayStreak')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>{'\u{1F4DA}'}</Text>
          <Text style={styles.statValue}>{userProgress?.totalIdiomsLearned || 0}</Text>
          <Text style={styles.statLabel}>{t('words')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>{'\u{2764}\u{FE0F}'}</Text>
          <Text style={styles.statValue}>{(userProgress?.favorites || []).length}</Text>
          <Text style={styles.statLabel}>Favoriler</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>{'\u{1F4C5}'}</Text>
          <Text style={styles.statValue}>{Math.floor((userProgress?.streak || 0) / 7)}</Text>
          <Text style={styles.statLabel}>{t('weeks')}</Text>
        </View>
      </View>

      {/* Dil ayarlari */}
      <Text style={styles.sectionTitle}>{t('yourSettings')}</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelRow}>
            <Text style={styles.settingEmoji}>{'\u{1F5E3}'}</Text>
            <Text style={styles.settingLabel}>{t('iSpeak')}</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.settingFlag}>{nativeLang?.flag}</Text>
            <Text style={styles.settingText}>{getLanguageName(nativeLanguage, nativeLanguage)}</Text>
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
            <Text style={styles.settingText}>{getLanguageName(targetLanguage, nativeLanguage)}</Text>
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

      {/* Hakkinda */}
      <Text style={styles.sectionTitle}>{t('about')}</Text>
      <LinearGradient
        colors={['rgba(99,102,241,0.12)', 'rgba(139,92,246,0.08)']}
        style={styles.brandCard}
      >
        <Text style={styles.brandLogo}>{'\u{2726}'}</Text>
        <Text style={styles.brandName}>One Word</Text>
        <Text style={styles.brandSlogan}>{t('slogan')}</Text>
        <View style={styles.brandDivider} />
        <Text style={styles.brandDescription}>{t('aboutDescription')}</Text>
        <View style={styles.brandFooter}>
          <Text style={styles.brandMadeWith}>{t('madeWith')} {'\u{2764}\u{FE0F}'}</Text>
          <Text style={styles.brandDeveloper}>{t('developer')}</Text>
        </View>
      </LinearGradient>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelRow}>
            <Text style={styles.settingEmoji}>{'\u{1F4E6}'}</Text>
            <Text style={styles.settingLabel}>{t('version')}</Text>
          </View>
          <Text style={styles.settingTextMuted}>{Constants.expoConfig?.version ?? '2.0.0'}</Text>
        </View>
      </View>
    </View>
  );

  // Ayarlar tab icerigi
  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      {/* Calm Mode */}
      <Text style={styles.sectionTitle}>{'\u{1F9D8}'} {t('calmMode')}</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={[styles.settingLabelRow, { flex: 1 }]}>
            <Text style={styles.settingEmoji}>{'\u{1F33F}'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>{t('calmMode')}</Text>
              <Text style={styles.freezeDesc}>{t('calmModeDesc')}</Text>
            </View>
          </View>
          <Switch
            value={calmMode}
            onValueChange={async (value) => {
              await setCalmMode(value);
              onCalmModeChange(value);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(110,231,183,0.5)' }}
            thumbColor={calmMode ? '#6EE7B7' : '#666'}
          />
        </View>
      </View>

      {/* Geri Bildirim Siddeti */}
      <Text style={styles.sectionTitle}>{'\u{1F4AC}'} Feedback Style</Text>
      <View style={styles.card}>
        {([
          { key: 'soft' as FeedbackIntensity, emoji: '\u{1F33B}', label: 'Soft', desc: 'Encouraging and gentle corrections' },
          { key: 'balanced' as FeedbackIntensity, emoji: '\u{2696}\u{FE0F}', label: 'Balanced', desc: 'Constructive feedback with explanations' },
          { key: 'strict' as FeedbackIntensity, emoji: '\u{1F3AF}', label: 'Strict', desc: 'Direct corrections, detailed feedback' },
        ]).map((option, index) => (
          <React.Fragment key={option.key}>
            {index > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              onPress={async () => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setFeedbackMode(option.key);
                await setFeedbackIntensity(option.key);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.settingRow}>
                <View style={[styles.settingLabelRow, { flex: 1 }]}>
                  <Text style={styles.settingEmoji}>{option.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>{option.label}</Text>
                    <Text style={styles.freezeDesc}>{option.desc}</Text>
                  </View>
                </View>
                <View style={[
                  styles.feedbackRadio,
                  feedbackMode === option.key && styles.feedbackRadioSelected,
                ]}>
                  {feedbackMode === option.key && (
                    <View style={styles.feedbackRadioDot} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>

      {/* Bildirimler */}
      <Text style={styles.sectionTitle}>{'\u{1F514}'} Bildirimler</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelRow}>
            <Text style={styles.settingEmoji}>{'\u{1F4F3}'}</Text>
            <Text style={styles.settingLabel}>Bildirimler</Text>
          </View>
          <Switch
            value={notifSettings.enabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(99,102,241,0.5)' }}
            thumbColor={notifSettings.enabled ? '#6366F1' : '#666'}
          />
        </View>

        {notifSettings.enabled && (
          <>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingEmoji}>{'\u{1F4D6}'}</Text>
                <Text style={styles.settingLabel}>Gunluk Kelime</Text>
              </View>
              <Switch
                value={notifSettings.dailyWordReminder}
                onValueChange={(v) => updateNotifSetting({ dailyWordReminder: v })}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(99,102,241,0.5)' }}
                thumbColor={notifSettings.dailyWordReminder ? '#6366F1' : '#666'}
              />
            </View>
            {notifSettings.dailyWordReminder && (
              <View style={styles.timePickerRow}>
                <TouchableOpacity onPress={() => adjustTime('dailyWordTime', 'hour', -1)} style={styles.timeBtn}>
                  <Text style={styles.timeBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.timeDisplay}>{formatTime(notifSettings.dailyWordTime)}</Text>
                <TouchableOpacity onPress={() => adjustTime('dailyWordTime', 'hour', 1)} style={styles.timeBtn}>
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingEmoji}>{'\u{1F525}'}</Text>
                <Text style={styles.settingLabel}>Seri Hatirlatma</Text>
              </View>
              <Switch
                value={notifSettings.streakReminder}
                onValueChange={(v) => updateNotifSetting({ streakReminder: v })}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(99,102,241,0.5)' }}
                thumbColor={notifSettings.streakReminder ? '#6366F1' : '#666'}
              />
            </View>
            {notifSettings.streakReminder && (
              <View style={styles.timePickerRow}>
                <TouchableOpacity onPress={() => adjustTime('streakReminderTime', 'hour', -1)} style={styles.timeBtn}>
                  <Text style={styles.timeBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.timeDisplay}>{formatTime(notifSettings.streakReminderTime)}</Text>
                <TouchableOpacity onPress={() => adjustTime('streakReminderTime', 'hour', 1)} style={styles.timeBtn}>
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingEmoji}>{'\u{1F9E0}'}</Text>
                <Text style={styles.settingLabel}>Quiz Hatirlatma</Text>
              </View>
              <Switch
                value={notifSettings.quizReminder}
                onValueChange={(v) => updateNotifSetting({ quizReminder: v })}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(99,102,241,0.5)' }}
                thumbColor={notifSettings.quizReminder ? '#6366F1' : '#666'}
              />
            </View>
            {notifSettings.quizReminder && (
              <View style={styles.timePickerRow}>
                <TouchableOpacity onPress={() => adjustTime('quizReminderTime', 'hour', -1)} style={styles.timeBtn}>
                  <Text style={styles.timeBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.timeDisplay}>{formatTime(notifSettings.quizReminderTime)}</Text>
                <TouchableOpacity onPress={() => adjustTime('quizReminderTime', 'hour', 1)} style={styles.timeBtn}>
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Streak Freeze */}
      <Text style={styles.sectionTitle}>{'\u{2744}\u{FE0F}'} {t('streakFreeze')}</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelRow}>
            <Text style={styles.settingEmoji}>{freezeActive ? '\u{1F9CA}' : '\u{2744}\u{FE0F}'}</Text>
            <View>
              <Text style={styles.settingLabel}>{t('streakFreeze')}</Text>
              <Text style={styles.freezeDesc}>{t('streakFreezeDesc')}</Text>
            </View>
          </View>
          <View style={styles.freezeCountBadge}>
            <Text style={styles.freezeCountText}>{freezeCount}/2</Text>
          </View>
        </View>
        {freezeActive && (
          <>
            <View style={styles.divider} />
            <View style={styles.freezeActiveBar}>
              <Text style={styles.freezeActiveText}>{'\u{1F9CA}'} {t('streakFreezeActive')}</Text>
            </View>
          </>
        )}
      </View>

      {/* Tehlike Bolgesi */}
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
    </View>
  );

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'\u{1F464}'} Profil</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab secici */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'stats' && styles.tabItemActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('stats'); }}
            activeOpacity={0.7}
          >
            <Text style={styles.tabItemIcon}>{'\u{1F4CA}'}</Text>
            <Text style={[styles.tabItemLabel, activeTab === 'stats' && styles.tabItemLabelActive]}>
              Istatistikler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('settings'); }}
            activeOpacity={0.7}
          >
            <Text style={styles.tabItemIcon}>{'\u{2699}\u{FE0F}'}</Text>
            <Text style={[styles.tabItemLabel, activeTab === 'settings' && styles.tabItemLabelActive]}>
              Ayarlar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab icerigi */}
        <Animated.View style={{ flex: 1, opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'stats' && renderStatsTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

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

  // Tab secici
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
  },
  tabItemIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  tabItemLabelActive: {
    color: '#A78BFA',
    fontWeight: '700',
  },

  // Tab icerigi
  tabContent: {},

  // Profil karti
  profileCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    marginBottom: 16,
  },
  profileEmoji: { fontSize: 48, marginBottom: 8 },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
    marginBottom: 12,
  },
  profileXPBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  profileXPValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FBBF24',
  },
  profileXPLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(251,191,36,0.6)',
  },

  // Istatistik grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flexGrow: 1,
    flexBasis: '46%' as any,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section baslik
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 14,
  },

  // Card
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
  settingEmoji: { fontSize: 18, marginRight: 10 },
  settingLabel: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  settingValue: { flexDirection: 'row', alignItems: 'center' },
  settingFlag: { fontSize: 22, marginRight: 8 },
  settingText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  settingTextMuted: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.3)' },
  settingHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 12,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16 },
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

  // Brand
  brandCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
    marginBottom: 14,
  },
  brandLogo: { fontSize: 36, marginBottom: 8 },
  brandName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  brandSlogan: { fontSize: 14, fontWeight: '500', color: '#A78BFA', marginTop: 4, fontStyle: 'italic' },
  brandDivider: {
    width: 40, height: 2, backgroundColor: 'rgba(99,102,241,0.3)',
    borderRadius: 1, marginVertical: 16,
  },
  brandDescription: {
    fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', paddingHorizontal: 8,
  },
  brandFooter: { marginTop: 16, alignItems: 'center' },
  brandMadeWith: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  brandDeveloper: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  // Reset
  resetButton: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  resetEmoji: { fontSize: 28, marginBottom: 8 },
  resetButtonText: { fontSize: 16, fontWeight: '700', color: '#F87171' },
  resetButtonSubtext: { fontSize: 13, color: 'rgba(248,113,113,0.6)', marginTop: 4 },

  // Bildirim ayarlari
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingBottom: 14,
    gap: 12,
  },
  timeBtn: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  timeBtnText: { fontSize: 18, fontWeight: '700', color: '#A78BFA' },
  timeDisplay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    minWidth: 60,
    textAlign: 'center',
  },

  // Streak Freeze
  freezeDesc: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  freezeCountBadge: {
    backgroundColor: 'rgba(56,189,248,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.2)',
  },
  freezeCountText: { fontSize: 14, fontWeight: '800', color: '#38BDF8' },
  freezeActiveBar: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  freezeActiveText: { fontSize: 13, fontWeight: '700', color: '#38BDF8' },

  // Feedback radio
  feedbackRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  feedbackRadioSelected: { borderColor: '#8B5CF6' },
  feedbackRadioDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#8B5CF6',
  },
});

export default ProfileScreen;
