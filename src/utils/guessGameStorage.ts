// guessGameStorage.ts -- Gunun Tahmini mini oyunu icin AsyncStorage islemleri
// Geri donulebilir: Bu dosya silinirse oyun devre disi kalir, mevcut koda etkisi yoktur.

import AsyncStorage from '@react-native-async-storage/async-storage';

const GUESS_GAME_KEY = '@guess_game_state';

/** Kullanicinin gunluk tahmin durumu */
export interface GuessGameState {
  /** Oyunun oynangi tarih (ISO, YYYY-MM-DD) */
  date: string;
  /** Oyun tamamlandi mi */
  completed: boolean;
  /** Dogru bildi mi */
  won: boolean;
  /** Kacinci ipucuda bildi (1, 2, 3) veya 0 (bilemedi) */
  guessedAtHint: 0 | 1 | 2 | 3;
  /** Kullanicinin girdigi tahminler (her ipucu icin bir tane) */
  guesses: string[];
  /** Kazanilan XP miktari */
  xpEarned: number;
}

/** Bugunun tahmin durumunu getir */
export const getGuessGameState = async (): Promise<GuessGameState | null> => {
  try {
    const data = await AsyncStorage.getItem(GUESS_GAME_KEY);
    if (!data) return null;

    const parsed: GuessGameState = JSON.parse(data);
    const today = new Date().toISOString().split('T')[0];

    // Eski gun verisi ise null don (yeni oyun baslatilabilir)
    if (parsed.date !== today) return null;

    return parsed;
  } catch (error) {
    console.error('Error reading guess game state:', error);
    return null;
  }
};

/** Tahmin durumunu kaydet */
export const saveGuessGameState = async (state: GuessGameState): Promise<void> => {
  try {
    await AsyncStorage.setItem(GUESS_GAME_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving guess game state:', error);
  }
};

/** Yeni bir gunluk oyun baslat */
export const createNewGuessGameState = (): GuessGameState => ({
  date: new Date().toISOString().split('T')[0],
  completed: false,
  won: false,
  guessedAtHint: 0,
  guesses: [],
  xpEarned: 0,
});
