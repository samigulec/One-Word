import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Animated,
  Dimensions,
  SectionList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LearnedWord, SRSData } from '../types';
import { getLearnedWords, toggleFavorite, getAllSRSData } from '../utils/storage';
import { LanguageCode, getTranslation } from '../utils/translations';

const { width } = Dimensions.get('window');

// Gruplama tipleri
type GroupMode = 'all' | 'day' | 'week' | 'category';
type FilterMode = 'all' | 'favorites';

type HistoryScreenProps = {
  nativeLanguage: LanguageCode;
  onClose: () => void;
};

// SRS guven seviyesi renk ve etiket haritasi
const getConfidenceInfo = (confidence: number): { color: string; label: string; bgColor: string } => {
  if (confidence <= 1) return { color: '#EF4444', label: 'Yeni', bgColor: 'rgba(239,68,68,0.15)' };
  if (confidence <= 2) return { color: '#F59E0B', label: 'Zayif', bgColor: 'rgba(245,158,11,0.15)' };
  if (confidence <= 3) return { color: '#FBBF24', label: 'Orta', bgColor: 'rgba(251,191,36,0.15)' };
  if (confidence <= 4) return { color: '#34D399', label: 'Iyi', bgColor: 'rgba(52,211,153,0.15)' };
  return { color: '#10B981', label: 'Ustun', bgColor: 'rgba(16,185,129,0.15)' };
};

// Tarih formatlama yardimci fonksiyonu
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);

  if (dateStr === today.toISOString().split('T')[0]) return 'Bugun';
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Dun';

  const day = date.getDate();
  const months = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${day} ${months[date.getMonth()]}`;
};

// Hafta numarasini hesapla
const getWeekKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNum}`;
};

const getWeekLabel = (weekKey: string): string => {
  const [year, week] = weekKey.split('-W');
  return `Hafta ${week}, ${year}`;
};

// Animasyonlu kelime karti
const AnimatedWordCard: React.FC<{
  item: LearnedWord;
  index: number;
  nativeLanguage: LanguageCode;
  onToggleFavorite: (id: string) => void;
  srsData?: SRSData;
}> = ({ item, index, nativeLanguage, onToggleFavorite, srsData }) => {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        delay: Math.min(index * 40, 400),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        delay: Math.min(index * 40, 400),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFavPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onToggleFavorite(item.word.id);
  };

  const translation = item.word.translations[nativeLanguage] || item.word.translations['en'] || '';
  const confidence = srsData?.confidence || 1;
  const confidenceInfo = getConfidenceInfo(confidence);

  const getLevelColor = (level: string): string => {
    const colors: Record<string, string> = {
      'A1': '#10B981', 'A2': '#34D399',
      'B1': '#F59E0B', 'B2': '#EF4444',
      'C1': '#8B5CF6', 'C2': '#6366F1',
    };
    return colors[level] || '#94A3B8';
  };

  const levelColor = getLevelColor(item.word.level);

  return (
    <Animated.View style={{
      opacity: opacityAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
    }}>
      <View style={styles.wordCard}>
        {/* Sol kenar renk gostergesi -- SRS guven seviyesi */}
        <View style={[styles.confidenceSidebar, { backgroundColor: confidenceInfo.color }]} />

        <View style={styles.wordCardContent}>
          {/* Ust satir: emoji + kelime + seviye */}
          <View style={styles.wordTopRow}>
            {item.word.emoji && <Text style={styles.wordEmoji}>{item.word.emoji}</Text>}
            <Text style={styles.wordTarget}>{item.word.target_word}</Text>
            <LinearGradient
              colors={[levelColor, `${levelColor}CC`]}
              style={styles.levelBadge}
            >
              <Text style={styles.levelText}>{item.word.level}</Text>
            </LinearGradient>
          </View>

          {/* Ceviri */}
          <Text style={styles.wordTranslation}>{translation}</Text>

          {/* Alt satir: tarih + kategori + SRS guven */}
          <View style={styles.wordBottomRow}>
            <Text style={styles.dateText}>{formatDate(item.learnedDate)}</Text>
            {item.word.category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{item.word.category.replace('_', ' ')}</Text>
              </View>
            )}
            <View style={[styles.confidenceBadge, { backgroundColor: confidenceInfo.bgColor }]}>
              <View style={[styles.confidenceDot, { backgroundColor: confidenceInfo.color }]} />
              <Text style={[styles.confidenceText, { color: confidenceInfo.color }]}>{confidenceInfo.label}</Text>
            </View>
          </View>
        </View>

        {/* Favori butonu */}
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
  const [srsMap, setSrsMap] = useState<Record<string, SRSData>>({});
  const [filter, setFilter] = useState<FilterMode>('all');
  const [groupMode, setGroupMode] = useState<GroupMode>('all');

  const emptyAnim = useRef(new Animated.Value(0)).current;
  const emptyBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWords();
    loadSRSData();
  }, []);

  const loadWords = async () => {
    const learned = await getLearnedWords();
    // Kronolojik siralama: en son ogrenilenler en uste
    setWords(learned.sort((a, b) => b.learnedDate.localeCompare(a.learnedDate)));
  };

  const loadSRSData = async () => {
    const allSRS = await getAllSRSData();
    const map: Record<string, SRSData> = {};
    allSRS.forEach(s => { map[s.wordId] = s; });
    setSrsMap(map);
  };

  const handleToggleFavorite = async (wordId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(wordId);
    await loadWords();
  };

  // Filtrelenmis kelimeler
  const filteredWords = useMemo(() => {
    return filter === 'favorites' ? words.filter(w => w.isFavorite) : words;
  }, [words, filter]);

  // Gruplamaya gore section data olustur
  const sections = useMemo(() => {
    if (groupMode === 'all') return null;

    const grouped: Record<string, LearnedWord[]> = {};

    filteredWords.forEach(w => {
      let key: string;
      if (groupMode === 'day') {
        key = w.learnedDate;
      } else if (groupMode === 'week') {
        key = getWeekKey(w.learnedDate);
      } else {
        key = w.word.category || 'Diger';
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(w);
    });

    // Gun ve hafta icin ters kronolojik, kategori icin alfabetik siralama
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (groupMode === 'category') return a.localeCompare(b);
      return b.localeCompare(a);
    });

    return sortedKeys.map(key => ({
      title: groupMode === 'day' ? formatDate(key)
           : groupMode === 'week' ? getWeekLabel(key)
           : key.replace('_', ' '),
      data: grouped[key],
      count: grouped[key].length,
    }));
  }, [filteredWords, groupMode]);

  // Bos durum animasyonu
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

  const renderWord = ({ item, index }: { item: LearnedWord; index: number }) => (
    <AnimatedWordCard
      item={item}
      index={index}
      nativeLanguage={nativeLanguage}
      onToggleFavorite={handleToggleFavorite}
      srsData={srsMap[item.word.id]}
    />
  );

  const renderSectionHeader = ({ section }: { section: { title: string; count: number } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionCountBadge}>
        <Text style={styles.sectionCountText}>{section.count}</Text>
      </View>
    </View>
  );

  const groupButtons: { mode: GroupMode; label: string }[] = [
    { mode: 'all', label: 'Tumu' },
    { mode: 'day', label: 'Gun' },
    { mode: 'week', label: 'Hafta' },
    { mode: 'category', label: 'Kategori' },
  ];

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('wordHistory')}</Text>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>{words.length}</Text>
          </View>
        </View>

        {/* Filtre satirlari */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter('all'); }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={filter === 'all' ? ['#6366F1', '#8B5CF6'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
              style={styles.filterTab}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                {t('all')} ({words.length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter('favorites'); }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={filter === 'favorites' ? ['#EF4444', '#F87171'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
              style={styles.filterTab}
            >
              <Text style={[styles.filterText, filter === 'favorites' && styles.filterTextActive]}>
                {'\u2665'} {t('favorites')} ({words.filter(w => w.isFavorite).length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Gruplama secenekleri */}
        <View style={styles.groupRow}>
          {groupButtons.map(({ mode, label }) => (
            <TouchableOpacity
              key={mode}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGroupMode(mode); }}
              style={[styles.groupChip, groupMode === mode && styles.groupChipActive]}
            >
              <Text style={[styles.groupChipText, groupMode === mode && styles.groupChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Kelime Listesi */}
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
        ) : groupMode === 'all' ? (
          <FlatList
            data={filteredWords}
            renderItem={renderWord}
            keyExtractor={(item) => item.word.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : sections ? (
          <SectionList
            sections={sections}
            renderItem={renderWord}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.word.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
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
  headerStats: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  headerStatsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#818CF8',
  },

  // Filtre
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 10,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Gruplama
  groupRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  groupChipActive: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  groupChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
  },
  groupChipTextActive: {
    color: '#A78BFA',
    fontWeight: '700',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'capitalize',
  },
  sectionCountBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
  },

  // Liste
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Kelime Karti
  wordCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  confidenceSidebar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  wordCardContent: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },
  wordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  wordEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  wordTarget: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 8,
  },
  levelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  wordTranslation: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  wordBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
  },
  categoryTag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'capitalize',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Favori
  favButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginRight: 10,
  },
  favButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  favIcon: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.2)',
  },
  favIconActive: {
    color: '#EF4444',
  },

  // Bos durum
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
