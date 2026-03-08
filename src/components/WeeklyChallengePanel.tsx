import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WeeklyChallengeData } from '../types';
import { getWeeklyChallengeProgress } from '../utils/weeklyChallenge';

// Haftalik zorluk paneli -- HomeScreen'de gosterilir
type WeeklyChallengePanelProps = {
  data: WeeklyChallengeData | null;
};

// Hedef ikon eslestirmesi
const GOAL_ICONS: Record<string, string> = {
  learn_words: '\u{1F4D6}',
  complete_quizzes: '\u{1F9E0}',
  ai_practice: '\u{1F4AC}',
};

const WeeklyChallengePanel: React.FC<WeeklyChallengePanelProps> = ({ data }) => {
  if (!data) return null;

  const progress = getWeeklyChallengeProgress(data);
  const allComplete = data.goals.every(g => g.completed);

  return (
    <View style={styles.container}>
      {/* Baslik satiri */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>{data.categoryEmoji}</Text>
          <View>
            <Text style={styles.headerTitle}>{data.themeTitle}</Text>
            <Text style={styles.headerSubtitle}>Weekly Challenge</Text>
          </View>
        </View>
        <View style={styles.progressBadge}>
          <Text style={[styles.progressText, allComplete && styles.progressComplete]}>
            {progress}%
          </Text>
        </View>
      </View>

      {/* Ilerleme cubugu */}
      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill,
          { width: `${progress}%` as any },
          allComplete && styles.progressFillComplete,
        ]} />
      </View>

      {/* Hedefler listesi */}
      <View style={styles.goalsContainer}>
        {data.goals.map((goal) => {
          const icon = GOAL_ICONS[goal.id] || '\u{2B50}';
          return (
            <View key={goal.id} style={[styles.goalRow, goal.completed && styles.goalRowCompleted]}>
              <View style={styles.goalLeft}>
                <View style={[styles.goalIconContainer, goal.completed && styles.goalIconCompleted]}>
                  {goal.completed ? (
                    <Text style={styles.goalCheck}>{'\u2713'}</Text>
                  ) : (
                    <Text style={styles.goalIcon}>{icon}</Text>
                  )}
                </View>
                <Text style={[styles.goalText, goal.completed && styles.goalTextCompleted]}>
                  {goal.description}
                </Text>
              </View>
              <Text style={[styles.goalProgress, goal.completed && styles.goalProgressCompleted]}>
                {goal.current}/{goal.target}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Tamamlandi bilgisi */}
      {allComplete && (
        <LinearGradient
          colors={['rgba(251,191,36,0.1)', 'rgba(251,191,36,0.05)']}
          style={styles.completeBanner}
        >
          <Text style={styles.completeText}>
            {'\u{1F389}'} Challenge Complete! +{data.bonusXPClaimed ? '0' : '100'} XP
          </Text>
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBadge: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A78BFA',
  },
  progressComplete: {
    color: '#34D399',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  progressFillComplete: {
    backgroundColor: '#34D399',
  },
  goalsContainer: {
    gap: 8,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  goalRowCompleted: {
    backgroundColor: 'rgba(52,211,153,0.05)',
    borderColor: 'rgba(52,211,153,0.1)',
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  goalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalIconCompleted: {
    backgroundColor: 'rgba(52,211,153,0.2)',
  },
  goalIcon: {
    fontSize: 16,
  },
  goalCheck: {
    fontSize: 16,
    fontWeight: '900',
    color: '#34D399',
  },
  goalText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },
  goalTextCompleted: {
    color: 'rgba(255,255,255,0.35)',
    textDecorationLine: 'line-through',
  },
  goalProgress: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A78BFA',
  },
  goalProgressCompleted: {
    color: '#34D399',
  },
  completeBanner: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  completeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
});

export default WeeklyChallengePanel;
