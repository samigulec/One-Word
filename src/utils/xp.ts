// XP ve Seviye Sistemi utility fonksiyonlari
// 50 seviyeli level up sistemi, XP hesaplama ve seviye bilgisi

import { LevelInfo, XPActionType } from '../types';

// XP puan tablosu - her aksiyon icin kazanilacak XP miktari
export const XP_VALUES: Record<XPActionType, number> = {
  word_learned: 10,
  meaning_revealed: 5,
  chat_started: 15,
  chat_message_sent: 5,
  quiz_completed: 25,
  quiz_perfect: 50,
  quiz_correct_answer: 5,
  review_completed: 20,
  review_word: 5,
  streak_bonus: 0,           // Dinamik: streak * 2 (max 50)
  daily_goal_reached: 30,
  favorite_added: 5,
  word_shared: 10,
};

// Gunluk tekrar limitleri (spam onleme)
export const DAILY_LIMITS: Partial<Record<XPActionType, number>> = {
  meaning_revealed: 1,
  chat_message_sent: 10,
  word_shared: 3,
  favorite_added: 5,
  review_word: 20,
};

// 50 seviyeli level sistemi
// TODO: Seviye isimleri su an Turkce hardcoded. Ileride ceviri sistemine tasinmali.
// Level titles are currently hardcoded in Turkish. Should be moved to translation system in the future.
export const LEVELS: LevelInfo[] = [
  { level: 1,  title: 'Merakli',        emoji: '\u{1F331}', minXP: 0,     maxXP: 50 },
  { level: 2,  title: 'Baslangic',      emoji: '\u{1F33F}', minXP: 50,    maxXP: 120 },
  { level: 3,  title: 'Ogrenci',        emoji: '\u{1F4D6}', minXP: 120,   maxXP: 200 },
  { level: 4,  title: 'Arastirmaci',    emoji: '\u{1F50D}', minXP: 200,   maxXP: 300 },
  { level: 5,  title: 'Azimli',         emoji: '\u{1F4AA}', minXP: 300,   maxXP: 420 },
  { level: 6,  title: 'Odakli',         emoji: '\u{1F3AF}', minXP: 420,   maxXP: 560 },
  { level: 7,  title: 'Hafta Yildizi',  emoji: '\u{2B50}',  minXP: 560,   maxXP: 720 },
  { level: 8,  title: 'Kelime Avcisi',  emoji: '\u{1F3B9}', minXP: 720,   maxXP: 900 },
  { level: 9,  title: 'Pratikci',       emoji: '\u{1F4AC}', minXP: 900,   maxXP: 1100 },
  { level: 10, title: 'Bilge',          emoji: '\u{1F9D9}', minXP: 1100,  maxXP: 1350 },
  { level: 11, title: 'Dil Gezgini',    emoji: '\u{1F30D}', minXP: 1350,  maxXP: 1650 },
  { level: 12, title: 'Kelime Ustasi',  emoji: '\u{1F3C5}', minXP: 1650,  maxXP: 2000 },
  { level: 13, title: 'Caliskan',       emoji: '\u{1F4DA}', minXP: 2000,  maxXP: 2400 },
  { level: 14, title: 'Kararlı',        emoji: '\u{1F48E}', minXP: 2400,  maxXP: 2850 },
  { level: 15, title: 'Ilham Verici',   emoji: '\u{1F31F}', minXP: 2850,  maxXP: 3350 },
  { level: 16, title: 'Dil Sporcusu',   emoji: '\u{1F3C3}', minXP: 3350,  maxXP: 3900 },
  { level: 17, title: 'Efsane',         emoji: '\u{1F525}', minXP: 3900,  maxXP: 4500 },
  { level: 18, title: 'Akademisyen',    emoji: '\u{1F393}', minXP: 4500,  maxXP: 5200 },
  { level: 19, title: 'Mentor',         emoji: '\u{1F9D1}\u{200D}\u{1F3EB}', minXP: 5200, maxXP: 6000 },
  { level: 20, title: 'Guru',           emoji: '\u{1F9D8}', minXP: 6000,  maxXP: 6900 },
  { level: 21, title: 'Soz Cambazi',    emoji: '\u{1F3A9}', minXP: 6900,  maxXP: 7900 },
  { level: 22, title: 'Dilbilimci',     emoji: '\u{1F52C}', minXP: 7900,  maxXP: 9000 },
  { level: 23, title: 'Cok Dilli',      emoji: '\u{1F5E3}\u{FE0F}', minXP: 9000, maxXP: 10200 },
  { level: 24, title: 'Sefir',          emoji: '\u{1F3F3}\u{FE0F}', minXP: 10200, maxXP: 11500 },
  { level: 25, title: 'Kral',           emoji: '\u{1F451}', minXP: 11500, maxXP: 13000 },
  { level: 26, title: 'Sovalye',        emoji: '\u{2694}\u{FE0F}', minXP: 13000, maxXP: 14600 },
  { level: 27, title: 'Bilgin',         emoji: '\u{1F4DC}', minXP: 14600, maxXP: 16400 },
  { level: 28, title: 'Hakim',          emoji: '\u{2696}\u{FE0F}', minXP: 16400, maxXP: 18400 },
  { level: 29, title: 'Alim',           emoji: '\u{1F9E0}', minXP: 18400, maxXP: 20500 },
  { level: 30, title: 'Usta',           emoji: '\u{1F3C6}', minXP: 20500, maxXP: 22800 },
  { level: 31, title: 'Elci',           emoji: '\u{1F54A}\u{FE0F}', minXP: 22800, maxXP: 25300 },
  { level: 32, title: 'Vizyoner',       emoji: '\u{1F52D}', minXP: 25300, maxXP: 28000 },
  { level: 33, title: 'Stratejist',     emoji: '\u{265F}\u{FE0F}', minXP: 28000, maxXP: 31000 },
  { level: 34, title: 'Filozof',        emoji: '\u{1F3DB}\u{FE0F}', minXP: 31000, maxXP: 34200 },
  { level: 35, title: 'Kahin',          emoji: '\u{1F52E}', minXP: 34200, maxXP: 37700 },
  { level: 36, title: 'Buyucu',         emoji: '\u{1FA84}', minXP: 37700, maxXP: 41500 },
  { level: 37, title: 'Titan',          emoji: '\u{1F30B}', minXP: 41500, maxXP: 45600 },
  { level: 38, title: 'Imparator',      emoji: '\u{1F3F0}', minXP: 45600, maxXP: 50000 },
  { level: 39, title: 'Efsanevi',       emoji: '\u{1F4AB}', minXP: 50000, maxXP: 55000 },
  { level: 40, title: 'Mitolojik',      emoji: '\u{1F409}', minXP: 55000, maxXP: 60500 },
  { level: 41, title: 'Kozmik',         emoji: '\u{1F30C}', minXP: 60500, maxXP: 66500 },
  { level: 42, title: 'Galaktik',       emoji: '\u{1FA90}', minXP: 66500, maxXP: 73000 },
  { level: 43, title: 'Evrensel',       emoji: '\u{2728}', minXP: 73000, maxXP: 80000 },
  { level: 44, title: 'Sonsuz',         emoji: '\u{267E}\u{FE0F}', minXP: 80000, maxXP: 88000 },
  { level: 45, title: 'Tanrisal',       emoji: '\u{1F31E}', minXP: 88000, maxXP: 97000 },
  { level: 46, title: 'Yuce',           emoji: '\u{1F4A0}', minXP: 97000, maxXP: 107000 },
  { level: 47, title: 'Kadim',          emoji: '\u{1F3FA}', minXP: 107000, maxXP: 118000 },
  { level: 48, title: 'Ebedi',          emoji: '\u{1F54B}', minXP: 118000, maxXP: 130000 },
  { level: 49, title: 'Mutlak',         emoji: '\u{1F4A5}', minXP: 130000, maxXP: 145000 },
  { level: 50, title: 'Polyglot Usta',  emoji: '\u{1F680}', minXP: 145000, maxXP: 999999 },
];

// Toplam XP'ye gore mevcut seviyeyi getir
export const getLevelForXP = (totalXP: number): LevelInfo => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
};

// Bir sonraki seviyeye ilerleme yuzdesi (0-1)
export const getLevelProgress = (totalXP: number): number => {
  const current = getLevelForXP(totalXP);
  if (current.level === 50) return 1;
  const range = current.maxXP - current.minXP;
  const progress = totalXP - current.minXP;
  return Math.min(1, progress / range);
};

// Streak bonusu hesapla: streak * 2, max 50
export const calculateStreakBonus = (streak: number): number => {
  return Math.min(streak * 2, 50);
};

// Hafta numarasi hesapla (deterministik seed icin)
export const getWeekNumber = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 604800000;
  return Math.floor(diff / oneWeek) + 1;
};

// Haftanin baslangic tarihini getir (Pazartesi)
export const getWeekStart = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};
