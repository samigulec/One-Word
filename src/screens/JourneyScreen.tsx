import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LanguageCode, getTranslation } from '../utils/translations';

const { width } = Dimensions.get('window');

type JourneyScreenProps = {
  currentStreak: number;
  totalWordsLearned: number;
  nativeLanguage: LanguageCode;
  onClose: () => void;
};

interface DayNode {
  day: number;
  status: 'completed' | 'current' | 'locked';
  word?: string;
}

const JourneyScreen: React.FC<JourneyScreenProps> = ({ 
  currentStreak, 
  totalWordsLearned,
  nativeLanguage,
  onClose 
}) => {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);
  // Generate journey nodes based on streak
  const generateNodes = (): DayNode[] => {
    const nodes: DayNode[] = [];
    const totalDays = Math.max(currentStreak + 7, 14); // Show at least 14 days
    
    for (let i = 1; i <= totalDays; i++) {
      let status: 'completed' | 'current' | 'locked';
      if (i < currentStreak) {
        status = 'completed';
      } else if (i === currentStreak || (currentStreak === 0 && i === 1)) {
        status = 'current';
      } else {
        status = 'locked';
      }
      nodes.push({ day: i, status });
    }
    return nodes;
  };

  const nodes = generateNodes();
  
  // Animations
  const headerScale = useRef(new Animated.Value(0)).current;
  const pathOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(headerScale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(pathOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const getMilestone = (day: number): { emoji: string; label: string } | null => {
    if (day === 7) return { emoji: '🏆', label: t('week1') };
    if (day === 14) return { emoji: '⭐', label: t('weeks2') };
    if (day === 30) return { emoji: '🎯', label: t('month1') };
    if (day === 60) return { emoji: '🔥', label: t('months2') };
    if (day === 100) return { emoji: '💎', label: t('days100') };
    return null;
  };

  const renderNode = (node: DayNode, index: number) => {
    const isLeft = index % 2 === 0;
    const milestone = getMilestone(node.day);
    
    const nodeAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(nodeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    const getNodeStyle = () => {
      switch (node.status) {
        case 'completed':
          return styles.nodeCompleted;
        case 'current':
          return styles.nodeCurrent;
        case 'locked':
          return styles.nodeLocked;
      }
    };

    const getNodeContent = () => {
      switch (node.status) {
        case 'completed':
          return <Text style={styles.nodeIcon}>✓</Text>;
        case 'current':
          return <Text style={styles.nodeIconCurrent}>🔥</Text>;
        case 'locked':
          return <Text style={styles.nodeIconLocked}>🔒</Text>;
      }
    };

    return (
      <Animated.View 
        key={node.day}
        style={[
          styles.nodeRow,
          { opacity: nodeAnim, transform: [{ scale: nodeAnim }] }
        ]}
      >
        {/* Connector Line */}
        {index > 0 && (
          <View style={[
            styles.connector,
            isLeft ? styles.connectorLeft : styles.connectorRight,
            node.status === 'locked' && styles.connectorLocked,
          ]} />
        )}
        
        {/* Node Container */}
        <View style={[styles.nodeContainer, isLeft ? styles.nodeLeft : styles.nodeRight]}>
          {/* Day Label */}
          <View style={[styles.dayLabelContainer, !isLeft && styles.dayLabelRight]}>
            <Text style={[styles.dayLabel, node.status === 'locked' && styles.dayLabelLocked]}>
              {t('day')} {node.day}
            </Text>
            {milestone && (
              <View style={styles.milestoneBadge}>
                <Text style={styles.milestoneEmoji}>{milestone.emoji}</Text>
                <Text style={styles.milestoneLabel}>{milestone.label}</Text>
              </View>
            )}
          </View>

          {/* Node Circle */}
          <TouchableOpacity 
            style={[styles.node, getNodeStyle()]}
            disabled={node.status === 'locked'}
            onPress={() => {
              if (node.status !== 'locked') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            {getNodeContent()}
            {node.status === 'current' && <View style={styles.currentPulse} />}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('yourJourney')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Stats */}
        <Animated.View style={[styles.statsContainer, { transform: [{ scale: headerScale }] }]}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>{t('dayStreak')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statValue}>{totalWordsLearned}</Text>
            <Text style={styles.statLabel}>{t('words')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{Math.floor(currentStreak / 7)}</Text>
            <Text style={styles.statLabel}>{t('weeks')}</Text>
          </View>
        </Animated.View>

        {/* Journey Path */}
        <Animated.View style={{ flex: 1, opacity: pathOpacity }}>
          <ScrollView 
            contentContainerStyle={styles.journeyContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.journeyTitle}>{t('learningPath')}</Text>
            <Text style={styles.journeySubtitle}>{t('unlockDays')}</Text>
            
            <View style={styles.pathContainer}>
              {nodes.map((node, index) => renderNode(node, index))}
            </View>
            
            {/* Bottom Motivation */}
            <View style={styles.motivationContainer}>
              <Text style={styles.motivationEmoji}>💪</Text>
              <Text style={styles.motivationText}>
                {currentStreak === 0 
                  ? t('startJourney')
                  : currentStreak < 7 
                    ? t('keepGoing')
                    : currentStreak < 30
                      ? t('amazingProgress')
                      : t('champion')}
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Journey
  journeyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  journeyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  journeySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  // Path
  pathContainer: {
    alignItems: 'center',
  },
  nodeRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  nodeLeft: {
    justifyContent: 'flex-start',
    paddingLeft: 20,
  },
  nodeRight: {
    justifyContent: 'flex-end',
    paddingRight: 20,
  },
  
  // Connector
  connector: {
    position: 'absolute',
    width: 3,
    height: 50,
    backgroundColor: '#4CAF50',
    top: -42,
  },
  connectorLeft: {
    left: width / 2 - 30,
  },
  connectorRight: {
    right: width / 2 - 30,
  },
  connectorLocked: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Node
  node: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  nodeCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#81C784',
  },
  nodeCurrent: {
    backgroundColor: '#FF9800',
    borderColor: '#FFB74D',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  nodeLocked: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nodeIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  nodeIconCurrent: {
    fontSize: 24,
  },
  nodeIconLocked: {
    fontSize: 18,
  },
  currentPulse: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FF9800',
    opacity: 0.3,
  },

  // Day Label
  dayLabelContainer: {
    marginRight: 12,
    alignItems: 'flex-end',
  },
  dayLabelRight: {
    marginRight: 0,
    marginLeft: 12,
    alignItems: 'flex-start',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayLabelLocked: {
    color: 'rgba(255,255,255,0.4)',
  },

  // Milestone
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  milestoneEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  milestoneLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },

  // Motivation
  motivationContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 32,
  },
  motivationEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default JourneyScreen;




