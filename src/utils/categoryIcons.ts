// Kategori bazli emoji/ikon haritasi
// Her kelime kartinda kategoriye gore ikon gosterilir

export const CATEGORY_ICONS: Record<string, string> = {
  greetings: '\u{1F44B}',
  daily_life: '\u{1F3E0}',
  people: '\u{1F465}',
  food_drink: '\u{1F355}',
  travel: '\u{2708}\u{FE0F}',
  work_business: '\u{1F4BC}',
  emotions: '\u{1F60A}',
  nature: '\u{1F33F}',
  health: '\u{2764}\u{FE0F}',
  technology: '\u{1F4BB}',
  education: '\u{1F4DA}',
  culture: '\u{1F3AD}',
  sports: '\u{26BD}',
  music: '\u{1F3B5}',
  shopping: '\u{1F6CD}\u{FE0F}',
  weather: '\u{2600}\u{FE0F}',
  family: '\u{1F46A}',
  animals: '\u{1F43E}',
  colors: '\u{1F308}',
  numbers: '\u{1F522}',
  time: '\u{23F0}',
  body: '\u{1F4AA}',
  clothing: '\u{1F455}',
  home: '\u{1F3E0}',
  city: '\u{1F3D9}\u{FE0F}',
};

// Seviye bazli ikon renkleri
export const LEVEL_ICONS: Record<string, string> = {
  'A1': '\u{1F331}',
  'A2': '\u{1F33F}',
  'B1': '\u{1F525}',
  'B2': '\u{1F4A5}',
  'C1': '\u{1F680}',
  'C2': '\u{1F451}',
};

// Kategoriye gore ikon getir, bulunamazsa varsayilan dondur
export const getCategoryIcon = (category?: string): string => {
  if (!category) return '\u{1F4CC}';
  return CATEGORY_ICONS[category] || '\u{1F4CC}';
};
