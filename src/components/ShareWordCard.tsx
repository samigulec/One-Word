import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ContentItem } from '../types';

// Premium paylasim karti -- Instagram story tarzi gorsel tasarim
type ShareWordCardProps = {
  word: ContentItem;
  translation: string;
  exampleTranslation: string;
  targetLanguageFlag: string;
  nativeLanguageFlag: string;
};

// Seviye renk paleti -- gradient hissi icin iki ton
const LEVEL_PALETTE: Record<string, { primary: string; glow: string; bg: string }> = {
  A1: { primary: '#34D399', glow: 'rgba(52,211,153,0.25)', bg: 'rgba(52,211,153,0.08)' },
  A2: { primary: '#6EE7B7', glow: 'rgba(110,231,183,0.25)', bg: 'rgba(110,231,183,0.08)' },
  B1: { primary: '#FBBF24', glow: 'rgba(251,191,36,0.25)', bg: 'rgba(251,191,36,0.08)' },
  B2: { primary: '#F97316', glow: 'rgba(249,115,22,0.25)', bg: 'rgba(249,115,22,0.08)' },
  C1: { primary: '#A78BFA', glow: 'rgba(167,139,250,0.25)', bg: 'rgba(167,139,250,0.08)' },
  C2: { primary: '#818CF8', glow: 'rgba(129,140,248,0.25)', bg: 'rgba(129,140,248,0.08)' },
};

// Kategori emoji haritasi
const CATEGORY_EMOJI: Record<string, string> = {
  greetings: '👋', food: '🍽️', travel: '✈️', business: '💼',
  emotions: '💫', nature: '🌿', technology: '💻', health: '🏥',
  education: '📚', shopping: '🛍️', family: '👨‍👩‍👧', weather: '🌤️',
  sports: '⚽', music: '🎵', art: '🎨', animals: '🐾',
  home: '🏡', clothing: '👔', time: '⏰', colors: '🎨',
  numbers: '🔢', body: '🧠', transport: '🚀', professions: '👩‍⚕️',
  daily_life: '☀️',
};

const ShareWordCard = forwardRef<View, ShareWordCardProps>(
  ({ word, translation, exampleTranslation, targetLanguageFlag, nativeLanguageFlag }, ref) => {
    const palette = LEVEL_PALETTE[word.level] || LEVEL_PALETTE.C1;
    const categoryEmoji = CATEGORY_EMOJI[word.category || ''] || '📝';

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        <View style={styles.background}>
          {/* Dekoratif ust gradient serit */}
          <View style={styles.topGradientBar}>
            <View style={[styles.gradientSegment1, { backgroundColor: palette.primary }]} />
            <View style={[styles.gradientSegment2, { backgroundColor: palette.glow }]} />
          </View>

          {/* Dekoratif kose desenleri */}
          <View style={[styles.cornerDecorTL, { borderColor: palette.glow }]} />
          <View style={[styles.cornerDecorBR, { borderColor: palette.glow }]} />

          {/* Arka plan glow efekti */}
          <View style={[styles.glowCircle, { backgroundColor: palette.glow }]} />

          {/* Marka baslik */}
          <View style={styles.brandRow}>
            <View style={[styles.brandDot, { backgroundColor: palette.primary }]} />
            <Text style={styles.brandName}>One Word</Text>
          </View>

          {/* Seviye + Kategori */}
          <View style={styles.metaRow}>
            <View style={[styles.levelPill, { backgroundColor: palette.bg, borderColor: `${palette.primary}40` }]}>
              <Text style={[styles.levelText, { color: palette.primary }]}>{word.level}</Text>
            </View>
            {word.category && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryEmoji}>{categoryEmoji}</Text>
                <Text style={styles.categoryText}>
                  {word.category.replace(/_/g, ' ')}
                </Text>
              </View>
            )}
          </View>

          {/* Ana kelime -- buyuk ve dikkat cekici */}
          <Text style={styles.targetWord}>{word.target_word}</Text>

          {/* Telaffuz */}
          {word.pronunciation && (
            <Text style={styles.pronunciation}>/{word.pronunciation}/</Text>
          )}

          {/* Ceviri blogu */}
          <View style={[styles.translationBlock, { backgroundColor: palette.bg, borderColor: `${palette.primary}20` }]}>
            <Text style={styles.translationFlag}>{nativeLanguageFlag}</Text>
            <Text style={[styles.translationText, { color: palette.primary }]}>{translation}</Text>
          </View>

          {/* Dekoratif ayirici */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: palette.glow }]} />
            <View style={[styles.dividerDiamond, { backgroundColor: palette.primary }]} />
            <View style={[styles.dividerLine, { backgroundColor: palette.glow }]} />
          </View>

          {/* Ornek cumle */}
          <View style={styles.exampleSection}>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleFlag}>{targetLanguageFlag}</Text>
              <Text style={styles.exampleText}>"{word.example_sentence}"</Text>
            </View>
            {exampleTranslation ? (
              <View style={styles.exampleRow}>
                <Text style={styles.exampleFlag}>{nativeLanguageFlag}</Text>
                <Text style={styles.exampleTranslation}>{exampleTranslation}</Text>
              </View>
            ) : null}
          </View>

          {/* Alt kisim -- marka + slogan */}
          <View style={styles.footerSection}>
            <View style={[styles.footerDivider, { backgroundColor: palette.glow }]} />
            <Text style={styles.footerSlogan}>Learn a new word every day</Text>
            <Text style={[styles.footerBrand, { color: palette.primary }]}>oneword.app</Text>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: 380,
    borderRadius: 28,
    overflow: 'hidden',
  },
  background: {
    backgroundColor: '#0D0B1A',
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: 'center',
  },

  // Ust gradient serit
  topGradientBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    flexDirection: 'row',
  },
  gradientSegment1: {
    flex: 3,
    height: 5,
  },
  gradientSegment2: {
    flex: 2,
    height: 5,
  },

  // Kose desenleri
  cornerDecorTL: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRadius: 2,
  },
  cornerDecorBR: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderRadius: 2,
  },

  // Glow efekti
  glowCircle: {
    position: 'absolute',
    top: '30%',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },

  // Marka baslik
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Meta bilgi
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  levelPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryEmoji: {
    fontSize: 13,
    marginRight: 5,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'capitalize',
  },

  // Ana kelime
  targetWord: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  pronunciation: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },

  // Ceviri blogu
  translationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  translationFlag: {
    fontSize: 20,
  },
  translationText: {
    fontSize: 22,
    fontWeight: '800',
  },

  // Ayirici
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%',
    marginBottom: 20,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerDiamond: {
    width: 6,
    height: 6,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },

  // Ornek cumle
  exampleSection: {
    width: '100%',
    marginBottom: 8,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  exampleFlag: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  exampleText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  exampleTranslation: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 20,
  },

  // Alt kisim
  footerSection: {
    alignItems: 'center',
    marginTop: 12,
  },
  footerDivider: {
    width: 40,
    height: 1,
    marginBottom: 14,
  },
  footerSlogan: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ShareWordCard;
