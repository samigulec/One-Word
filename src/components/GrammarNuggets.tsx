import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { ContentItem } from '../types';

// Dilbilgisi kapsulleri bilesen -- kelime detayinda gramer bolumu gosterir
type GrammarNuggetsProps = {
  word: ContentItem;
};

const GrammarNuggets: React.FC<GrammarNuggetsProps> = ({ word }) => {
  // Gramer verisi yoksa hicbir sey gosterme
  const hasGrammar = word.grammarNote || (word.sentencePatterns && word.sentencePatterns.length > 0) || (word.commonMistakes && word.commonMistakes.length > 0);
  if (!hasGrammar) return null;

  return (
    <View style={styles.container}>
      {/* Bolum basligi */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{'\u{1F4DA}'}</Text>
        <Text style={styles.sectionTitle}>Grammar</Text>
      </View>

      {/* Dilbilgisi notu */}
      {word.grammarNote && (
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>{word.grammarNote}</Text>
        </View>
      )}

      {/* Cumle kaliplari */}
      {word.sentencePatterns && word.sentencePatterns.length > 0 && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>{'\u{1F4AC}'} Sentence Patterns</Text>
          {word.sentencePatterns.map((pattern, index) => (
            <View key={index} style={styles.patternRow}>
              <Text style={styles.patternBullet}>{'\u25B8'}</Text>
              <Text style={styles.patternText}>{pattern}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sik yapilan hatalar */}
      {word.commonMistakes && word.commonMistakes.length > 0 && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>{'\u{26A0}\u{FE0F}'} Common Mistakes</Text>
          {word.commonMistakes.map((mistake, index) => (
            <View key={index} style={styles.mistakeRow}>
              <Text style={styles.mistakeBullet}>{'\u2717'}</Text>
              <Text style={styles.mistakeText}>{mistake}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteCard: {
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  noteText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
  subsection: {
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  patternBullet: {
    fontSize: 12,
    color: '#8B5CF6',
    marginRight: 8,
    marginTop: 2,
  },
  patternText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    flex: 1,
    lineHeight: 20,
    fontFamily: undefined, // monospace yok, varsayilan font
  },
  mistakeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  mistakeBullet: {
    fontSize: 12,
    color: '#F87171',
    marginRight: 8,
    marginTop: 2,
    fontWeight: '700',
  },
  mistakeText: {
    fontSize: 13,
    color: 'rgba(248,113,113,0.8)',
    flex: 1,
    lineHeight: 20,
  },
});

export default GrammarNuggets;
