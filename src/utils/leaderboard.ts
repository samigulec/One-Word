import { LeaderboardEntry, LeaderboardData, LeagueType } from '../types';
import { getUserProgress } from './storage';
import { getLanguagePreferences } from './storage';
import { getLevelForXP, getWeekNumber, getWeekStart } from './xp';

// 30 mock oyuncu -- deterministik haftalik seed ile
const MOCK_NAMES = [
  'Ayse', 'Mehmet', 'Elena', 'Carlos', 'Yuki', 'Hans', 'Sophie', 'Marco', 'Lina', 'Ali',
  'Emma', 'Liam', 'Sofia', 'Noah', 'Olivia', 'Fatima', 'Leo', 'Ava', 'Kai', 'Luna',
  'Amir', 'Zara', 'Min-jun', 'Isabella', 'Aarav', 'Chloe', 'Mateo', 'Mia', 'Chen',
];

const MOCK_AVATARS = [
  '\u{1F469}', '\u{1F468}', '\u{1F469}\u{200D}\u{1F393}', '\u{1F468}\u{200D}\u{1F4BB}',
  '\u{1F467}', '\u{1F474}', '\u{1F469}\u{200D}\u{1F3A8}', '\u{1F468}\u{200D}\u{1F373}',
  '\u{1F476}', '\u{1F466}', '\u{1F9D1}\u{200D}\u{1F4BB}', '\u{1F468}\u{200D}\u{1F3A8}',
  '\u{1F9D1}\u{200D}\u{1F52C}', '\u{1F477}', '\u{1F9D9}', '\u{1F9D1}\u{200D}\u{1F680}',
  '\u{1F468}\u{200D}\u{2695}\u{FE0F}', '\u{1F9D1}\u{200D}\u{1F3EB}', '\u{1F471}', '\u{1F475}',
  '\u{1F9D4}', '\u{1F470}', '\u{1F468}\u{200D}\u{1F527}', '\u{1F469}\u{200D}\u{1F52C}',
  '\u{1F468}\u{200D}\u{1F3A4}', '\u{1F9D1}\u{200D}\u{1F37C}', '\u{1F469}\u{200D}\u{1F4BC}',
  '\u{1F468}\u{200D}\u{1F680}', '\u{1F9D1}\u{200D}\u{1F3A8}',
];

// Lig tanimlari
export const LEAGUES: Record<LeagueType, { name: string; emoji: string; color: string; gradient: [string, string] }> = {
  bronze:  { name: 'Bronz Lig',   emoji: '\u{1F949}', color: '#CD7F32', gradient: ['#CD7F32', '#A0522D'] },
  silver:  { name: 'Gumus Lig',   emoji: '\u{1F948}', color: '#C0C0C0', gradient: ['#C0C0C0', '#A9A9A9'] },
  gold:    { name: 'Altin Lig',   emoji: '\u{1F947}', color: '#FFD700', gradient: ['#FFD700', '#FFA500'] },
  diamond: { name: 'Elmas Lig',   emoji: '\u{1F48E}', color: '#B9F2FF', gradient: ['#B9F2FF', '#00BFFF'] },
};

// Deterministik pseudo-random sayi ureteci (seed bazli)
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

// Siralamaya gore lig belirle
export const getLeagueForRank = (rank: number, total: number): LeagueType => {
  const percentile = rank / total;
  if (percentile <= 0.1) return 'diamond';    // Ilk %10
  if (percentile <= 0.3) return 'gold';       // Ilk %30
  if (percentile <= 0.6) return 'silver';     // Ilk %60
  return 'bronze';
};

// Mock oyunculari deterministik sekilde olustur (hafta bazli tutarli)
const generateMockPlayers = (weekSeed: number): Omit<LeaderboardEntry, 'isCurrentUser'>[] => {
  return MOCK_NAMES.map((name, i) => {
    const rand = seededRandom(weekSeed + i * 37);
    const baseXP = Math.floor(rand * 250) + 30;
    const streak = Math.floor(seededRandom(weekSeed + i * 13) * 35);
    const wordsLearned = Math.floor(seededRandom(weekSeed + i * 23) * 200) + 10;
    const totalXP = baseXP * 10 + Math.floor(rand * 2000);
    const level = getLevelForXP(totalXP).level;

    return {
      id: `mock_${i}`,
      name,
      xp: baseXP,
      streak,
      wordsLearned,
      avatar: MOCK_AVATARS[i % MOCK_AVATARS.length],
      level,
    };
  });
};

// Tum zamanlar liderlik tablosu
export const getLeaderboard = async (): Promise<LeaderboardData> => {
  const progress = await getUserProgress();
  const prefs = await getLanguagePreferences();
  const userName = prefs?.userName || 'Sen';
  const weekSeed = getWeekNumber(new Date());

  const mockPlayers = generateMockPlayers(weekSeed);

  // Mock oyuncularin toplam XP'si (haftalik degil)
  const allTimeMocks: LeaderboardEntry[] = mockPlayers.map(p => ({
    ...p,
    isCurrentUser: false,
    xp: p.xp * 10 + Math.floor(seededRandom(weekSeed + parseInt(p.id.split('_')[1]) * 7) * 2000),
  }));

  const currentUser: LeaderboardEntry = {
    id: 'current_user',
    name: userName,
    xp: progress.totalXP || 0,
    streak: progress.streak,
    wordsLearned: (progress.learnedWords || []).length,
    isCurrentUser: true,
    avatar: '\u{1F451}',
    level: progress.level || 1,
  };

  const allPlayers = [...allTimeMocks, currentUser]
    .sort((a, b) => b.xp - a.xp)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  const userRank = allPlayers.find(e => e.isCurrentUser)?.rank || allPlayers.length;
  const league = getLeagueForRank(userRank, allPlayers.length);

  return {
    entries: allPlayers,
    currentUserRank: userRank,
    totalParticipants: allPlayers.length,
    weekStart: getWeekStart(),
    league,
  };
};

// Haftalik liderlik tablosu (deterministik seed ile)
export const getWeeklyLeaderboard = async (): Promise<LeaderboardData> => {
  const progress = await getUserProgress();
  const prefs = await getLanguagePreferences();
  const userName = prefs?.userName || 'Sen';
  const weekSeed = getWeekNumber(new Date());

  const mockPlayers = generateMockPlayers(weekSeed);

  const weeklyMocks: LeaderboardEntry[] = mockPlayers.map(p => ({
    ...p,
    isCurrentUser: false,
  }));

  // Kullanicinin haftalik XP'si
  const weeklyXPTotal = Object.values(progress.weeklyXP || {}).reduce((sum: number, val) => sum + (val as number), 0);

  const currentUser: LeaderboardEntry = {
    id: 'current_user',
    name: userName,
    xp: weeklyXPTotal,
    streak: progress.streak,
    wordsLearned: (progress.learnedWords || []).length,
    isCurrentUser: true,
    avatar: '\u{1F451}',
    level: progress.level || 1,
  };

  const allPlayers = [...weeklyMocks, currentUser]
    .sort((a, b) => b.xp - a.xp)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  const userRank = allPlayers.find(e => e.isCurrentUser)?.rank || allPlayers.length;
  const league = getLeagueForRank(userRank, allPlayers.length);

  return {
    entries: allPlayers,
    currentUserRank: userRank,
    totalParticipants: allPlayers.length,
    weekStart: getWeekStart(),
    league,
  };
};
