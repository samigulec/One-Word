// Spaced Repetition System - SM-2 algoritmasi tabanli tekrar zamanlama
import { SRSData } from '../types';

// Varsayilan SRS degerleri
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

/**
 * Yeni ogrenilen bir kelime icin SRS verisi olusturur
 * Ilk tekrar 1 gun sonra planlanir
 */
export const createSRSData = (wordId: string): SRSData => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    wordId,
    lastReviewed: now.toISOString().split('T')[0],
    nextReview: tomorrow.toISOString().split('T')[0],
    confidence: 0,
    reviewCount: 0,
    interval: 1,
    easeFactor: DEFAULT_EASE_FACTOR,
  };
};

/**
 * SM-2 algoritmasi ile tekrar araligini gunceller
 * quality: 1-5 arasi kullanici degerlendirmesi
 *   1 = Hic bilmiyorum
 *   2 = Yanlis bildim
 *   3 = Zor ama bildim
 *   4 = Dogru bildim
 *   5 = Cok kolay
 */
export const updateSRS = (srsData: SRSData, quality: number): SRSData => {
  // quality 1-5 arasinda sinirla
  const q = Math.max(1, Math.min(5, Math.round(quality)));

  const today = new Date().toISOString().split('T')[0];

  // Yeni ease factor hesapla (SM-2 formulu)
  let newEaseFactor = srsData.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  let newInterval: number;

  if (q < 3) {
    // Yanlis veya cok zor - bastan basla
    newInterval = 1;
  } else if (srsData.reviewCount === 0) {
    // Ilk basarili tekrar
    newInterval = 1;
  } else if (srsData.reviewCount === 1) {
    // Ikinci basarili tekrar
    newInterval = 3;
  } else {
    // Sonraki tekrarlar - aralik * ease factor
    newInterval = Math.round(srsData.interval * newEaseFactor);
  }

  // Maksimum aralik 180 gun (6 ay)
  newInterval = Math.min(180, newInterval);

  // Bir sonraki tekrar tarihini hesapla
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    wordId: srsData.wordId,
    lastReviewed: today,
    nextReview: nextDate.toISOString().split('T')[0],
    confidence: q,
    reviewCount: srsData.reviewCount + 1,
    interval: newInterval,
    easeFactor: newEaseFactor,
  };
};

/**
 * Bugun tekrar edilmesi gereken kelimeleri filtreler
 */
export const getDueWords = (srsDataList: SRSData[]): SRSData[] => {
  const today = new Date().toISOString().split('T')[0];
  return srsDataList.filter(srs => srs.nextReview <= today);
};

/**
 * Kelime icin guven seviyesine gore renk dondurur
 */
export const getConfidenceColor = (confidence: number): string => {
  if (confidence <= 1) return '#EF4444'; // kirmizi - bilmiyor
  if (confidence <= 2) return '#F59E0B'; // turuncu - zayif
  if (confidence <= 3) return '#FBBF24'; // sari - orta
  if (confidence <= 4) return '#34D399'; // yesil - iyi
  return '#10B981'; // koyu yesil - mukemmel
};

/**
 * Guven puanina gore metin etiketi dondurur
 */
export const getConfidenceLabel = (confidence: number): string => {
  if (confidence <= 1) return 'new';
  if (confidence <= 2) return 'learning';
  if (confidence <= 3) return 'reviewing';
  if (confidence <= 4) return 'learned';
  return 'mastered';
};
