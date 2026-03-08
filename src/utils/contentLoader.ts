import { ContentItem, ProficiencyLevel } from '../types';

// Import content files
import esContent from '../data/content/es_content.json';
import enContent from '../data/content/en_content.json';
import itContent from '../data/content/it_content.json';
import deContent from '../data/content/de_content.json';
import frContent from '../data/content/fr_content.json';
import ptContent from '../data/content/pt_content.json';
import trContent from '../data/content/tr_content.json';
import ruContent from '../data/content/ru_content.json';
import jaContent from '../data/content/ja_content.json';
import koContent from '../data/content/ko_content.json';
import zhContent from '../data/content/zh_content.json';

/**
 * Map of target language codes to their content
 */
const contentMap: Record<string, ContentItem[]> = {
  es: esContent as unknown as ContentItem[],
  en: enContent as unknown as ContentItem[],
  it: itContent as unknown as ContentItem[],
  de: deContent as unknown as ContentItem[],
  fr: frContent as unknown as ContentItem[],
  pt: ptContent as unknown as ContentItem[],
  tr: trContent as unknown as ContentItem[],
  ru: ruContent as unknown as ContentItem[],
  ja: jaContent as unknown as ContentItem[],
  ko: koContent as unknown as ContentItem[],
  zh: zhContent as unknown as ContentItem[],
};

/**
 * Level hierarchy for filtering
 * A1 users see only A1 content
 * A2 users see A1 + A2 content
 * B1 users see A1 + A2 + B1 content, etc.
 */
const levelHierarchy: Record<ProficiencyLevel, ProficiencyLevel[]> = {
  'A1': ['A1'],
  'A2': ['A1', 'A2'],
  'B1': ['A1', 'A2', 'B1'],
  'B2': ['A1', 'A2', 'B1', 'B2'],
  'C1': ['A1', 'A2', 'B1', 'B2', 'C1'],
  'C2': ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
};

/**
 * Load content for a specific target language
 */
export const loadContentForLanguage = (targetLanguage: string): ContentItem[] => {
  const content = contentMap[targetLanguage];
  
  if (!content) {
    console.warn(`No content found for language: ${targetLanguage}. Falling back to English.`);
    return contentMap['en'] || [];
  }
  
  return content;
};

/**
 * Load content filtered by proficiency level
 */
export const loadContentForLevel = (targetLanguage: string, level: ProficiencyLevel): ContentItem[] => {
  const allContent = loadContentForLanguage(targetLanguage);
  const allowedLevels = levelHierarchy[level] || ['A1'];
  
  return allContent.filter(item => allowedLevels.includes(item.level as ProficiencyLevel));
};

/**
 * Get the word/phrase of the day based on current date and user level
 * Prioritizes words at the user's exact level, falls back to lower levels if needed
 */
export const getWordOfTheDay = (targetLanguage: string, level: ProficiencyLevel = 'A1'): ContentItem => {
  // Use date as seed for consistent daily selection
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const allContent = loadContentForLanguage(targetLanguage);

  if (allContent.length === 0) {
    throw new Error('No content available');
  }

  // First try: words at the user's exact level
  const exactLevelContent = allContent.filter(item => item.level === level);
  if (exactLevelContent.length > 0) {
    return exactLevelContent[dayOfYear % exactLevelContent.length];
  }

  // Fallback: try each level below, from highest to lowest
  const allowedLevels = levelHierarchy[level] || ['A1'];
  for (let i = allowedLevels.length - 1; i >= 0; i--) {
    const levelContent = allContent.filter(item => item.level === allowedLevels[i]);
    if (levelContent.length > 0) {
      return levelContent[dayOfYear % levelContent.length];
    }
  }

  // Final fallback: any word
  return allContent[dayOfYear % allContent.length];
};

/**
 * Tum benzersiz kategorileri getir (belirli dil icin)
 */
export const getCategories = (targetLanguage: string): string[] => {
  const allContent = loadContentForLanguage(targetLanguage);
  const cats = new Set<string>();
  for (const item of allContent) {
    if (item.category) cats.add(item.category);
  }
  return Array.from(cats).sort();
};

/**
 * Kategoriye gore icerik filtrele (seviye dahil)
 */
export const loadContentByCategory = (
  targetLanguage: string,
  level: ProficiencyLevel,
  category: string
): ContentItem[] => {
  const levelContent = loadContentForLevel(targetLanguage, level);
  return levelContent.filter(item => item.category === category);
};

/**
 * Kategoriye gore rastgele kelime getir
 */
export const getRandomWordByCategory = (
  targetLanguage: string,
  level: ProficiencyLevel,
  category: string
): ContentItem | null => {
  const words = loadContentByCategory(targetLanguage, level, category);
  if (words.length === 0) return null;
  return words[Math.floor(Math.random() * words.length)];
};

/**
 * Get translation for a word in the user's native language
 */
export const getTranslation = (
  word: ContentItem,
  nativeLanguage: string
): string => {
  return word.translations[nativeLanguage] || word.translations['en'] || 'Translation not available';
};

/**
 * Get example translation in the user's native language
 */
export const getExampleTranslation = (
  word: ContentItem,
  nativeLanguage: string
): string => {
  return word.example_translation[nativeLanguage] || word.example_translation['en'] || '';
};

/**
 * Es anlamli kelimeleri getir (synonyms ID listesinden)
 */
export const getSynonyms = (
  word: ContentItem,
  targetLanguage: string
): ContentItem[] => {
  if (!word.synonyms || word.synonyms.length === 0) return [];
  const allContent = loadContentForLanguage(targetLanguage);
  return word.synonyms
    .map(id => allContent.find(w => w.id === id))
    .filter((w): w is ContentItem => !!w);
};

/**
 * Zit anlamli kelimeleri getir (antonyms ID listesinden)
 */
export const getAntonyms = (
  word: ContentItem,
  targetLanguage: string
): ContentItem[] => {
  if (!word.antonyms || word.antonyms.length === 0) return [];
  const allContent = loadContentForLanguage(targetLanguage);
  return word.antonyms
    .map(id => allContent.find(w => w.id === id))
    .filter((w): w is ContentItem => !!w);
};

/**
 * Get related words for a given word.
 * First checks explicit related_words IDs, then falls back to same-category words.
 * Returns up to `limit` related words, excluding the word itself.
 */
export const getRelatedWords = (
  word: ContentItem,
  targetLanguage: string,
  limit: number = 3
): ContentItem[] => {
  const allContent = loadContentForLanguage(targetLanguage);

  // 1) Explicit related_words if available
  if (word.related_words && word.related_words.length > 0) {
    const explicit = word.related_words
      .map(id => allContent.find(w => w.id === id))
      .filter((w): w is ContentItem => !!w && w.id !== word.id);
    if (explicit.length >= limit) return explicit.slice(0, limit);
    // Pad with category-based if not enough
    const usedIds = new Set([word.id, ...explicit.map(w => w.id)]);
    const categoryPad = allContent.filter(
      w => !usedIds.has(w.id) && w.category === word.category
    );
    return [...explicit, ...categoryPad].slice(0, limit);
  }

  // 2) Category-based fallback: same category, same level first
  const sameCategory = allContent.filter(
    w => w.id !== word.id && w.category === word.category
  );
  const sameLevel = sameCategory.filter(w => w.level === word.level);
  const otherLevel = sameCategory.filter(w => w.level !== word.level);

  // Day-based seed for deterministic daily selection
  const today = new Date();
  const seed = today.getFullYear() * 1000 + Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );

  const pick = (arr: ContentItem[], n: number): ContentItem[] => {
    if (arr.length <= n) return arr;
    const result: ContentItem[] = [];
    const used = new Set<number>();
    let s = seed;
    while (result.length < n) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const idx = s % arr.length;
      if (!used.has(idx)) {
        used.add(idx);
        result.push(arr[idx]);
      }
    }
    return result;
  };

  const picked = pick(sameLevel, limit);
  if (picked.length >= limit) return picked;
  return [...picked, ...pick(otherLevel, limit - picked.length)].slice(0, limit);
};
