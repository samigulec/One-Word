import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { ContentItem, RealWorldExample } from '../types';

// Canli kullanim ornekleri bilesen -- film, sarki, haber, sosyal medya ikonlari ile
type RealWorldExamplesProps = {
  word: ContentItem;
};

// Kaynak tipine gore ikon eslestirmesi
const TYPE_ICONS: Record<RealWorldExample['type'], string> = {
  movie: '\u{1F3AC}',    // Film/dizi
  song: '\u{1F3B5}',     // Sarki
  news: '\u{1F4F0}',     // Haber
  social: '\u{1F4F1}',   // Sosyal medya
};

// Kaynak tipine gore renk eslestirmesi
const TYPE_COLORS: Record<RealWorldExample['type'], string> = {
  movie: '#F59E0B',
  song: '#EC4899',
  news: '#3B82F6',
  social: '#10B981',
};

const RealWorldExamples: React.FC<RealWorldExamplesProps> = ({ word }) => {
  // Veri yoksa gosterme
  if (!word.realWorldExamples || word.realWorldExamples.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Bolum basligi */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{'\u{1F30E}'}</Text>
        <Text style={styles.sectionTitle}>Where Is It Used?</Text>
      </View>

      {/* Ornekler listesi */}
      {word.realWorldExamples.map((example, index) => {
        const icon = TYPE_ICONS[example.type] || '\u{1F4CC}';
        const color = TYPE_COLORS[example.type] || '#A78BFA';

        return (
          <View key={index} style={styles.exampleCard}>
            {/* Kaynak baslik satiri */}
            <View style={styles.sourceRow}>
              <View style={[styles.typeBadge, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
                <Text style={styles.typeIcon}>{icon}</Text>
                <Text style={[styles.typeLabel, { color }]}>{example.source}</Text>
              </View>
            </View>

            {/* Ornek cumle */}
            <Text style={styles.exampleText}>"{example.text}"</Text>

            {/* Ceviri */}
            <Text style={styles.translationText}>{example.translation}</Text>
          </View>
        );
      })}
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
  exampleCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sourceRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  exampleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  translationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 20,
  },
});

export default RealWorldExamples;
