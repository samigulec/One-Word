import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { LearnedWord, UserProgress } from '../types';
import { getUserProgress, getEarnedBadges, getQuizCount } from '../utils/storage';
import { loadContentForLanguage } from '../utils/contentLoader';

type WeeklySummaryScreenProps = {
  onClose: () => void;
  targetLanguage?: string;
};

// Kategori bilgi haritasi verisi
interface CategoryMapData {
  category: string;
  learned: number;
  total: number;
  ratio: number; // 0-1
}

const { width } = Dimensions.get('window');
const BAR_MAX_HEIGHT = 100;
const DAYS_TR = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];

// Haftanin gunlerini hesapla (Pazartesi'den baslayarak)
const getWeekDates = (): string[] => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Pazar, 1=Pazartesi...
  const monday = new Date(today);
  // Pazartesiyi bul
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + diff);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

// Onceki haftanin gunlerini hesapla
const getPreviousWeekDates = (): string[] => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + diff - 7);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

// Radar chart boyutu
const RADAR_SIZE = 220;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 80;
const RADAR_LEVELS = 4;

const WeeklySummaryScreen: React.FC<WeeklySummaryScreenProps> = ({ onClose, targetLanguage }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [weeklyWords, setWeeklyWords] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [prevWeekTotal, setPrevWeekTotal] = useState(0);
  const [thisWeekTotal, setThisWeekTotal] = useState(0);
  const [topCategories, setTopCategories] = useState<{ name: string; count: number }[]>([]);
  const [knowledgeMap, setKnowledgeMap] = useState<CategoryMapData[]>([]);

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const barAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    loadData();
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadData = async () => {
    const prog = await getUserProgress();
    setProgress(prog);

    const badges = await getEarnedBadges();
    setBadgeCount(badges.length);

    const quizzes = await getQuizCount();
    setQuizCount(quizzes);

    const learnedWords = prog.learnedWords || [];
    const weekDates = getWeekDates();
    const prevWeekDates = getPreviousWeekDates();

    // Bu hafta gun bazinda kelime sayisi
    const dailyCounts = weekDates.map(date =>
      learnedWords.filter(w => w.learnedDate === date).length
    );
    setWeeklyWords(dailyCounts);

    const currentTotal = dailyCounts.reduce((a, b) => a + b, 0);
    setThisWeekTotal(currentTotal);

    // Onceki hafta toplam
    const prevTotal = prevWeekDates.reduce((acc, date) =>
      acc + learnedWords.filter(w => w.learnedDate === date).length, 0
    );
    setPrevWeekTotal(prevTotal);

    // Bu hafta ogrenilen kelimelerin kategori dagilimi
    const thisWeekWords = learnedWords.filter(w => weekDates.includes(w.learnedDate));
    const catMap: Record<string, number> = {};
    for (const w of thisWeekWords) {
      const cat = w.word.category || 'diger';
      catMap[cat] = (catMap[cat] || 0) + 1;
    }
    const sortedCats = Object.entries(catMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTopCategories(sortedCats);

    // Bilgi Haritasi -- tum ogrenilen kelimelerin kategori bazli ilerleme orani
    const lang = targetLanguage || 'en';
    const allContent = loadContentForLanguage(lang);
    const totalByCategory: Record<string, number> = {};
    for (const item of allContent) {
      const cat = item.category || 'diger';
      totalByCategory[cat] = (totalByCategory[cat] || 0) + 1;
    }
    const learnedByCategory: Record<string, number> = {};
    for (const w of learnedWords) {
      const cat = w.word.category || 'diger';
      learnedByCategory[cat] = (learnedByCategory[cat] || 0) + 1;
    }
    const mapData: CategoryMapData[] = Object.keys(totalByCategory)
      .filter(cat => totalByCategory[cat] >= 3) // En az 3 kelimelik kategoriler
      .map(cat => ({
        category: cat,
        learned: learnedByCategory[cat] || 0,
        total: totalByCategory[cat],
        ratio: Math.min((learnedByCategory[cat] || 0) / totalByCategory[cat], 1),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Radar chart icin max 8 kategori
    setKnowledgeMap(mapData);

    // Bar animasyonlari
    const maxCount = Math.max(...dailyCounts, 1);
    setTimeout(() => {
      Animated.stagger(80, barAnims.map((anim, i) =>
        Animated.spring(anim, {
          toValue: dailyCounts[i] / maxCount,
          tension: 50,
          friction: 7,
          useNativeDriver: false,
        })
      )).start();
    }, 300);
  };

  // Karsilastirma yuzde hesabi
  const changePercent = prevWeekTotal > 0
    ? Math.round(((thisWeekTotal - prevWeekTotal) / prevWeekTotal) * 100)
    : thisWeekTotal > 0 ? 100 : 0;

  const isUp = changePercent >= 0;

  // Radar chart polygon noktalarini hesapla
  const getRadarPoint = (index: number, total: number, value: number): { x: number; y: number } => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    return {
      x: RADAR_CENTER + Math.cos(angle) * RADAR_RADIUS * value,
      y: RADAR_CENTER + Math.sin(angle) * RADAR_RADIUS * value,
    };
  };

  // Radar chart grid polygon (seviye cerceveleri)
  const getGridPolygon = (total: number, level: number): string => {
    return Array.from({ length: total }, (_, i) => {
      const p = getRadarPoint(i, total, level / RADAR_LEVELS);
      return `${p.x},${p.y}`;
    }).join(' ');
  };

  // Veri polygon
  const getDataPolygon = (): string => {
    if (knowledgeMap.length === 0) return '';
    return knowledgeMap.map((d, i) => {
      const p = getRadarPoint(i, knowledgeMap.length, Math.max(d.ratio, 0.05));
      return `${p.x},${p.y}`;
    }).join(' ');
  };

  // Kategori rengini belirle (guclu=yesil, orta=sari, zayif=kirmizi)
  const getCategoryColor = (ratio: number): string => {
    if (ratio >= 0.6) return '#34D399';
    if (ratio >= 0.3) return '#FBBF24';
    return '#F87171';
  };

  // Kategori emojileri
  const categoryEmojis: Record<string, string> = {
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
    diger: '\u{2728}',
  };

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Pazartesi=0

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'\u{1F4CA}'} Haftalik Ozet</Text>
          <View style={styles.placeholder} />
        </View>

        <Animated.View style={{ flex: 1, opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* Ozet Kartlari */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>{'\u{1F4D6}'}</Text>
                <Text style={styles.statValue}>{thisWeekTotal}</Text>
                <Text style={styles.statLabel}>Kelime</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>{'\u{1F525}'}</Text>
                <Text style={styles.statValue}>{progress?.streak || 0}</Text>
                <Text style={styles.statLabel}>Gun Serisi</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>{'\u{1F3C6}'}</Text>
                <Text style={styles.statValue}>{badgeCount}</Text>
                <Text style={styles.statLabel}>Rozet</Text>
              </View>
            </View>

            {/* Onceki hafta karsilastirma */}
            <View style={styles.compareCard}>
              <Text style={styles.compareLabel}>Onceki haftaya gore</Text>
              <Text style={[styles.compareValue, { color: isUp ? '#34D399' : '#F87171' }]}>
                {isUp ? '\u2191' : '\u2193'} {Math.abs(changePercent)}%
              </Text>
            </View>

            {/* Gunluk grafik */}
            <Text style={styles.sectionTitle}>Gunluk Ogrenme</Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {weeklyWords.map((count, i) => (
                  <View key={i} style={styles.barColumn}>
                    <View style={styles.barWrapper}>
                      <Animated.View
                        style={[
                          styles.bar,
                          i === todayIndex && styles.barToday,
                          {
                            height: barAnims[i].interpolate({
                              inputRange: [0, 1],
                              outputRange: [4, BAR_MAX_HEIGHT],
                            }),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barCount}>{count}</Text>
                    <Text style={[styles.barDay, i === todayIndex && styles.barDayToday]}>
                      {DAYS_TR[i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* En Cok Ogrenilen Kategoriler */}
            {topCategories.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>En Cok Ogrenilen Kategoriler</Text>
                <View style={styles.categoriesCard}>
                  {topCategories.map((cat, i) => (
                    <View key={cat.name} style={styles.categoryRow}>
                      <View style={styles.categoryLeft}>
                        <Text style={styles.categoryEmoji}>
                          {categoryEmojis[cat.name] || '\u{2728}'}
                        </Text>
                        <Text style={styles.categoryName}>
                          {cat.name.replace('_', ' ')}
                        </Text>
                      </View>
                      <View style={styles.categoryRight}>
                        <View style={styles.categoryBarTrack}>
                          <View
                            style={[
                              styles.categoryBarFill,
                              {
                                width: `${(cat.count / (topCategories[0]?.count || 1)) * 100}%`,
                                backgroundColor: i === 0 ? '#6366F1' : i === 1 ? '#8B5CF6' : '#A78BFA',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.categoryCount}>{cat.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Bilgi Haritasi -- Radar Chart */}
            {knowledgeMap.length >= 3 && (
              <>
                <Text style={styles.sectionTitle}>{'\u{1F5FA}\u{FE0F}'} Bilgi Haritasi</Text>
                <View style={styles.radarCard}>
                  <View style={styles.radarContainer}>
                    <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
                      {/* Grid cerceveleri */}
                      {Array.from({ length: RADAR_LEVELS }, (_, level) => (
                        <Polygon
                          key={`grid-${level}`}
                          points={getGridPolygon(knowledgeMap.length, level + 1)}
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth={1}
                        />
                      ))}
                      {/* Eksen cizgileri */}
                      {knowledgeMap.map((_, i) => {
                        const p = getRadarPoint(i, knowledgeMap.length, 1);
                        return (
                          <Line
                            key={`axis-${i}`}
                            x1={RADAR_CENTER}
                            y1={RADAR_CENTER}
                            x2={p.x}
                            y2={p.y}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                          />
                        );
                      })}
                      {/* Veri polygonu */}
                      <Polygon
                        points={getDataPolygon()}
                        fill="rgba(99,102,241,0.2)"
                        stroke="#6366F1"
                        strokeWidth={2}
                      />
                      {/* Veri noktalari */}
                      {knowledgeMap.map((d, i) => {
                        const p = getRadarPoint(i, knowledgeMap.length, Math.max(d.ratio, 0.05));
                        return (
                          <Circle
                            key={`point-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={4}
                            fill={getCategoryColor(d.ratio)}
                            stroke="#0F0A2E"
                            strokeWidth={2}
                          />
                        );
                      })}
                      {/* Kategori etiketleri */}
                      {knowledgeMap.map((d, i) => {
                        const labelDist = 1.2;
                        const p = getRadarPoint(i, knowledgeMap.length, labelDist);
                        const emoji = categoryEmojis[d.category] || '\u{2728}';
                        return (
                          <SvgText
                            key={`label-${i}`}
                            x={p.x}
                            y={p.y}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fontSize={14}
                          >
                            {emoji}
                          </SvgText>
                        );
                      })}
                    </Svg>
                  </View>

                  {/* Kategori listesi -- guclu/zayif renk gosterimi */}
                  <View style={styles.radarLegend}>
                    {knowledgeMap.map((d) => (
                      <View key={d.category} style={styles.radarLegendRow}>
                        <View style={[styles.radarLegendDot, { backgroundColor: getCategoryColor(d.ratio) }]} />
                        <Text style={styles.radarLegendCategory}>
                          {d.category.replace('_', ' ')}
                        </Text>
                        <Text style={[styles.radarLegendPercent, { color: getCategoryColor(d.ratio) }]}>
                          {Math.round(d.ratio * 100)}%
                        </Text>
                        <Text style={styles.radarLegendCount}>
                          {d.learned}/{d.total}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Genel Istatistikler */}
            <Text style={styles.sectionTitle}>Genel</Text>
            <View style={styles.generalCard}>
              <View style={styles.generalRow}>
                <Text style={styles.generalLabel}>Toplam Kelime</Text>
                <Text style={styles.generalValue}>{(progress?.learnedWords || []).length}</Text>
              </View>
              <View style={styles.generalDivider} />
              <View style={styles.generalRow}>
                <Text style={styles.generalLabel}>Tamamlanan Quiz</Text>
                <Text style={styles.generalValue}>{quizCount}</Text>
              </View>
              <View style={styles.generalDivider} />
              <View style={styles.generalRow}>
                <Text style={styles.generalLabel}>Favori Kelimeler</Text>
                <Text style={styles.generalValue}>{(progress?.favorites || []).length}</Text>
              </View>
            </View>

          </ScrollView>
        </Animated.View>
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
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  // Ozet kartlari
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  // Karsilastirma
  compareCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  compareLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  compareValue: { fontSize: 16, fontWeight: '800' },

  // Grafik
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 28,
    marginBottom: 14,
  },
  chartContainer: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT + 40,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(99,102,241,0.4)',
    minHeight: 4,
  },
  barToday: {
    backgroundColor: '#6366F1',
  },
  barCount: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  barDay: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  barDayToday: {
    color: '#A78BFA',
    fontWeight: '800',
  },

  // Kategoriler
  categoriesCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  categoryEmoji: { fontSize: 16, marginRight: 8 },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'capitalize',
  },
  categoryRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    width: 24,
    textAlign: 'right',
  },

  // Radar Chart - Bilgi Haritasi
  radarCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  radarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  radarLegend: {
    gap: 6,
  },
  radarLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radarLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  radarLegendCategory: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'capitalize',
  },
  radarLegendPercent: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 8,
    width: 40,
    textAlign: 'right',
  },
  radarLegendCount: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    width: 40,
    textAlign: 'right',
  },

  // Genel istatistikler
  generalCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  generalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  generalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  generalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  generalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
  },
});

export default WeeklySummaryScreen;
