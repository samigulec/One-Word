// Type definitions for One Word App

// Canli kullanim ornegi tipi
export interface RealWorldExample {
  source: string;              // Kaynak adi (film, sarki, haber vs.)
  text: string;                // Ornek cumle
  translation: string;         // Cevirisi
  type: 'movie' | 'song' | 'news' | 'social'; // Kaynak tipi
}

export interface ContentItem {
  id: string;
  target_word: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  translations: Record<string, string>;
  example_sentence: string;
  example_translation: Record<string, string>;
  pronunciation?: string;
  category?: string;
  emoji?: string;              // Kelimeyi temsil eden emoji
  related_words?: string[];    // Iliskili kelimelerin ID'leri
  synonyms?: string[];         // Es anlamli kelimelerin ID'leri
  antonyms?: string[];         // Zit anlamli kelimelerin ID'leri
  // Ozellik 1: Kulturel Baglam Kartlari
  culturalContext?: string;    // Kulturel baglam bilgisi
  usageNotes?: string;         // Kullanim notlari
  funFact?: string;            // Eglenceli bilgi
  // Ozellik 2: Grammar Nuggets (Dilbilgisi Kapsulleri)
  grammarNote?: string;        // Dilbilgisi notu
  sentencePatterns?: string[]; // Cumle kaliplari
  commonMistakes?: string[];   // Sik yapilan hatalar
  // Ozellik 5: Canli Kullanim Ornekleri
  realWorldExamples?: RealWorldExample[]; // Gercek dunya kullanim ornekleri
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface LearnedWord {
  word: ContentItem;
  learnedDate: string;
  isFavorite: boolean;
}

// Spaced Repetition System verileri
export interface SRSData {
  wordId: string;
  lastReviewed: string;       // ISO tarih
  nextReview: string;         // ISO tarih - bir sonraki tekrar zamani
  confidence: number;         // 1-5 arasi guven puani
  reviewCount: number;        // toplam tekrar sayisi
  interval: number;           // gun cinsinden mevcut aralik
  easeFactor: number;         // SM-2 zorluk carpani (varsayilan 2.5)
}

export interface UserProgress {
  lastViewedDate: string;
  viewedIdiomIds: number[];
  streak: number;
  totalIdiomsLearned: number;
  learnedWords: LearnedWord[];
  favorites: string[]; // word IDs
  // XP sistemi
  totalXP: number;
  dailyXP: number;
  dailyXPDate: string;          // Gunluk XP'nin sifirlanma tarihi (ISO)
  dailyXPGoal: DailyGoalTarget; // Gunluk hedef (30, 50, 100 veya 150)
  xpHistory: XPEntry[];         // Son XP kazanimlari
  level: number;                // Mevcut seviye (1-50)
  dailyGoalStreak: number;      // Ust uste gunluk hedef tamamlama
  weeklyXP: Record<string, number>; // Son 7 gunun XP'si {tarih: xp}
  dailyActionCounts: Record<string, number>; // Gunluk aksiyon tekrar sayaci
  // Streak Freeze
  streakFreezeCount: number;        // Mevcut freeze hakki (max 2)
  streakFreezeUsedDate: string;     // Son kullanim tarihi (ISO)
}

// Genisletilmis XP aksiyon tipleri
export type XPActionType =
  | 'word_learned'
  | 'meaning_revealed'
  | 'chat_started'
  | 'chat_message_sent'
  | 'quiz_completed'
  | 'quiz_perfect'
  | 'quiz_correct_answer'
  | 'review_completed'
  | 'review_word'
  | 'streak_bonus'
  | 'daily_goal_reached'
  | 'favorite_added'
  | 'word_shared';

// XP giris kaydi
export interface XPEntry {
  amount: number;
  source: XPActionType;
  date: string;
}

// Seviye bilgisi
export interface LevelInfo {
  level: number;
  title: string;
  emoji: string;
  minXP: number;
  maxXP: number;
}

// Gunluk hedef secenekleri
export type DailyGoalTarget = 30 | 50 | 100 | 150;

// Lig tipleri
export type LeagueType = 'bronze' | 'silver' | 'gold' | 'diamond';

// Liderlik tablosu girisi
export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  streak: number;
  wordsLearned: number;
  isCurrentUser: boolean;
  avatar: string;               // Emoji avatar
  level: number;                // Seviye
  rank?: number;                // Siralama
}

// Liderlik tablosu sonucu
export interface LeaderboardData {
  entries: LeaderboardEntry[];
  currentUserRank: number;
  totalParticipants: number;
  weekStart: string;
  league: LeagueType;
}

// Gunluk gorev sistemi
export type DailyTaskId = 'learn_word' | 'discover_meaning' | 'practice_ai';

export interface DailyTask {
  id: DailyTaskId;
  completed: boolean;
  xp: number;
}

export interface DailyTasksData {
  date: string;                // ISO tarih
  tasks: DailyTask[];
  allCompleted: boolean;       // 3/3 tamamlandi mi
  bonusClaimed: boolean;       // Bonus XP alindi mi
  consecutiveDays: number;     // Ust uste 3/3 gun sayisi
}

// Quiz tipleri
export type QuizType = 'multiple_choice' | 'type_answer' | 'flashcard' | 'matching';

export interface QuizQuestion {
  type: QuizType;
  word: ContentItem;
  correctAnswer: string;
  options?: string[];          // coktan secmeli icin 4 secenek
  matchPairs?: { word: string; translation: string }[];  // eslestirme icin
}

export interface QuizResult {
  questionIndex: number;
  isCorrect: boolean;
  wordId: string;
  userAnswer: string;
  correctAnswer: string;
  timeTaken: number;           // milisaniye
}

export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LanguagePreferences {
  nativeLanguage: string;
  targetLanguage: string;
  proficiencyLevel: ProficiencyLevel;
  userName?: string;
}

// Rozet/Basarim sistemi
export type BadgeCategory = 'streak' | 'words' | 'quiz' | 'level' | 'special';

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  requirement: number;          // Gerekli sayi (orn: 7 gun streak)
}

export interface EarnedBadge {
  badgeId: string;
  earnedDate: string;           // ISO tarih
}

// Ozellik 3: Haftalik Zorluklar
export interface WeeklyChallengeGoal {
  id: string;
  description: string;
  target: number;              // Hedef sayi
  current: number;             // Mevcut ilerleme
  completed: boolean;
}

export interface WeeklyChallengeData {
  weekNumber: number;          // Yilin hafta numarasi
  year: number;
  categoryTheme: string;       // Haftalik kategori temasi
  categoryEmoji: string;       // Tema emojisi
  themeTitle: string;          // Tema basligi (orn: "Yemek Haftasi")
  goals: WeeklyChallengeGoal[];
  bonusXPClaimed: boolean;     // Haftalik bonus XP alindi mi
  badgeEarned: boolean;        // Haftalik rozet kazanildi mi
  startDate: string;           // Hafta baslangic tarihi (ISO)
}

// Ozellik 4: Geri Bildirim Siddeti
export type FeedbackIntensity = 'soft' | 'balanced' | 'strict';

// Ozellik 6: Paylasim Hikaye Sablonlari
export type ShareTemplateType = 'streak' | 'level' | 'words' | 'badge' | 'weekly_challenge';

export interface ShareTemplate {
  type: ShareTemplateType;
  title: string;               // Baslik (orn: "7 Gun Streak!")
  subtitle: string;            // Alt baslik
  value: string | number;      // Deger (orn: 7, "Level 5")
  emoji: string;               // Gorsel emoji
}

// Bildirim ayarlari
export interface NotificationSettings {
  enabled: boolean;                // Bildirimler acik/kapali
  dailyWordReminder: boolean;      // Gunluk kelime hatirlatmasi
  dailyWordTime: { hour: number; minute: number }; // Hatirlatma saati
  streakReminder: boolean;         // Streak hatirlatmasi (gun sonunda)
  streakReminderTime: { hour: number; minute: number };
  quizReminder: boolean;           // Quiz hatirlatmasi
  quizReminderTime: { hour: number; minute: number };
}
