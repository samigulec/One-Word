import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LearnedWord } from '../types';
import { getLearnedWords, toggleFavorite } from '../utils/storage';
import { LanguageCode, getTranslation } from '../utils/translations';

const { width } = Dimensions.get('window');

type HistoryScreenProps = {
  nativeLanguage: LanguageCode;
  onClose: () => void;
};

const AnimatedWordCard: React.FC<{
  item: LearnedWord;
  index: number;
  nativeLanguage: LanguageCode;
  onToggleFavorite: (id: string) => void;
  getLevelColor: (level: string) => string;
  getLevelEmoji: (level: string) => string;
}> = ({ item, index, nativeLanguage, onToggleFavorite, getLevelColor, getLevelEmoji }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFavPress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onToggleFavorite(item.word.id);
  };

  const translation = item.word.translations[nativeLanguage] || item.word.translations['en'] || '';
  const color = getLevelColor(item.word.level);

  return (
    <Animated.View style={{
      opacity: opacityAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
    }}>
      <View style={styles.wordCard}>
        <View style={styles.wordLeft}>
          <View style={styles.wordHeader}>
            <Text style={styles.wordTarget}>{item.word.target_word}</Text>
            <LinearGradient
              colors={[color, `${color}CC`]}
              style={styles.levelBadge}
            >
              <Text style={styles.levelEmoji}>{getLevelEmoji(item.word.level)}</Text>
              <Text style={styles.levelText}>{item.word.level}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.wordTranslation}>{translation}</Text>
          <View style={styles.wordMeta}>
            <Text style={styles.dateText}>{'\u{1F4C5}'} {item.learnedDate}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleFavPress}
          style={[styles.favButton, item.isFavorite && styles.favButtonActive]}
        >
          <Text style={[styles.favIcon, item.isFavorite && styles.favIconActive]}>
            {item.isFavorite ? '\u2665' : '\u2661'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const HistoryScreen: React.FC<HistoryScreenProps> = ({ nativeLanguage, onClose }) => {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);
  const [words, setWords] = useState<LearnedWord[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const emptyAnim = useRef(new Animated.Value(0)).current;
  const emptyBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWords();
  }, []);

  useEffect(() => {
    if (filteredWords.length === 0) {
      Animated.parallel([
        Animated.timing(emptyAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(emptyBounce, { toValue: -10, duration: 1500, useNativeDriver: true }),
            Animated.timing(emptyBounce, { toValue: 10, duration: 1500, useNativeDriver: true }),
          ])
        ),
      ]).start();
    }
  }, [filter, words.length]);

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

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'A1': '#10B981', 'A2': '#34D399',
      'B1': '#F59E0B', 'B2': '#EF4444',
      'C1': '#8B5CF6', 'C2': '#6366F1',
    };
    return colors[level] || '#94A3B8';
  };

  const getLevelEmoji = (level: string) => {
    const emojis: Record<string, string> = {
      'A1': '\u{1F331}', 'A2': '\u{1F33F}',
      'B1': '\u{1F525}', 'B2': '\u{1F4A5}',
      'C1': '\u{1F680}', 'C2': '\u{1F451}',
    };
    return emojis[level] || '\u{2B50}';
  };

  const renderWord = ({ item, index }: { item: LearnedWord; index: number }) => (
    <AnimatedWordCard
      item={item}
      index={index}
      nativeLanguage={nativeLanguage}
      onToggleFavorite={handleToggleFavorite}
      getLevelColor={getLevelColor}
      getLevelEmoji={getLevelEmoji}
    />
  );

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'\u{1F4DA}'} {t('wordHistory')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={filter === 'all' ? ['#6366F1', '#8B5CF6'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
              style={[styles.filterTab]}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                {t('all')} ({words.length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('favorites')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={filter === 'favorites' ? ['#EF4444', '#F87171'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
              style={[styles.filterTab]}
            >
              <Text style={[styles.filterText, filter === 'favorites' && styles.filterTextActive]}>
                {'\u2665'} {t('favorites')} ({words.filter(w => w.isFavorite).length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Word List */}
        {filteredWords.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: emptyAnim }]}>
            <Animated.Text style={[styles.emptyEmoji, { transform: [{ translateY: emptyBounce }] }]}>
              {filter === 'favorites' ? '\u{1F494}' : '\u{1F4AD}'}
            </Animated.Text>
            <Text style={styles.emptyTitle}>
              {filter === 'favorites' ? t('noFavoritesYet') : t('noWordsYet')}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'favorites' ? t('noFavoritesHint') : t('noWordsHint')}
            </Text>
          </Animated.View>
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeIcon: { fontSize: 20, color: '#FFFFFF', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  placeholder: { width: 42 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  filterTab: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  wordCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  wordLeft: { flex: 1 },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  wordTarget: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelEmoji: {
    fontSize: 10,
    marginRight: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  wordTranslation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
  },
  favButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  favButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  favIcon: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.2)',
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
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HistoryScreen;
