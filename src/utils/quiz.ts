// Quiz soru uretici - ogrenilen kelimelerden quiz sorulari olusturur
import { ContentItem, QuizQuestion, QuizType, LearnedWord } from '../types';

/**
 * Diziyi karistiran Fisher-Yates algoritmasi
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Coktan secmeli soru olusturur
 * Dogru cevap + 3 yanlis secenek
 */
const createMultipleChoiceQuestion = (
  word: ContentItem,
  allWords: ContentItem[],
  nativeLanguage: string
): QuizQuestion => {
  const correctAnswer = word.translations[nativeLanguage] || word.translations['en'] || '';

  // Yanlis secenekleri diger kelimelerden sec
  const otherWords = allWords.filter(w => w.id !== word.id);
  const wrongOptions = shuffleArray(otherWords)
    .slice(0, 3)
    .map(w => w.translations[nativeLanguage] || w.translations['en'] || '');

  // Tum secenekleri karistir
  const options = shuffleArray([correctAnswer, ...wrongOptions]);

  return {
    type: 'multiple_choice',
    word,
    correctAnswer,
    options,
  };
};

/**
 * Yazarak cevap sorusu olusturur
 */
const createTypeAnswerQuestion = (
  word: ContentItem,
  nativeLanguage: string
): QuizQuestion => {
  const correctAnswer = word.translations[nativeLanguage] || word.translations['en'] || '';

  return {
    type: 'type_answer',
    word,
    correctAnswer,
  };
};

/**
 * Flashcard sorusu olusturur (kart cevirme)
 */
const createFlashcardQuestion = (
  word: ContentItem,
  nativeLanguage: string
): QuizQuestion => {
  const correctAnswer = word.translations[nativeLanguage] || word.translations['en'] || '';

  return {
    type: 'flashcard',
    word,
    correctAnswer,
  };
};

/**
 * Eslestirme sorusu olusturur (4 cift)
 */
const createMatchingQuestion = (
  words: ContentItem[],
  nativeLanguage: string
): QuizQuestion => {
  const selectedWords = shuffleArray(words).slice(0, Math.min(4, words.length));

  const matchPairs = selectedWords.map(w => ({
    word: w.target_word,
    translation: w.translations[nativeLanguage] || w.translations['en'] || '',
  }));

  return {
    type: 'matching',
    word: selectedWords[0],
    correctAnswer: '',
    matchPairs,
  };
};

/**
 * Belirtilen sayida karisik quiz sorusu uretir
 * En az 4 ogrenilmis kelime gereklidir
 */
export const generateQuizQuestions = (
  learnedWords: LearnedWord[],
  nativeLanguage: string,
  questionCount: number = 5
): QuizQuestion[] => {
  if (learnedWords.length < 2) return [];

  const allWords = learnedWords.map(lw => lw.word);
  const questions: QuizQuestion[] = [];

  // Soru tiplerini belirle
  const availableTypes: QuizType[] = ['multiple_choice', 'flashcard', 'type_answer'];

  // Eslestirme icin en az 4 kelime gerekli
  if (allWords.length >= 4) {
    availableTypes.push('matching');
  }

  // Sorulari karisik tiplerden olustur
  const shuffledWords = shuffleArray(allWords);
  const actualCount = Math.min(questionCount, shuffledWords.length);

  for (let i = 0; i < actualCount; i++) {
    const word = shuffledWords[i];
    const typeIndex = i % availableTypes.length;
    const type = availableTypes[typeIndex];

    switch (type) {
      case 'multiple_choice':
        questions.push(createMultipleChoiceQuestion(word, allWords, nativeLanguage));
        break;
      case 'type_answer':
        questions.push(createTypeAnswerQuestion(word, nativeLanguage));
        break;
      case 'flashcard':
        questions.push(createFlashcardQuestion(word, nativeLanguage));
        break;
      case 'matching':
        questions.push(createMatchingQuestion(allWords, nativeLanguage));
        break;
    }
  }

  return questions;
};

/**
 * Yazili cevabi kontrol eder (buyuk/kucuk harf ve bosluk toleransli)
 */
export const checkTypeAnswer = (userAnswer: string, correctAnswer: string): boolean => {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalize(userAnswer) === normalize(correctAnswer);
};

/**
 * Quiz sonuc puanini hesaplar (0-100)
 */
export const calculateQuizScore = (
  results: { isCorrect: boolean }[]
): number => {
  if (results.length === 0) return 0;
  const correct = results.filter(r => r.isCorrect).length;
  return Math.round((correct / results.length) * 100);
};

/**
 * Quiz puanini SRS confidence degerine cevirir (1-5)
 */
export const scoreToConfidence = (score: number): number => {
  if (score >= 90) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  return 1;
};
