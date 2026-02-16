import { ContentItem, ProficiencyLevel } from '../types';

// Import content files
import esContent from '../data/content/es_content.json';
import enContent from '../data/content/en_content.json';
import itContent from '../data/content/it_content.json';

/**
 * Map of target language codes to their content
 */
const contentMap: Record<string, ContentItem[]> = {
  es: esContent as ContentItem[],
  en: enContent as ContentItem[],
  it: itContent as ContentItem[],
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
 * All users at the same level see the same word on the same day
 */
export const getWordOfTheDay = (targetLanguage: string, level: ProficiencyLevel = 'A1'): ContentItem => {
  const content = loadContentForLevel(targetLanguage, level);
  
  if (content.length === 0) {
    // Fallback to all content if no level-specific content
    const allContent = loadContentForLanguage(targetLanguage);
    if (allContent.length === 0) {
      throw new Error('No content available');
    }
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return allContent[dayOfYear % allContent.length];
  }
  
  // Use date as seed for consistent daily selection
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const index = dayOfYear % content.length;
  return content[index];
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


