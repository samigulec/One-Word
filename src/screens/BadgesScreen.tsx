import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge, EarnedBadge, BadgeCategory } from '../types';
import { ALL_BADGES, getBadgesByCategory } from '../utils/badges';
import { getEarnedBadges } from '../utils/storage';

type BadgesScreenProps = {
  onClose: () => void;
};

// Kategori basliklari ve emojileri
const CATEGORY_INFO: Record<BadgeCategory, { title: string; emoji: string }> = {
  streak: { title: 'Seri Rozetleri', emoji: '\u{1F525}' },
  words: { title: 'Kelime Rozetleri', emoji: '\u{1F4DA}' },
  quiz: { title: 'Quiz Rozetleri', emoji: '\u{1F9E0}' },
  level: { title: 'Seviye Rozetleri', emoji: '\u{1F4CA}' },
  special: { title: 'Ozel Rozetler', emoji: '\u{2B50}' },
};

const CATEGORIES: BadgeCategory[] = ['streak', 'words', 'quiz', 'level', 'special'];

const BadgesScreen: React.FC<BadgesScreenProps> = ({ onClose }) => {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadBadges();
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadBadges = async () => {
    const badges = await getEarnedBadges();
    setEarnedBadges(badges);
  };

  const earnedIds = new Set(earnedBadges.map(b => b.badgeId));
  const totalEarned = earnedBadges.length;
  const totalBadges = ALL_BADGES.length;

  // Kazanilma tarihini bul
  const getEarnedDate = (badgeId: string): string | null => {
    const earned = earnedBadges.find(b => b.badgeId === badgeId);
    return earned ? earned.earnedDate : null;
  };

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'\u{1F3C6}'} Rozetler</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Ilerleme ozeti */}
        <View style={styles.progressBar}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>{totalEarned}/{totalBadges}</Text>
            <Text style={styles.progressLabel}>Rozet Kazanildi</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(totalEarned / totalBadges) * 100}%` }]} />
          </View>
        </View>

        <Animated.View style={{ flex: 1, opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((category) => {
              const info = CATEGORY_INFO[category];
              const badges = getBadgesByCategory(category);

              return (
                <View key={category}>
                  <Text style={styles.sectionTitle}>{info.emoji} {info.title}</Text>
                  <View style={styles.badgeGrid}>
                    {badges.map((badge) => {
                      const isEarned = earnedIds.has(badge.id);
                      const earnedDate = getEarnedDate(badge.id);

                      return (
                        <View
                          key={badge.id}
                          style={[styles.badgeCard, !isEarned && styles.badgeCardLocked]}
                        >
                          <Text style={[styles.badgeEmoji, !isEarned && styles.badgeEmojiLocked]}>
                            {isEarned ? badge.emoji : '\u{1F512}'}
                          </Text>
                          <Text style={[styles.badgeName, !isEarned && styles.badgeNameLocked]}>
                            {badge.name}
                          </Text>
                          <Text style={[styles.badgeDesc, !isEarned && styles.badgeDescLocked]}>
                            {badge.description}
                          </Text>
                          {isEarned && earnedDate && (
                            <Text style={styles.badgeDate}>{earnedDate}</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
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
  progressBar: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#A78BFA',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 14,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: 16,
    padding: 14,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
    flexGrow: 1,
    flexBasis: '46%',
  },
  badgeCardLocked: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  badgeEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  badgeEmojiLocked: {
    opacity: 0.4,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: 'rgba(255,255,255,0.3)',
  },
  badgeDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 15,
  },
  badgeDescLocked: {
    color: 'rgba(255,255,255,0.2)',
  },
  badgeDate: {
    fontSize: 10,
    color: '#A78BFA',
    marginTop: 6,
    fontWeight: '600',
  },
});

export default BadgesScreen;
