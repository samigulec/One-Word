import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress, LanguagePreferences, ContentItem, LearnedWord, SRSData, NotificationSettings, EarnedBadge, XPEntry, XPActionType, DailyTasksData, DailyTask, DailyTaskId, WeeklyChallengeData, FeedbackIntensity } from '../types';
import { createSRSData, updateSRS, getDueWords } from './srs';
import { DEFAULT_NOTIFICATION_SETTINGS } from './notifications';
import { createWeeklyChallengeData, updateGoalProgress, isWeeklyChallengeComplete, WEEKLY_CHALLENGE_BONUS_XP, getWeeklyBadgeId } from './weeklyChallenge';
import { getWeekNumber } from './xp';

const STORAGE_KEYS = {
  USER_PROGRESS: '@daily_idiom_progress',
  LANGUAGE_PREFERENCES: '@language_preferences',
  SRS_DATA: '@srs_data',
  NOTIFICATION_SETTINGS: '@notification_settings',
  EARNED_BADGES: '@earned_badges',
  QUIZ_COUNT: '@quiz_count',
  DAILY_TASKS: '@daily_tasks',
  CALM_MODE: '@calm_mode',
  WEEKLY_CHALLENGE: '@weekly_challenge',
  FEEDBACK_INTENSITY: '@feedback_intensity',
};

const defaultProgress: UserProgress = {
  lastViewedDate: '',
  viewedIdiomIds: [],
  streak: 0,
  totalIdiomsLearned: 0,
  learnedWords: [],
  favorites: [],
  totalXP: 0,
  dailyXP: 0,
  dailyXPDate: '',
  dailyXPGoal: 50,
  xpHistory: [],
  level: 1,
  dailyGoalStreak: 0,
  weeklyXP: {},
  dailyActionCounts: {},
  streakFreezeCount: 1,       // Baslangicta 1 freeze hakki
  streakFreezeUsedDate: '',
};

// ─── Progress ────────────────────────────────────────────

export const getUserProgress = async (): Promise<UserProgress> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...defaultProgress, ...parsed };
    }
    return defaultProgress;
  } catch (error) {
    return defaultProgress;
  }
};

export const saveUserProgress = async (progress: UserProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};

export const updateDailyStreak = async (idiomId: number): Promise<UserProgress> => {
  const progress = await getUserProgress();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newStreak = progress.streak;
  let freezeCount = progress.streakFreezeCount ?? 1;
  let freezeUsedDate = progress.streakFreezeUsedDate ?? '';

  if (progress.lastViewedDate === today) {
    return progress;
  } else if (progress.lastViewedDate === yesterday) {
    // Dun girilmis, streak devam ediyor
    newStreak += 1;
  } else {
    // 1+ gun atlanmis -- streak freeze kontrolu
    const lastDate = progress.lastViewedDate ? new Date(progress.lastViewedDate) : null;
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    if (
      lastDate &&
      progress.lastViewedDate === twoDaysAgo &&
      freezeCount > 0 &&
      freezeUsedDate !== yesterday // Ayni gun icin iki kez kullanilmasin
    ) {
      // Streak freeze kullan -- sadece 1 gun atlandiysa
      freezeCount -= 1;
      freezeUsedDate = yesterday;
      newStreak += 1; // Streak korunur ve devam eder
    } else {
      // Freeze yok veya 2+ gun atlanmis, streak sifirlanir
      newStreak = 1;
    }
  }

  const updatedProgress: UserProgress = {
    ...progress,
    lastViewedDate: today,
    viewedIdiomIds: [...new Set([...progress.viewedIdiomIds, idiomId])],
    streak: newStreak,
    totalIdiomsLearned: new Set([...progress.viewedIdiomIds, idiomId]).size,
    streakFreezeCount: freezeCount,
    streakFreezeUsedDate: freezeUsedDate,
  };

  await saveUserProgress(updatedProgress);
  return updatedProgress;
};

// ─── Learned Words ───────────────────────────────────────

export const addLearnedWord = async (word: ContentItem): Promise<void> => {
  const progress = await getUserProgress();
  const today = new Date().toISOString().split('T')[0];

  // Kelime zaten varsa tekrar ekleme
  const exists = progress.learnedWords?.some(w => w.word.id === word.id);
  if (exists) return;

  const learnedWord: LearnedWord = {
    word,
    learnedDate: today,
    isFavorite: false,
  };

  const updatedProgress: UserProgress = {
    ...progress,
    learnedWords: [...(progress.learnedWords || []), learnedWord],
  };

  await saveUserProgress(updatedProgress);

  // Kelime ogrenildiginde SRS kaydini da baslat
  await initSRSForWord(word.id);
};

export const getLearnedWords = async (): Promise<LearnedWord[]> => {
  const progress = await getUserProgress();
  return progress.learnedWords || [];
};

// ─── Favorites ───────────────────────────────────────────

export const toggleFavorite = async (wordId: string): Promise<boolean> => {
  const progress = await getUserProgress();
  const favorites = progress.favorites || [];
  
  let newFavorites: string[];
  let isFav: boolean;
  
  if (favorites.includes(wordId)) {
    newFavorites = favorites.filter(id => id !== wordId);
    isFav = false;
  } else {
    newFavorites = [...favorites, wordId];
    isFav = true;
  }

  // Also update learnedWords
  const updatedLearnedWords = (progress.learnedWords || []).map(w => 
    w.word.id === wordId ? { ...w, isFavorite: isFav } : w
  );

  await saveUserProgress({
    ...progress,
    favorites: newFavorites,
    learnedWords: updatedLearnedWords,
  });

  return isFav;
};

export const isFavorite = async (wordId: string): Promise<boolean> => {
  const progress = await getUserProgress();
  return (progress.favorites || []).includes(wordId);
};

// ─── Language Preferences ────────────────────────────────

export const getLanguagePreferences = async (): Promise<LanguagePreferences | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE_PREFERENCES);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const saveLanguagePreferences = async (preferences: LanguagePreferences): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};

// Kullanici adini getir
export const getUserName = async (): Promise<string> => {
  try {
    const prefs = await getLanguagePreferences();
    return prefs?.userName || '';
  } catch (error) {
    return '';
  }
};

// Kullanici adini kaydet
export const saveUserName = async (name: string): Promise<void> => {
  try {
    const prefs = await getLanguagePreferences();
    if (prefs) {
      await saveLanguagePreferences({ ...prefs, userName: name });
    }
  } catch (error) {
    console.error('Error saving user name:', error);
  }
};

// ─── Spaced Repetition System ────────────────────────────

// Tum SRS verilerini getir
export const getAllSRSData = async (): Promise<SRSData[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SRS_DATA);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

// SRS verilerini kaydet
const saveSRSData = async (srsDataList: SRSData[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SRS_DATA, JSON.stringify(srsDataList));
  } catch (error) {
    console.error('Error saving SRS data:', error);
  }
};

// Yeni kelime icin SRS kaydı olustur (kelime ogrenildiginde cagrilir)
export const initSRSForWord = async (wordId: string): Promise<void> => {
  const allSRS = await getAllSRSData();
  const exists = allSRS.some(s => s.wordId === wordId);
  if (exists) return;

  const newSRS = createSRSData(wordId);
  await saveSRSData([...allSRS, newSRS]);
};

// Tekrar sonrasi SRS verisini guncelle
export const updateWordSRS = async (wordId: string, quality: number): Promise<SRSData | null> => {
  const allSRS = await getAllSRSData();
  const index = allSRS.findIndex(s => s.wordId === wordId);

  if (index === -1) return null;

  const updated = updateSRS(allSRS[index], quality);
  allSRS[index] = updated;
  await saveSRSData(allSRS);
  return updated;
};

// Bugun tekrar edilmesi gereken kelimeleri getir
export const getDueWordsForToday = async (): Promise<SRSData[]> => {
  const allSRS = await getAllSRSData();
  return getDueWords(allSRS);
};

// Belirli bir kelimenin SRS verisini getir
export const getSRSForWord = async (wordId: string): Promise<SRSData | null> => {
  const allSRS = await getAllSRSData();
  return allSRS.find(s => s.wordId === wordId) || null;
};

// ─── Badges (Rozetler) ──────────────────────────────────

export const getEarnedBadges = async (): Promise<EarnedBadge[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EARNED_BADGES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

export const saveEarnedBadges = async (badges: EarnedBadge[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EARNED_BADGES, JSON.stringify(badges));
  } catch (error) {
    console.error('Error saving badges:', error);
  }
};

export const addEarnedBadge = async (badge: EarnedBadge): Promise<void> => {
  const badges = await getEarnedBadges();
  if (badges.some(b => b.badgeId === badge.badgeId)) return;
  badges.push(badge);
  await saveEarnedBadges(badges);
};

// ─── Quiz Count ─────────────────────────────────────────

export const getQuizCount = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_COUNT);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    return 0;
  }
};

export const incrementQuizCount = async (): Promise<number> => {
  const count = await getQuizCount();
  const newCount = count + 1;
  await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_COUNT, String(newCount));
  return newCount;
};

// ─── Notification Settings ───────────────────────────────

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    if (data) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(data) };
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  } catch (error) {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

// ─── XP Sistemi (Genisletilmis) ─────────────────────────

import { XP_VALUES, DAILY_LIMITS, getLevelForXP, calculateStreakBonus } from './xp';
import { LevelInfo } from '../types';

// XP kazan ve kaydet -- seviye, gunluk hedef, spam onleme dahil
export const addXP = async (
  actionType: XPActionType,
  customAmount?: number,
): Promise<{
  totalXP: number;
  dailyXP: number;
  gained: number;
  leveledUp: boolean;
  newLevel?: LevelInfo;
  dailyGoalReached: boolean;
}> => {
  const progress = await getUserProgress();
  const today = new Date().toISOString().split('T')[0];

  // Gunluk sifirlama kontrolu
  let dailyXP = progress.dailyXP || 0;
  let dailyActionCounts = { ...(progress.dailyActionCounts || {}) };
  let dailyGoalStreak = progress.dailyGoalStreak || 0;
  if ((progress.dailyXPDate || '') !== today) {
    dailyXP = 0;
    dailyActionCounts = {};
    // Gunluk hedef streak kontrolu -- dun hedef tamamlanmadiysa sifirla
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if ((progress.dailyXPDate || '') !== yesterday) {
      dailyGoalStreak = 0;
    }
  }

  // Spam onleme -- gunluk limit kontrolu
  const limit = DAILY_LIMITS[actionType];
  if (limit !== undefined) {
    const currentCount = dailyActionCounts[actionType] || 0;
    if (currentCount >= limit) {
      return {
        totalXP: progress.totalXP || 0,
        dailyXP,
        gained: 0,
        leveledUp: false,
        dailyGoalReached: dailyXP >= (progress.dailyXPGoal || 50),
      };
    }
  }

  // Aksiyon sayacini artir
  dailyActionCounts[actionType] = (dailyActionCounts[actionType] || 0) + 1;

  // XP miktarini hesapla
  let amount = customAmount || XP_VALUES[actionType] || 0;

  // Streak bonusu: streak_bonus tipi icin dinamik hesaplama
  if (actionType === 'streak_bonus') {
    amount = calculateStreakBonus(progress.streak);
  }

  // Seviye kontrolu
  const oldLevel = getLevelForXP(progress.totalXP || 0);
  const newTotalXP = (progress.totalXP || 0) + amount;
  const newLevel = getLevelForXP(newTotalXP);
  const leveledUp = newLevel.level > oldLevel.level;
  const newDailyXP = dailyXP + amount;

  // Gunluk hedef kontrolu
  const dailyGoal = progress.dailyXPGoal || 50;
  const wasGoalReached = dailyXP >= dailyGoal;
  const isGoalReached = newDailyXP >= dailyGoal;
  let goalBonusXP = 0;

  // Gunluk hedef ilk kez tamamlandiysa bonus ver
  if (!wasGoalReached && isGoalReached) {
    goalBonusXP = XP_VALUES.daily_goal_reached;
    dailyGoalStreak += 1;
  }

  const totalGained = amount + goalBonusXP;

  // XP history kaydi
  const newEntry: XPEntry = { amount: totalGained, source: actionType, date: today };
  const xpHistory = [...(progress.xpHistory || []), newEntry].slice(-50);

  // Haftalik XP guncelle
  const weeklyXP = { ...(progress.weeklyXP || {}) };
  weeklyXP[today] = (weeklyXP[today] || 0) + totalGained;
  // Son 7 gunu tut
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  for (const date of Object.keys(weeklyXP)) {
    if (date < sevenDaysAgo) delete weeklyXP[date];
  }

  const finalTotalXP = newTotalXP + goalBonusXP;

  const updatedProgress: UserProgress = {
    ...progress,
    totalXP: finalTotalXP,
    dailyXP: newDailyXP + goalBonusXP,
    dailyXPDate: today,
    xpHistory,
    level: newLevel.level,
    dailyGoalStreak,
    weeklyXP,
    dailyActionCounts,
  };

  await saveUserProgress(updatedProgress);

  return {
    totalXP: finalTotalXP,
    dailyXP: updatedProgress.dailyXP,
    gained: totalGained,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    dailyGoalReached: isGoalReached,
  };
};

// Gunluk XP hedefini degistir
export const setDailyXPGoal = async (goal: number): Promise<void> => {
  const progress = await getUserProgress();
  await saveUserProgress({ ...progress, dailyXPGoal: goal as UserProgress['dailyXPGoal'] });
};

// Gunluk XP durumunu getir (seviye bilgisi dahil)
export const getDailyXPStatus = async (): Promise<{
  dailyXP: number;
  dailyGoal: number;
  totalXP: number;
  isGoalReached: boolean;
  level: number;
  levelProgress: number;
  levelInfo: LevelInfo;
  dailyGoalStreak: number;
  weeklyXP: number;
}> => {
  const progress = await getUserProgress();
  const today = new Date().toISOString().split('T')[0];
  const dailyXP = (progress.dailyXPDate || '') === today ? (progress.dailyXP || 0) : 0;
  const dailyGoal = progress.dailyXPGoal || 50;
  const totalXP = progress.totalXP || 0;

  const levelInfo = getLevelForXP(totalXP);
  const { getLevelProgress } = require('./xp');
  const levelProgress = getLevelProgress(totalXP);

  // Haftalik toplam XP
  const weeklyXPTotal = Object.values(progress.weeklyXP || {}).reduce((sum: number, val) => sum + (val as number), 0);

  return {
    dailyXP,
    dailyGoal,
    totalXP,
    isGoalReached: dailyXP >= dailyGoal,
    level: levelInfo.level,
    levelProgress,
    levelInfo,
    dailyGoalStreak: progress.dailyGoalStreak || 0,
    weeklyXP: weeklyXPTotal,
  };
};

// ─── Gunluk Gorevler (Daily Tasks) ──────────────────────

// Varsayilan gunluk gorevler
const createDefaultDailyTasks = (): DailyTask[] => [
  { id: 'learn_word', completed: false, xp: 10 },
  { id: 'discover_meaning', completed: false, xp: 5 },
  { id: 'practice_ai', completed: false, xp: 15 },
];

// Gunluk gorev verisini getir (yeni gun ise sifirla)
export const getDailyTasks = async (): Promise<DailyTasksData> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
    const today = new Date().toISOString().split('T')[0];

    if (data) {
      const parsed: DailyTasksData = JSON.parse(data);
      if (parsed.date === today) {
        return parsed;
      }
      // Yeni gun -- ust uste streak kontrolu
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const consecutiveDays = (parsed.date === yesterday && parsed.allCompleted)
        ? parsed.consecutiveDays
        : 0;

      return {
        date: today,
        tasks: createDefaultDailyTasks(),
        allCompleted: false,
        bonusClaimed: false,
        consecutiveDays,
      };
    }

    return {
      date: today,
      tasks: createDefaultDailyTasks(),
      allCompleted: false,
      bonusClaimed: false,
      consecutiveDays: 0,
    };
  } catch (error) {
    return {
      date: new Date().toISOString().split('T')[0],
      tasks: createDefaultDailyTasks(),
      allCompleted: false,
      bonusClaimed: false,
      consecutiveDays: 0,
    };
  }
};

// Gunluk gorev tamamla
export const completeDailyTask = async (
  taskId: DailyTaskId
): Promise<{ tasksData: DailyTasksData; xpGained: number; allJustCompleted: boolean }> => {
  const tasksData = await getDailyTasks();

  // Zaten tamamlanmis mi kontrol et
  const task = tasksData.tasks.find(t => t.id === taskId);
  if (!task || task.completed) {
    return { tasksData, xpGained: 0, allJustCompleted: false };
  }

  // Gorevi tamamla
  task.completed = true;

  // Tum gorevler tamamlandi mi kontrol et
  const allCompleted = tasksData.tasks.every(t => t.completed);
  const allJustCompleted = allCompleted && !tasksData.allCompleted;

  if (allJustCompleted) {
    tasksData.allCompleted = true;
    tasksData.consecutiveDays += 1;
  }

  // Kaydet
  await AsyncStorage.setItem(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(tasksData));

  return { tasksData, xpGained: task.xp, allJustCompleted };
};

// Bonus XP'yi isle (3/3 tamamladiginda)
export const claimDailyTasksBonus = async (): Promise<number> => {
  const tasksData = await getDailyTasks();

  if (!tasksData.allCompleted || tasksData.bonusClaimed) {
    return 0;
  }

  tasksData.bonusClaimed = true;
  await AsyncStorage.setItem(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(tasksData));

  return 30; // Bonus XP
};

// Ust uste 3/3 gun sayisini getir (rozet kontrolu icin)
export const getDailyTasksStreak = async (): Promise<number> => {
  const tasksData = await getDailyTasks();
  return tasksData.consecutiveDays;
};

// ─── Calm Mode ──────────────────────────────────────────

// Calm mode durumunu getir
export const getCalmMode = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CALM_MODE);
    return data === 'true';
  } catch (error) {
    return false;
  }
};

// Calm mode durumunu kaydet
export const setCalmMode = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CALM_MODE, String(enabled));
  } catch (error) {
    console.error('Error saving calm mode:', error);
  }
};

// ─── Streak Freeze ──────────────────────────────────────

// Streak freeze sayisini getir
export const getStreakFreezeCount = async (): Promise<number> => {
  const progress = await getUserProgress();
  return progress.streakFreezeCount ?? 1;
};

// Streak freeze hakki ekle (ornegin odul olarak, max 2)
export const addStreakFreeze = async (): Promise<number> => {
  const progress = await getUserProgress();
  const newCount = Math.min((progress.streakFreezeCount ?? 0) + 1, 2);
  await saveUserProgress({ ...progress, streakFreezeCount: newCount });
  return newCount;
};

// Streak freeze durumunu getir (UI icin)
export const getStreakFreezeStatus = async (): Promise<{
  count: number;
  lastUsedDate: string;
  isActive: boolean; // Bugun veya dun kullanildi mi
}> => {
  const progress = await getUserProgress();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const usedDate = progress.streakFreezeUsedDate ?? '';
  return {
    count: progress.streakFreezeCount ?? 1,
    lastUsedDate: usedDate,
    isActive: usedDate === today || usedDate === yesterday,
  };
};

// ─── Haftalik Zorluk (Weekly Challenge) ──────────────────

// Haftalik zorluk verisini getir (yeni hafta ise sifirla)
export const getWeeklyChallenge = async (): Promise<WeeklyChallengeData> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_CHALLENGE);
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    if (data) {
      const parsed: WeeklyChallengeData = JSON.parse(data);
      // Ayni hafta mi kontrol et
      if (parsed.weekNumber === currentWeek && parsed.year === currentYear) {
        return parsed;
      }
    }
    // Yeni hafta -- yeni zorluk olustur
    const newChallenge = createWeeklyChallengeData(now);
    await saveWeeklyChallenge(newChallenge);
    return newChallenge;
  } catch (error) {
    const newChallenge = createWeeklyChallengeData(new Date());
    return newChallenge;
  }
};

// Haftalik zorluk verisini kaydet
export const saveWeeklyChallenge = async (data: WeeklyChallengeData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_CHALLENGE, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving weekly challenge:', error);
  }
};

// Haftalik zorluk hedef ilerlemesini guncelle
export const updateWeeklyChallengeGoal = async (
  goalId: string,
  increment: number = 1
): Promise<{ data: WeeklyChallengeData; justCompleted: boolean }> => {
  const data = await getWeeklyChallenge();
  const wasComplete = isWeeklyChallengeComplete(data);
  const updated = updateGoalProgress(data, goalId, increment);
  const nowComplete = isWeeklyChallengeComplete(updated);
  const justCompleted = !wasComplete && nowComplete;

  await saveWeeklyChallenge(updated);
  return { data: updated, justCompleted };
};

// Haftalik zorluk bonus XP'yi talep et
export const claimWeeklyChallengeBonus = async (): Promise<number> => {
  const data = await getWeeklyChallenge();
  if (!isWeeklyChallengeComplete(data) || data.bonusXPClaimed) {
    return 0;
  }
  data.bonusXPClaimed = true;
  data.badgeEarned = true;
  await saveWeeklyChallenge(data);
  return WEEKLY_CHALLENGE_BONUS_XP;
};

// ─── Geri Bildirim Siddeti (Feedback Intensity) ─────────

// Geri bildirim siddetini getir (varsayilan: balanced)
export const getFeedbackIntensity = async (): Promise<FeedbackIntensity> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FEEDBACK_INTENSITY);
    if (data && (data === 'soft' || data === 'balanced' || data === 'strict')) {
      return data as FeedbackIntensity;
    }
    return 'balanced';
  } catch (error) {
    return 'balanced';
  }
};

// Geri bildirim siddetini kaydet
export const setFeedbackIntensity = async (intensity: FeedbackIntensity): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK_INTENSITY, intensity);
  } catch (error) {
    console.error('Error saving feedback intensity:', error);
  }
};

// ─── Reset ───────────────────────────────────────────────

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
