import { LeaderboardEntry, LeaderboardData, LeagueType } from '../types';
import { getUserProgress } from './storage';
import { getLanguagePreferences } from './storage';
import { getLevelForXP, getWeekNumber, getWeekStart } from './xp';

// Gercekci isim + ulke bayrak listesi (tutarlilik icin sabit)
const MOCK_PLAYERS_DATA: { name: string; flag: string }[] = [
  { name: 'Ayse',     flag: '\u{1F1F9}\u{1F1F7}' },  // Turkiye
  { name: 'Mehmet',   flag: '\u{1F1F9}\u{1F1F7}' },  // Turkiye
  { name: 'Elena',    flag: '\u{1F1EA}\u{1F1F8}' },  // Ispanya
  { name: 'Carlos',   flag: '\u{1F1F2}\u{1F1FD}' },  // Meksika
  { name: 'Yuki',     flag: '\u{1F1EF}\u{1F1F5}' },  // Japonya
  { name: 'Hans',     flag: '\u{1F1E9}\u{1F1EA}' },  // Almanya
  { name: 'Sophie',   flag: '\u{1F1EB}\u{1F1F7}' },  // Fransa
  { name: 'Marco',    flag: '\u{1F1EE}\u{1F1F9}' },  // Italya
  { name: 'Lina',     flag: '\u{1F1F8}\u{1F1EA}' },  // Isvec
  { name: 'Ali',      flag: '\u{1F1F8}\u{1F1E6}' },  // Suudi Arabistan
  { name: 'Emma',     flag: '\u{1F1EC}\u{1F1E7}' },  // Ingiltere
  { name: 'Liam',     flag: '\u{1F1EE}\u{1F1EA}' },  // Irlanda
  { name: 'Sofia',    flag: '\u{1F1E7}\u{1F1F7}' },  // Brezilya
  { name: 'Noah',     flag: '\u{1F1FA}\u{1F1F8}' },  // ABD
  { name: 'Olivia',   flag: '\u{1F1E8}\u{1F1E6}' },  // Kanada
  { name: 'Fatima',   flag: '\u{1F1F2}\u{1F1E6}' },  // Fas
  { name: 'Leo',      flag: '\u{1F1E6}\u{1F1F7}' },  // Arjantin
  { name: 'Ava',      flag: '\u{1F1E6}\u{1F1FA}' },  // Avustralya
  { name: 'Kai',      flag: '\u{1F1F0}\u{1F1F7}' },  // Guney Kore
  { name: 'Luna',     flag: '\u{1F1F5}\u{1F1F9}' },  // Portekiz
  { name: 'Amir',     flag: '\u{1F1EE}\u{1F1F7}' },  // Iran
  { name: 'Zara',     flag: '\u{1F1F5}\u{1F1F0}' },  // Pakistan
  { name: 'Min-jun',  flag: '\u{1F1F0}\u{1F1F7}' },  // Guney Kore
  { name: 'Isabella', flag: '\u{1F1EE}\u{1F1F9}' },  // Italya
  { name: 'Aarav',    flag: '\u{1F1EE}\u{1F1F3}' },  // Hindistan
  { name: 'Chloe',    flag: '\u{1F1EB}\u{1F1F7}' },  // Fransa
  { name: 'Mateo',    flag: '\u{1F1E8}\u{1F1F1}' },  // Sili
  { name: 'Mia',      flag: '\u{1F1F3}\u{1F1F1}' },  // Hollanda
  { name: 'Chen',     flag: '\u{1F1E8}\u{1F1F3}' },  // Cin
];

// Avatar emojileri
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

// Deterministik pseudo-random sayi ureteci (seed bazli, tutarli sonuclar icin)
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

/**
 * Gunluk seed ureteci.
 * Her gun ayni seed'i dondurur, boylece ayni gun icinde
 * isimler ve XP degerleri degismez.
 */
const getDailySeed = (): number => {
  const now = new Date();
  // Yil * 1000 + gunSayisi seklinde benzersiz gunluk deger
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return now.getFullYear() * 1000 + dayOfYear;
};

// Siralamaya gore lig belirle
export const getLeagueForRank = (rank: number, total: number): LeagueType => {
  const percentile = rank / total;
  if (percentile <= 0.1) return 'diamond';
  if (percentile <= 0.3) return 'gold';
  if (percentile <= 0.6) return 'silver';
  return 'bronze';
};

/**
 * Kullanicinin XP'sine gore gercekci mock oyuncular uretir.
 * - Kullaniciyi 4-7. siralarda tutar (motivasyon icin)
 * - XP degerleri kullaniciya yakin olur
 * - Gunluk seed sayesinde ayni gun icinde tutarli sonuc verir
 */
const generateAdaptiveMockPlayers = (
  userXP: number,
  dailySeed: number,
  mode: 'alltime' | 'weekly',
): Omit<LeaderboardEntry, 'isCurrentUser'>[] => {
  // Kullanici XP'si 0 ise minimum referans deger kullan
  const referenceXP = Math.max(userXP, 50);

  // Toplam oyuncu sayisi (14 kisi daha gercekci)
  const playerCount = 14;

  // Secilecek oyuncularin indexlerini gunluk seed ile belirle
  // Boylece her gun farkli ama gun icinde tutarli oyuncular cikar
  const selectedIndices: number[] = [];
  for (let i = 0; i < playerCount; i++) {
    // Seed ile karistirarak index sec
    const idx = Math.floor(seededRandom(dailySeed + i * 73 + (mode === 'weekly' ? 5000 : 0)) * MOCK_PLAYERS_DATA.length);
    // Benzersiz indexler sec (cakisma olursa siradaki al)
    let finalIdx = idx;
    while (selectedIndices.includes(finalIdx)) {
      finalIdx = (finalIdx + 1) % MOCK_PLAYERS_DATA.length;
    }
    selectedIndices.push(finalIdx);
  }

  // Hedef: kullanici 4-7. siralarda olsun
  // Yani 3-6 kisi kullanicidan yuksek, gerisi dusuk olmali
  const aboveUserCount = 3 + Math.floor(seededRandom(dailySeed + 999) * 4); // 3-6 kisi ustte

  return selectedIndices.map((playerIdx, i) => {
    const player = MOCK_PLAYERS_DATA[playerIdx];
    const rand = seededRandom(dailySeed + i * 37 + playerIdx * 11);
    const rand2 = seededRandom(dailySeed + i * 53 + playerIdx * 17);

    let xp: number;

    if (i < aboveUserCount) {
      // Kullanicidan yuksek XP (referansXP'nin %105-%180 arasi)
      const multiplier = 1.05 + rand * 0.75;
      xp = Math.floor(referenceXP * multiplier);
    } else {
      // Kullanicidan dusuk XP (referansXP'nin %20-%95 arasi)
      const multiplier = 0.20 + rand * 0.75;
      xp = Math.floor(referenceXP * multiplier);
    }

    // XP'nin sifirin altina dusmemesi icin
    xp = Math.max(xp, Math.floor(rand * 30) + 5);

    // Streak ve kelime sayisi
    const streak = Math.floor(rand2 * 45);
    const wordsLearned = Math.floor(seededRandom(dailySeed + i * 23 + playerIdx) * 200) + 10;

    // Seviye hesapla
    const totalXPForLevel = mode === 'alltime' ? xp : xp * 8 + Math.floor(rand * 1500);
    const level = getLevelForXP(totalXPForLevel).level;

    return {
      id: `mock_${playerIdx}`,
      name: `${player.flag} ${player.name}`,
      xp,
      streak,
      wordsLearned,
      avatar: MOCK_AVATARS[playerIdx % MOCK_AVATARS.length],
      level,
    };
  });
};

// Tum zamanlar liderlik tablosu
export const getLeaderboard = async (): Promise<LeaderboardData> => {
  const progress = await getUserProgress();
  const prefs = await getLanguagePreferences();
  const userName = prefs?.userName || 'Sen';
  const dailySeed = getDailySeed();

  const userTotalXP = progress.totalXP || 0;
  const mockPlayers = generateAdaptiveMockPlayers(userTotalXP, dailySeed, 'alltime');

  const allTimeMocks: LeaderboardEntry[] = mockPlayers.map(p => ({
    ...p,
    isCurrentUser: false,
  }));

  const currentUser: LeaderboardEntry = {
    id: 'current_user',
    name: userName,
    xp: userTotalXP,
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

// Haftalik liderlik tablosu (gunluk seed ile tutarli)
export const getWeeklyLeaderboard = async (): Promise<LeaderboardData> => {
  const progress = await getUserProgress();
  const prefs = await getLanguagePreferences();
  const userName = prefs?.userName || 'Sen';
  const dailySeed = getDailySeed();

  // Kullanicinin haftalik XP'si
  const weeklyXPTotal = Object.values(progress.weeklyXP || {}).reduce(
    (sum: number, val) => sum + (val as number), 0
  );

  const mockPlayers = generateAdaptiveMockPlayers(weeklyXPTotal, dailySeed, 'weekly');

  const weeklyMocks: LeaderboardEntry[] = mockPlayers.map(p => ({
    ...p,
    isCurrentUser: false,
  }));

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
