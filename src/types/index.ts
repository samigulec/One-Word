// Type definitions for One Word App

export interface ContentItem {
  id: string;
  target_word: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  translations: Record<string, string>;
  example_sentence: string;
  example_translation: Record<string, string>;
  pronunciation?: string;
  category?: string;
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

export interface Achievement {
  id: string;
  unlockedAt: string; // ISO date
}

export interface UserProgress {
  lastViewedDate: string;
  viewedIdiomIds: number[];
  streak: number;
  totalIdiomsLearned: number;
  learnedWords: LearnedWord[];
  favorites: string[]; // word IDs
  xp: number;
  quizCorrect: number;
  quizTotal: number;
  achievements: Achievement[];
}

export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LanguagePreferences {
  nativeLanguage: string;
  targetLanguage: string;
  proficiencyLevel: ProficiencyLevel;
}
