// guessGameHelpers.ts -- Gunun Tahmini mini oyunu icin yardimci fonksiyonlar
// Geri donulebilir: Bu dosya silinirse oyun devre disi kalir, mevcut koda etkisi yoktur.

import { ContentItem } from '../types';
import { LanguageCode } from './translations';

/** Ipucu seviyesine gore XP odul miktari */
export const GUESS_XP_REWARDS: Record<1 | 2 | 3, number> = {
  1: 30, // Ilk ipucuda bildi -- Dahice!
  2: 20, // Ikinci ipucuda bildi -- Harika!
  3: 10, // Ucuncu ipucuda bildi -- Guzel!
};

/** Ipucu seviyesine gore kutlama mesaji ceviri anahtarlari */
export const GUESS_RESULT_KEYS: Record<0 | 1 | 2 | 3, string> = {
  1: 'guessResultGenius',   // Dahice!
  2: 'guessResultGreat',    // Harika!
  3: 'guessResultNice',     // Guzel!
  0: 'guessResultMissed',   // Kelimeyi ogrenmek de guzel!
};

/** Yilin basindan bu yana kac gun gectigini hesapla (deterministik gun numarasi) */
export const getDayNumber = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * Kelime icin 3 ipucu olustur:
 * 1. Kategori
 * 2. Harf sayisi
 * 3. Ilk harf
 */
export const generateHints = (
  word: ContentItem,
  nativeLanguage: LanguageCode,
): string[] => {
  const targetWord = word.target_word;
  const category = word.category || '?';

  // Ipucu 1: Kategori (varsa emoji ile)
  const hint1Category = word.emoji
    ? `${word.emoji} ${category}`
    : category;

  // Ipucu 2: Harf sayisi
  const letterCount = targetWord.replace(/\s/g, '').length;

  // Ipucu 3: Ilk harf
  const firstLetter = targetWord.charAt(0).toUpperCase();

  return [
    hint1Category,
    String(letterCount),
    firstLetter,
  ];
};

/**
 * Kullanicinin tahminini dogru cevapla karsilastir.
 * Case-insensitive, bosluk/tire toleransli.
 */
export const checkGuess = (guess: string, targetWord: string): boolean => {
  const normalize = (s: string): string =>
    s.trim().toLowerCase()
      .replace(/[\s\-_]+/g, '')   // Bosluk, tire, alt cizgi kaldir
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Aksanlari kaldir

  return normalize(guess) === normalize(targetWord);
};

/**
 * Wordle tarzi paylasim metni olustur.
 * Ornek: "One Word #42 [yeşil kare] 1/3"
 */
export const createShareText = (
  dayNumber: number,
  guessedAtHint: 0 | 1 | 2 | 3,
): string => {
  const greenSquare = '\u{1F7E9}';   // yesil kare
  const blackSquare = '\u{2B1B}';    // siyah kare
  const redX = '\u{274C}';           // kirmizi x

  let squares = '';
  if (guessedAtHint === 0) {
    // Bilemedi
    squares = `${blackSquare}${blackSquare}${blackSquare} ${redX}`;
  } else {
    // Bildi -- bilene kadar siyah, sonra yesil
    for (let i = 1; i <= 3; i++) {
      if (i < guessedAtHint) squares += blackSquare;
      else if (i === guessedAtHint) squares += greenSquare;
    }
    squares += ` ${guessedAtHint}/3`;
  }

  return `One Word #${dayNumber} ${squares}\n\nonewordapp.com`;
};
