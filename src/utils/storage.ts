import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress, LanguagePreferences, ContentItem, LearnedWord, Achievement } from '../types';

const STORAGE_KEYS = {
  USER_PROGRESS: '@daily_idiom_progress',
  LANGUAGE_PREFERENCES: '@language_preferences',
};

const defaultProgress: UserProgress = {
  lastViewedDate: '',
  viewedIdiomIds: [],
  streak: 0,
  totalIdiomsLearned: 0,
  learnedWords: [],
  favorites: [],
  xp: 0,
  quizCorrect: 0,
  quizTotal: 0,
  achievements: [],
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

  if (progress.lastViewedDate === today) {
    return progress;
  } else if (progress.lastViewedDate === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const updatedProgress: UserProgress = {
    ...progress,
    lastViewedDate: today,
    viewedIdiomIds: [...new Set([...progress.viewedIdiomIds, idiomId])],
    streak: newStreak,
    totalIdiomsLearned: new Set([...progress.viewedIdiomIds, idiomId]).size,
  };

  await saveUserProgress(updatedProgress);
  return updatedProgress;
};

// ─── Learned Words ───────────────────────────────────────

export const addLearnedWord = async (word: ContentItem): Promise<void> => {
  const progress = await getUserProgress();
  const today = new Date().toISOString().split('T')[0];
  
  // Check if word already exists
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

// ─── XP System ──────────────────────────────────────────

export const XP_REWARDS = {
  DAILY_WORD: 10,
  QUIZ_CORRECT: 20,
  QUIZ_WRONG: 5,
  STREAK_BONUS_MULTIPLIER: 0.1, // 10% bonus per streak day, max 100%
};

export const addXP = async (baseXP: number): Promise<{ newXP: number; totalXP: number }> => {
  const progress = await getUserProgress();
  const streakBonus = Math.min(progress.streak * XP_REWARDS.STREAK_BONUS_MULTIPLIER, 1);
  const newXP = Math.round(baseXP * (1 + streakBonus));
  const totalXP = (progress.xp || 0) + newXP;

  await saveUserProgress({ ...progress, xp: totalXP });
  return { newXP, totalXP };
};

export const recordQuizResult = async (correct: boolean): Promise<UserProgress> => {
  const progress = await getUserProgress();
  const xpEarned = correct ? XP_REWARDS.QUIZ_CORRECT : XP_REWARDS.QUIZ_WRONG;
  const streakBonus = Math.min(progress.streak * XP_REWARDS.STREAK_BONUS_MULTIPLIER, 1);
  const newXP = Math.round(xpEarned * (1 + streakBonus));

  const updated: UserProgress = {
    ...progress,
    xp: (progress.xp || 0) + newXP,
    quizCorrect: (progress.quizCorrect || 0) + (correct ? 1 : 0),
    quizTotal: (progress.quizTotal || 0) + 1,
  };

  await saveUserProgress(updated);
  return updated;
};

// ─── Achievements ───────────────────────────────────────

export interface AchievementDef {
  id: string;
  emoji: string;
  check: (progress: UserProgress) => boolean;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'first_word', emoji: '\u{1F331}', check: (p) => p.totalIdiomsLearned >= 1 },
  { id: 'streak_3', emoji: '\u{1F525}', check: (p) => p.streak >= 3 },
  { id: 'streak_7', emoji: '\u2B50', check: (p) => p.streak >= 7 },
  { id: 'streak_14', emoji: '\u{1F31F}', check: (p) => p.streak >= 14 },
  { id: 'streak_30', emoji: '\u{1F3C6}', check: (p) => p.streak >= 30 },
  { id: 'streak_100', emoji: '\u{1F451}', check: (p) => p.streak >= 100 },
  { id: 'words_10', emoji: '\u{1F4DA}', check: (p) => p.totalIdiomsLearned >= 10 },
  { id: 'words_25', emoji: '\u{1F4D6}', check: (p) => p.totalIdiomsLearned >= 25 },
  { id: 'words_50', emoji: '\u{1F393}', check: (p) => p.totalIdiomsLearned >= 50 },
  { id: 'words_100', emoji: '\u{1F48E}', check: (p) => p.totalIdiomsLearned >= 100 },
  { id: 'quiz_5', emoji: '\u{1F9E0}', check: (p) => (p.quizCorrect || 0) >= 5 },
  { id: 'quiz_25', emoji: '\u{1F3AF}', check: (p) => (p.quizCorrect || 0) >= 25 },
  { id: 'quiz_perfect_10', emoji: '\u{1F947}', check: (p) => (p.quizCorrect || 0) >= 10 && (p.quizTotal || 0) > 0 && (p.quizCorrect || 0) / (p.quizTotal || 1) >= 0.9 },
  { id: 'xp_100', emoji: '\u{1F4B0}', check: (p) => (p.xp || 0) >= 100 },
  { id: 'xp_500', emoji: '\u{1F48E}', check: (p) => (p.xp || 0) >= 500 },
  { id: 'xp_1000', emoji: '\u{1F680}', check: (p) => (p.xp || 0) >= 1000 },
  { id: 'favorites_5', emoji: '\u2764\uFE0F', check: (p) => (p.favorites || []).length >= 5 },
];

export const checkAndUnlockAchievements = async (): Promise<Achievement[]> => {
  const progress = await getUserProgress();
  const existing = (progress.achievements || []).map(a => a.id);
  const newAchievements: Achievement[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const def of ACHIEVEMENT_DEFS) {
    if (!existing.includes(def.id) && def.check(progress)) {
      newAchievements.push({ id: def.id, unlockedAt: today });
    }
  }

  if (newAchievements.length > 0) {
    await saveUserProgress({
      ...progress,
      achievements: [...(progress.achievements || []), ...newAchievements],
    });
  }

  return newAchievements;
};

// ─── Reset ───────────────────────────────────────────────

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
