// Haftalik Zorluk Sistemi
// Her hafta farkli bir kategori temasi, hedefler ve bonus oduller

import { WeeklyChallengeData, WeeklyChallengeGoal } from '../types';
import { CATEGORY_ICONS } from './categoryIcons';
import { getWeekNumber } from './xp';

// Haftalik tema kategorileri ve basliklar
interface WeeklyTheme {
  category: string;
  titleTR: string;        // Turkce baslik
  titleEN: string;        // Ingilizce baslik
  emoji: string;
}

// 12 haftalik dongu -- kategori sistemiyle uyumlu
const WEEKLY_THEMES: WeeklyTheme[] = [
  { category: 'greetings', titleTR: 'Selamlasmalar Haftasi', titleEN: 'Greetings Week', emoji: '\u{1F44B}' },
  { category: 'food_drink', titleTR: 'Yemek Haftasi', titleEN: 'Food Week', emoji: '\u{1F355}' },
  { category: 'travel', titleTR: 'Seyahat Haftasi', titleEN: 'Travel Week', emoji: '\u{2708}\u{FE0F}' },
  { category: 'emotions', titleTR: 'Duygular Haftasi', titleEN: 'Emotions Week', emoji: '\u{1F60A}' },
  { category: 'nature', titleTR: 'Doga Haftasi', titleEN: 'Nature Week', emoji: '\u{1F33F}' },
  { category: 'technology', titleTR: 'Teknoloji Haftasi', titleEN: 'Tech Week', emoji: '\u{1F4BB}' },
  { category: 'work_business', titleTR: 'Is Haftasi', titleEN: 'Business Week', emoji: '\u{1F4BC}' },
  { category: 'health', titleTR: 'Saglik Haftasi', titleEN: 'Health Week', emoji: '\u{2764}\u{FE0F}' },
  { category: 'education', titleTR: 'Egitim Haftasi', titleEN: 'Education Week', emoji: '\u{1F4DA}' },
  { category: 'daily_life', titleTR: 'Gunluk Yasam Haftasi', titleEN: 'Daily Life Week', emoji: '\u{1F3E0}' },
  { category: 'culture', titleTR: 'Kultur Haftasi', titleEN: 'Culture Week', emoji: '\u{1F3AD}' },
  { category: 'sports', titleTR: 'Spor Haftasi', titleEN: 'Sports Week', emoji: '\u{26BD}' },
];

// Hafta numarasina gore tema getir (12'lik dongu)
export const getWeeklyTheme = (date: Date = new Date()): WeeklyTheme => {
  const weekNum = getWeekNumber(date);
  const themeIndex = (weekNum - 1) % WEEKLY_THEMES.length;
  return WEEKLY_THEMES[themeIndex];
};

// Varsayilan haftalik hedefler olustur
const createDefaultGoals = (): WeeklyChallengeGoal[] => [
  {
    id: 'learn_words',
    description: 'Bu kategoriden 5 kelime ogren',
    target: 5,
    current: 0,
    completed: false,
  },
  {
    id: 'complete_quizzes',
    description: '3 quiz tamamla',
    target: 3,
    current: 0,
    completed: false,
  },
  {
    id: 'ai_practice',
    description: 'AI ile 2 pratik yap',
    target: 2,
    current: 0,
    completed: false,
  },
];

// Yeni haftalik zorluk verisi olustur
export const createWeeklyChallengeData = (date: Date = new Date()): WeeklyChallengeData => {
  const theme = getWeeklyTheme(date);
  const weekNum = getWeekNumber(date);
  const year = date.getFullYear();

  // Hafta baslangic tarihini hesapla (Pazartesi)
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const startDate = d.toISOString().split('T')[0];

  return {
    weekNumber: weekNum,
    year,
    categoryTheme: theme.category,
    categoryEmoji: theme.emoji,
    themeTitle: theme.titleEN,
    goals: createDefaultGoals(),
    bonusXPClaimed: false,
    badgeEarned: false,
    startDate,
  };
};

// Haftalik zorluk tamamlandi mi kontrol et
export const isWeeklyChallengeComplete = (data: WeeklyChallengeData): boolean => {
  return data.goals.every(g => g.completed);
};

// Hedef ilerleme guncelle
export const updateGoalProgress = (
  data: WeeklyChallengeData,
  goalId: string,
  increment: number = 1
): WeeklyChallengeData => {
  const updatedGoals = data.goals.map(goal => {
    if (goal.id !== goalId) return goal;
    const newCurrent = Math.min(goal.current + increment, goal.target);
    return {
      ...goal,
      current: newCurrent,
      completed: newCurrent >= goal.target,
    };
  });

  return {
    ...data,
    goals: updatedGoals,
  };
};

// Haftalik zorluk bonus XP miktari
export const WEEKLY_CHALLENGE_BONUS_XP = 100;

// Haftalik zorluk rozet ID'si (hafta bazli)
export const getWeeklyBadgeId = (weekNumber: number, year: number): string => {
  return `weekly_${year}_w${weekNumber}`;
};

// Haftalik ilerleme yuzdesi (0-100)
export const getWeeklyChallengeProgress = (data: WeeklyChallengeData): number => {
  if (data.goals.length === 0) return 0;
  const totalProgress = data.goals.reduce((sum, goal) => {
    return sum + Math.min(goal.current / goal.target, 1);
  }, 0);
  return Math.round((totalProgress / data.goals.length) * 100);
};
