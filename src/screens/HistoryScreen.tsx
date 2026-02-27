import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LearnedWord } from '../types';
import { getLearnedWords, toggleFavorite } from '../utils/storage';
import { LanguageCode, getTranslation } from '../utils/translations';

type HistoryScreenProps = {
  nativeLanguage: LanguageCode;
  onClose: () => void;
};

const HistoryScreen: React.FC<HistoryScreenProps> = ({ nativeLanguage, onClose }) => {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);
  const [words, setWords] = useState<LearnedWord[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    const learned = await getLearnedWords();
    setWords(learned.reverse());
  };

  const handleToggleFavorite = async (wordId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(wordId);
    await loadWords();
  };

  const filteredWords = filter === 'favorites'
    ? words.filter(w => w.isFavorite)
    : words;

  const renderWord = ({ item }: { item: LearnedWord }) => {
    const translation = item.word.translations[nativeLanguage] || item.word.translations['en'] || '';

    return (
      <View style={styles.wordCard}>
        <View style={styles.wordLeft}>
          <Text style={styles.wordTarget}>{item.word.target_word}</Text>
          <Text style={styles.wordTranslation}>{translation}</Text>
          <View style={styles.wordMeta}>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.word.level) }]}>
              <Text style={styles.levelText}>{item.word.level}</Text>
            </View>
            <Text style={styles.dateText}>{item.learnedDate}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleToggleFavorite(item.word.id)}
          style={styles.favButton}
        >
          <Text style={[styles.favIcon, item.isFavorite && styles.favIconActive]}>
            {item.isFavorite ? '\u2665' : '\u2661'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'A1': '#10B981', 'A2': '#34D399',
      'B1': '#F59E0B', 'B2': '#EF4444',
      'C1': '#8B5CF6', 'C2': '#6366F1',
    };
    return colors[level] || '#94A3B8';
  };

  return (
    <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('wordHistory')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              {t('all')} ({words.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'favorites' && styles.filterTabActive]}
            onPress={() => setFilter('favorites')}
          >
            <Text style={[styles.filterText, filter === 'favorites' && styles.filterTextActive]}>
              {t('favorites')} ({words.filter(w => w.isFavorite).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Word List */}
        {filteredWords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {filter === 'favorites' ? t('noFavoritesYet') : t('noWordsYet')}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'favorites' ? t('noFavoritesHint') : t('noWordsHint')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredWords}
            renderItem={renderWord}
            keyExtractor={(item) => item.word.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  closeIcon: { fontSize: 20, color: '#475569', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  placeholder: { width: 40 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  wordLeft: { flex: 1 },
  wordTarget: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  wordTranslation: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginRight: 8,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  favButton: {
    padding: 8,
  },
  favIcon: {
    fontSize: 22,
    color: '#CBD5E1',
  },
  favIconActive: {
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HistoryScreen;
