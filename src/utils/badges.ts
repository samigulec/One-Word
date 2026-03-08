import { Badge, EarnedBadge } from '../types';

// Tum rozet tanimlari
export const ALL_BADGES: Badge[] = [
  // Streak rozetleri -- gunluk seri basarimlari
  { id: 'streak_3', name: 'Baslangiç', description: '3 gun ust uste ogrendin', emoji: '\u{1F331}', category: 'streak', requirement: 3 },
  { id: 'streak_7', name: 'Haftalik Seri', description: '7 gun ust uste ogrendin', emoji: '\u{1F525}', category: 'streak', requirement: 7 },
  { id: 'streak_14', name: 'Iki Hafta', description: '14 gun ust uste ogrendin', emoji: '\u{2B50}', category: 'streak', requirement: 14 },
  { id: 'streak_30', name: 'Ay Ustasi', description: '30 gun ust uste ogrendin', emoji: '\u{1F3C6}', category: 'streak', requirement: 30 },
  { id: 'streak_60', name: 'Azimli', description: '60 gun ust uste ogrendin', emoji: '\u{1F48E}', category: 'streak', requirement: 60 },
  { id: 'streak_100', name: 'Yuzer', description: '100 gun ust uste ogrendin', emoji: '\u{1F451}', category: 'streak', requirement: 100 },
  { id: 'streak_365', name: 'Yil Ustasi', description: '365 gun ust uste ogrendin', emoji: '\u{1F30D}', category: 'streak', requirement: 365 },

  // Kelime ogrenme rozetleri
  { id: 'words_1', name: 'Ilk Adim', description: 'Ilk kelimeni ogrendin', emoji: '\u{1F476}', category: 'words', requirement: 1 },
  { id: 'words_10', name: 'Kelime Avcisi', description: '10 kelime ogrendin', emoji: '\u{1F4DA}', category: 'words', requirement: 10 },
  { id: 'words_50', name: 'Kelime Ustasi', description: '50 kelime ogrendin', emoji: '\u{1F393}', category: 'words', requirement: 50 },
  { id: 'words_100', name: 'Centenarian', description: '100 kelime ogrendin', emoji: '\u{1F4AF}', category: 'words', requirement: 100 },
  { id: 'words_200', name: 'Poliglot Yolunda', description: '200 kelime ogrendin', emoji: '\u{1F680}', category: 'words', requirement: 200 },
  { id: 'words_365', name: 'Tam Yil', description: '365 kelime ogrendin', emoji: '\u{1F3C5}', category: 'words', requirement: 365 },

  // Quiz rozetleri
  { id: 'quiz_1', name: 'Ilk Quiz', description: 'Ilk quizini tamamladin', emoji: '\u{1F9E0}', category: 'quiz', requirement: 1 },
  { id: 'quiz_10', name: 'Quiz Sever', description: '10 quiz tamamladin', emoji: '\u{1F4DD}', category: 'quiz', requirement: 10 },
  { id: 'quiz_50', name: 'Quiz Ustasi', description: '50 quiz tamamladin', emoji: '\u{1F3AF}', category: 'quiz', requirement: 50 },
  { id: 'quiz_perfect', name: 'Mukemmel Skor', description: 'Bir quizde tum dogru yanit', emoji: '\u{2728}', category: 'quiz', requirement: 1 },

  // Seviye rozetleri -- CEFR seviyeleri
  { id: 'level_a1', name: 'A1 Baslangic', description: 'A1 seviyesine ulastin', emoji: '\u{1F33F}', category: 'level', requirement: 1 },
  { id: 'level_a2', name: 'A2 Temel', description: 'A2 seviyesine ulastin', emoji: '\u{1F332}', category: 'level', requirement: 2 },
  { id: 'level_b1', name: 'B1 Orta', description: 'B1 seviyesine ulastin', emoji: '\u{26A1}', category: 'level', requirement: 3 },
  { id: 'level_b2', name: 'B2 Ileri Orta', description: 'B2 seviyesine ulastin', emoji: '\u{1F4A5}', category: 'level', requirement: 4 },
  { id: 'level_c1', name: 'C1 Ileri', description: 'C1 seviyesine ulastin', emoji: '\u{1F680}', category: 'level', requirement: 5 },
  { id: 'level_c2', name: 'C2 Usta', description: 'C2 seviyesine ulastin', emoji: '\u{1F451}', category: 'level', requirement: 6 },

  // Ozel rozetler
  { id: 'special_first_fav', name: 'Koleksiyoncu', description: 'Ilk favori kelimeni ekledin', emoji: '\u{2764}\u{FE0F}', category: 'special', requirement: 1 },
  { id: 'special_night_owl', name: 'Gece Kusu', description: 'Gece yarisi sonrasi kelime ogrendin', emoji: '\u{1F989}', category: 'special', requirement: 1 },
  { id: 'special_early_bird', name: 'Erken Kalkan', description: 'Sabah 6 dan once kelime ogrendin', emoji: '\u{1F413}', category: 'special', requirement: 1 },
  { id: 'special_daily_tasks_7', name: 'Gorev Ustasi', description: '7 gun ust uste tum gunluk gorevleri tamamladin', emoji: '\u{1F3C5}', category: 'special', requirement: 7 },
  { id: 'special_daily_tasks_30', name: 'Gorev Efsanesi', description: '30 gun ust uste tum gunluk gorevleri tamamladin', emoji: '\u{1F48E}', category: 'special', requirement: 30 },
];

// Rozet ID'sine gore rozet bul
export const getBadgeById = (id: string): Badge | undefined => {
  return ALL_BADGES.find(b => b.id === id);
};

// Kategoriye gore rozetleri getir
export const getBadgesByCategory = (category: Badge['category']): Badge[] => {
  return ALL_BADGES.filter(b => b.category === category);
};

// Streak bazinda kazanilan yeni rozetleri kontrol et
export const checkStreakBadges = (
  currentStreak: number,
  earnedBadges: EarnedBadge[]
): Badge[] => {
  const earnedIds = new Set(earnedBadges.map(e => e.badgeId));
  const streakBadges = ALL_BADGES.filter(b => b.category === 'streak');

  return streakBadges.filter(
    badge => currentStreak >= badge.requirement && !earnedIds.has(badge.id)
  );
};

// Kelime sayisina gore yeni rozetleri kontrol et
export const checkWordBadges = (
  totalWords: number,
  earnedBadges: EarnedBadge[]
): Badge[] => {
  const earnedIds = new Set(earnedBadges.map(e => e.badgeId));
  const wordBadges = ALL_BADGES.filter(b => b.category === 'words');

  return wordBadges.filter(
    badge => totalWords >= badge.requirement && !earnedIds.has(badge.id)
  );
};

// Quiz sayisina gore yeni rozetleri kontrol et
export const checkQuizBadges = (
  totalQuizzes: number,
  isPerfectScore: boolean,
  earnedBadges: EarnedBadge[]
): Badge[] => {
  const earnedIds = new Set(earnedBadges.map(e => e.badgeId));
  const newBadges: Badge[] = [];

  // Sayi bazli quiz rozetleri
  const quizCountBadges = ALL_BADGES.filter(
    b => b.category === 'quiz' && b.id !== 'quiz_perfect'
  );
  for (const badge of quizCountBadges) {
    if (totalQuizzes >= badge.requirement && !earnedIds.has(badge.id)) {
      newBadges.push(badge);
    }
  }

  // Mukemmel skor rozeti
  if (isPerfectScore && !earnedIds.has('quiz_perfect')) {
    const perfectBadge = ALL_BADGES.find(b => b.id === 'quiz_perfect');
    if (perfectBadge) newBadges.push(perfectBadge);
  }

  return newBadges;
};

// Ozel rozetleri kontrol et
export const checkSpecialBadges = (
  context: {
    hasFavorite?: boolean;
    currentHour?: number;
    dailyTasksStreak?: number;
  },
  earnedBadges: EarnedBadge[]
): Badge[] => {
  const earnedIds = new Set(earnedBadges.map(e => e.badgeId));
  const newBadges: Badge[] = [];

  // Ilk favori rozeti
  if (context.hasFavorite && !earnedIds.has('special_first_fav')) {
    const badge = ALL_BADGES.find(b => b.id === 'special_first_fav');
    if (badge) newBadges.push(badge);
  }

  // Gece kusu (00:00-05:00 arasi)
  if (context.currentHour !== undefined && context.currentHour >= 0 && context.currentHour < 5 && !earnedIds.has('special_night_owl')) {
    const badge = ALL_BADGES.find(b => b.id === 'special_night_owl');
    if (badge) newBadges.push(badge);
  }

  // Erken kalkan (05:00-06:00 arasi)
  if (context.currentHour !== undefined && context.currentHour >= 5 && context.currentHour < 6 && !earnedIds.has('special_early_bird')) {
    const badge = ALL_BADGES.find(b => b.id === 'special_early_bird');
    if (badge) newBadges.push(badge);
  }

  // Gunluk gorev streak rozetleri
  if (context.dailyTasksStreak !== undefined) {
    if (context.dailyTasksStreak >= 7 && !earnedIds.has('special_daily_tasks_7')) {
      const badge = ALL_BADGES.find(b => b.id === 'special_daily_tasks_7');
      if (badge) newBadges.push(badge);
    }
    if (context.dailyTasksStreak >= 30 && !earnedIds.has('special_daily_tasks_30')) {
      const badge = ALL_BADGES.find(b => b.id === 'special_daily_tasks_30');
      if (badge) newBadges.push(badge);
    }
  }

  return newBadges;
};

// Kazanilmis rozet olustur
export const createEarnedBadge = (badgeId: string): EarnedBadge => ({
  badgeId,
  earnedDate: new Date().toISOString().split('T')[0],
});
