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
import { LeaderboardEntry, LeaderboardData, LeagueType } from '../types';
import { getLeaderboard, getWeeklyLeaderboard, LEAGUES } from '../utils/leaderboard';

const { width } = Dimensions.get('window');

type LeaderboardScreenProps = {
  onClose: () => void;
};

type TabMode = 'allTime' | 'weekly';

// Podyum karti (ilk 3 icin)
const PodiumCard: React.FC<{ entry: LeaderboardEntry; rank: number }> = ({ entry, rank }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: rank * 150,
      useNativeDriver: true,
    }).start();
  }, []);

  const medalColors: Record<number, [string, string]> = {
    1: ['#FFD700', '#FFA500'],
    2: ['#C0C0C0', '#A0A0A0'],
    3: ['#CD7F32', '#8B4513'],
  };

  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
  const heights = [100, 80, 68];

  return (
    <Animated.View style={[styles.podiumCard, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.podiumAvatar}>{entry.avatar}</Text>
      <Text style={styles.podiumMedal}>{medals[rank - 1]}</Text>
      <Text style={[styles.podiumName, entry.isCurrentUser && styles.podiumNameHighlight]}>
        {entry.name}
      </Text>
      <LinearGradient
        colors={medalColors[rank] || ['#6366F1', '#818CF8']}
        style={[styles.podiumBar, { height: heights[rank - 1] }]}
      >
        <Text style={styles.podiumXP}>{entry.xp}</Text>
        <Text style={styles.podiumXPLabel}>XP</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// Normal siralama karti (4. siradan itibaren)
const RankCard: React.FC<{
  entry: LeaderboardEntry;
  rank: number;
  index: number;
}> = ({ entry, rank, index }) => {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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
        duration: 250,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: opacityAnim,
      transform: [{ translateY: slideAnim }],
    }}>
      <View style={[styles.rankCard, entry.isCurrentUser && styles.rankCardHighlight]}>
        <Text style={[styles.rankNumber, entry.isCurrentUser && styles.rankNumberHighlight]}>
          {rank}
        </Text>
        <Text style={styles.rankAvatar}>{entry.avatar}</Text>
        <View style={styles.rankInfo}>
          <Text style={[styles.rankName, entry.isCurrentUser && styles.rankNameHighlight]}>
            {entry.name} {entry.isCurrentUser ? '(Sen)' : ''}
          </Text>
          <View style={styles.rankMeta}>
            <Text style={styles.rankMetaText}>{'\u{1F525}'} {entry.streak}</Text>
            <Text style={styles.rankMetaDivider}>|</Text>
            <Text style={styles.rankMetaText}>{'\u{1F4DA}'} {entry.wordsLearned}</Text>
          </View>
        </View>
        <View style={styles.rankXPContainer}>
          <Text style={[styles.rankXP, entry.isCurrentUser && styles.rankXPHighlight]}>
            {entry.xp}
          </Text>
          <Text style={styles.rankXPLabel}>XP</Text>
          <Text style={styles.rankLevel}>Lv.{entry.level}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onClose }) => {
  const [tab, setTab] = useState<TabMode>('allTime');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [league, setLeague] = useState<LeagueType>('bronze');
  const [weekStart, setWeekStart] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [tab]);

  const loadLeaderboard = async () => {
    const data: LeaderboardData = tab === 'allTime'
      ? await getLeaderboard()
      : await getWeeklyLeaderboard();
    setEntries(data.entries);
    setLeague(data.league);
    setWeekStart(data.weekStart);
  };

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Podyum siralamasini duzelt: 2. - 1. - 3.
  const podiumOrder = topThree.length === 3
    ? [topThree[1], topThree[0], topThree[2]]
    : topThree;
  const podiumRanks = topThree.length === 3 ? [2, 1, 3] : [1, 2, 3];

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Liderlik Tablosu</Text>
          <View style={[styles.leagueBadge, { backgroundColor: `${LEAGUES[league].color}25`, borderColor: `${LEAGUES[league].color}50` }]}>
            <Text style={styles.leagueBadgeText}>{LEAGUES[league].emoji}</Text>
          </View>
        </View>

        {/* Tab secici */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab('allTime'); }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={tab === 'allTime' ? ['#6366F1', '#8B5CF6'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
              style={styles.tabButton}
            >
              <Text style={[styles.tabText, tab === 'allTime' && styles.tabTextActive]}>
                Tum Zamanlar
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab('weekly'); }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={tab === 'weekly' ? ['#F59E0B', '#EF4444'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
              style={styles.tabButton}
            >
              <Text style={[styles.tabText, tab === 'weekly' && styles.tabTextActive]}>
                Bu Hafta
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Podyum */}
        {topThree.length >= 3 && (
          <View style={styles.podiumContainer}>
            {podiumOrder.map((entry, i) => (
              <PodiumCard key={entry.id} entry={entry} rank={podiumRanks[i]} />
            ))}
          </View>
        )}

        {/* Geri kalan siralama */}
        <FlatList
          data={rest}
          renderItem={({ item, index }) => (
            <RankCard entry={item} rank={index + 4} index={index} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
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
  leagueBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  leagueBadgeText: { fontSize: 20 },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Podyum
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  podiumCard: {
    alignItems: 'center',
    flex: 1,
  },
  podiumAvatar: {
    fontSize: 28,
    marginBottom: 4,
  },
  podiumMedal: {
    fontSize: 20,
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
    textAlign: 'center',
  },
  podiumNameHighlight: {
    color: '#818CF8',
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumXP: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  podiumXPLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  // Siralama listesi
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  rankCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rankCardHighlight: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderColor: 'rgba(99,102,241,0.25)',
  },
  rankNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    width: 28,
    textAlign: 'center',
  },
  rankNumberHighlight: {
    color: '#818CF8',
  },
  rankAvatar: {
    fontSize: 24,
    marginRight: 10,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  rankNameHighlight: {
    color: '#FFFFFF',
  },
  rankMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rankMetaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
  rankMetaDivider: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.15)',
    marginHorizontal: 6,
  },
  rankXPContainer: {
    alignItems: 'center',
  },
  rankXP: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
  },
  rankXPHighlight: {
    color: '#818CF8',
  },
  rankXPLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.25)',
  },
  rankLevel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
});

export default LeaderboardScreen;
