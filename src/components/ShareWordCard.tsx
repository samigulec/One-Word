import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ContentItem } from '../types';

// Paylasim icin olusturulan gorsel kelime karti
type ShareWordCardProps = {
  word: ContentItem;
  translation: string;
  exampleTranslation: string;
  targetLanguageFlag: string;
  nativeLanguageFlag: string;
};

const ShareWordCard = forwardRef<View, ShareWordCardProps>(
  ({ word, translation, exampleTranslation, targetLanguageFlag, nativeLanguageFlag }, ref) => {
    // Seviye renk haritasi
    const levelColors: Record<string, string> = {
      A1: '#10B981',
      A2: '#34D399',
      B1: '#F59E0B',
      B2: '#EF4444',
      C1: '#8B5CF6',
      C2: '#6366F1',
    };

    const levelColor = levelColors[word.level] || '#8B5CF6';

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        {/* Arka plan gradyani yerine duz renk (view-shot uyumlulugu) */}
        <View style={styles.background}>
          {/* Dekoratif ust serit */}
          <View style={[styles.topStripe, { backgroundColor: levelColor }]} />

          {/* Uygulama ismi */}
          <Text style={styles.appName}>{'\u2728'} One Word</Text>

          {/* Seviye rozeti */}
          <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <Text style={styles.levelText}>{word.level}</Text>
          </View>

          {/* Ana kelime */}
          <Text style={styles.targetWord}>{word.target_word}</Text>

          {/* Telaffuz */}
          {word.pronunciation && (
            <Text style={styles.pronunciation}>{word.pronunciation}</Text>
          )}

          {/* Ceviri */}
          <View style={styles.translationRow}>
            <Text style={styles.translationFlag}>{nativeLanguageFlag}</Text>
            <Text style={styles.translationText}>{translation}</Text>
          </View>

          {/* Ayirici cizgi */}
          <View style={styles.divider} />

          {/* Ornek cumle */}
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

          {/* Kategori */}
          {word.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {word.category.replace('_', ' ')}
              </Text>
            </View>
          )}

          {/* Alt bilgi */}
          <Text style={styles.footer}>oneword.app</Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: 360,
    borderRadius: 24,
    overflow: 'hidden',
  },
  background: {
    backgroundColor: '#1A1145',
    padding: 28,
    alignItems: 'center',
  },
  topStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 20,
    marginTop: 8,
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  targetWord: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 44,
  },
  pronunciation: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  translationFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  translationText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#A78BFA',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 18,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
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
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  exampleTranslation: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 20,
  },
  categoryBadge: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818CF8',
    textTransform: 'capitalize',
  },
  footer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 20,
    letterSpacing: 0.5,
  },
});

export default ShareWordCard;
