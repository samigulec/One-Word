// Paylasim Hikaye Sablonlari
// Streak, level, kelime sayisi, rozet ve haftalik zorluk basarilari icin

import { ShareTemplate, ShareTemplateType } from '../types';

// Streak paylasim sablonlari
export const createStreakTemplate = (streak: number): ShareTemplate => {
  let emoji = '\u{1F525}';
  let title = `${streak} Day Streak!`;

  if (streak >= 365) {
    emoji = '\u{1F30D}';
    title = `${streak} Day Streak! A Full Year!`;
  } else if (streak >= 100) {
    emoji = '\u{1F451}';
    title = `${streak} Day Streak! Legendary!`;
  } else if (streak >= 30) {
    emoji = '\u{1F3C6}';
    title = `${streak} Day Streak! Incredible!`;
  } else if (streak >= 7) {
    emoji = '\u{1F525}';
    title = `${streak} Day Streak!`;
  }

  return {
    type: 'streak',
    title,
    subtitle: 'Learning a new word every day',
    value: `${streak} days`,
    emoji,
  };
};

// Seviye paylasim sablonu
export const createLevelTemplate = (level: number, levelTitle: string): ShareTemplate => {
  let emoji = '\u{1F31F}';
  if (level >= 40) emoji = '\u{1F680}';
  else if (level >= 30) emoji = '\u{1F451}';
  else if (level >= 20) emoji = '\u{1F525}';
  else if (level >= 10) emoji = '\u{2B50}';

  return {
    type: 'level',
    title: `Level ${level} Reached!`,
    subtitle: levelTitle,
    value: `Level ${level}`,
    emoji,
  };
};

// Kelime sayisi paylasim sablonu
export const createWordsTemplate = (count: number): ShareTemplate => {
  let emoji = '\u{1F4DA}';
  let title = `${count} Words Learned!`;

  if (count >= 365) {
    emoji = '\u{1F680}';
    title = `${count} Words! Full Year Vocabulary!`;
  } else if (count >= 100) {
    emoji = '\u{1F4AF}';
    title = `${count} Words Learned!`;
  } else if (count >= 50) {
    emoji = '\u{1F393}';
    title = `${count} Words! Halfway to 100!`;
  }

  return {
    type: 'words',
    title,
    subtitle: 'Building vocabulary one word at a time',
    value: `${count} words`,
    emoji,
  };
};

// Rozet paylasim sablonu
export const createBadgeTemplate = (badgeName: string, badgeEmoji: string): ShareTemplate => {
  return {
    type: 'badge',
    title: `Badge Earned: ${badgeName}!`,
    subtitle: 'Unlocked a new achievement',
    value: badgeName,
    emoji: badgeEmoji,
  };
};

// Haftalik zorluk paylasim sablonu
export const createWeeklyChallengeTemplate = (themeTitle: string, themeEmoji: string): ShareTemplate => {
  return {
    type: 'weekly_challenge',
    title: `Weekly Challenge Complete!`,
    subtitle: themeTitle,
    value: '+100 XP',
    emoji: themeEmoji,
  };
};

// Milestone'lari kontrol et ve uygun sablonlari dondur
export const checkShareableMilestones = (
  streak: number,
  wordsCount: number,
  level: number,
  levelTitle: string
): ShareTemplate[] => {
  const milestones: ShareTemplate[] = [];

  // Streak milestone'lari
  const streakMilestones = [7, 14, 30, 60, 100, 200, 365];
  if (streakMilestones.includes(streak)) {
    milestones.push(createStreakTemplate(streak));
  }

  // Kelime milestone'lari
  const wordMilestones = [10, 25, 50, 100, 200, 365];
  if (wordMilestones.includes(wordsCount)) {
    milestones.push(createWordsTemplate(wordsCount));
  }

  // Seviye milestone'lari (her 5 seviyede bir)
  if (level > 0 && level % 5 === 0) {
    milestones.push(createLevelTemplate(level, levelTitle));
  }

  return milestones;
};
