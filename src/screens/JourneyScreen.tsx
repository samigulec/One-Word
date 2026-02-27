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
}

const JourneyScreen: React.FC<JourneyScreenProps> = ({
  currentStreak,
  totalWordsLearned,
  nativeLanguage,
  onClose
}) => {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, nativeLanguage);

  const generateNodes = (): DayNode[] => {
    const nodes: DayNode[] = [];
    const totalDays = Math.max(currentStreak + 7, 14);

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

  const headerScale = useRef(new Animated.Value(0)).current;
  const pathOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(headerScale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(pathOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const getMilestone = (day: number): { label: string } | null => {
    if (day === 7) return { label: t('week1') };
    if (day === 14) return { label: t('weeks2') };
    if (day === 30) return { label: t('month1') };
    if (day === 60) return { label: t('months2') };
    if (day === 100) return { label: t('days100') };
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
          return <Text style={styles.nodeIcon}>{'\u2713'}</Text>;
        case 'current':
          return <Text style={styles.nodeIconCurrent}>{'\u2022'}</Text>;
        case 'locked':
          return <Text style={styles.nodeIconLocked}>{'\u2014'}</Text>;
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
        {index > 0 && (
          <View style={[
            styles.connector,
            isLeft ? styles.connectorLeft : styles.connectorRight,
            node.status === 'locked' && styles.connectorLocked,
          ]} />
        )}

        <View style={[styles.nodeContainer, isLeft ? styles.nodeLeft : styles.nodeRight]}>
          <View style={[styles.dayLabelContainer, !isLeft && styles.dayLabelRight]}>
            <Text style={[styles.dayLabel, node.status === 'locked' && styles.dayLabelLocked]}>
              {t('day')} {node.day}
            </Text>
            {milestone && (
              <View style={styles.milestoneBadge}>
                <Text style={styles.milestoneLabel}>{milestone.label}</Text>
              </View>
            )}
          </View>

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
    <LinearGradient colors={['#1E1B4B', '#312E81', '#3730A3']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('yourJourney')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Stats */}
        <Animated.View style={[styles.statsContainer, { transform: [{ scale: headerScale }] }]}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>{t('dayStreak')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalWordsLearned}</Text>
            <Text style={styles.statLabel}>{t('words')}</Text>
          </View>
          <View style={styles.statCard}>
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontWeight: '500',
  },

  // Journey
  journeyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  journeyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  journeySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
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
    width: 2,
    height: 50,
    backgroundColor: '#10B981',
    top: -42,
  },
  connectorLeft: {
    left: width / 2 - 30,
  },
  connectorRight: {
    right: width / 2 - 30,
  },
  connectorLocked: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Node
  node: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  nodeCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  nodeCurrent: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  nodeLocked: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  nodeIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nodeIconCurrent: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  nodeIconLocked: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.3)',
  },
  currentPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#6366F1',
    opacity: 0.25,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dayLabelLocked: {
    color: 'rgba(255,255,255,0.35)',
  },

  // Milestone
  milestoneBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  milestoneLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A5B4FC',
  },

  // Motivation
  motivationContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  motivationText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
});

export default JourneyScreen;
