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
  Easing,
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
  const statSlide1 = useRef(new Animated.Value(50)).current;
  const statSlide2 = useRef(new Animated.Value(50)).current;
  const statSlide3 = useRef(new Animated.Value(50)).current;
  const statOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.spring(headerScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(statOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.spring(statSlide1, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(statSlide2, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(statSlide3, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(pathOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const getMilestone = (day: number): { label: string; emoji: string } | null => {
    if (day === 7) return { label: t('week1'), emoji: '\u{2B50}' };
    if (day === 14) return { label: t('weeks2'), emoji: '\u{1F31F}' };
    if (day === 30) return { label: t('month1'), emoji: '\u{1F3C6}' };
    if (day === 60) return { label: t('months2'), emoji: '\u{1F48E}' };
    if (day === 100) return { label: t('days100'), emoji: '\u{1F451}' };
    return null;
  };

  const renderNode = (node: DayNode, index: number) => {
    const isLeft = index % 2 === 0;
    const milestone = getMilestone(node.day);

    const nodeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.timing(nodeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();

      if (node.status === 'current') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }, []);

    const getNodeContent = () => {
      switch (node.status) {
        case 'completed':
          return <Text style={styles.nodeIcon}>{'\u2713'}</Text>;
        case 'current':
          return <Text style={styles.nodeIconCurrent}>{'\u{2728}'}</Text>;
        case 'locked':
          return <Text style={styles.nodeIconLocked}>{'\u{1F512}'}</Text>;
      }
    };

    return (
      <Animated.View
        key={node.day}
        style={[
          styles.nodeRow,
          {
            opacity: nodeAnim,
            transform: [
              { scale: nodeAnim },
              { translateX: nodeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [isLeft ? -30 : 30, 0],
              })},
            ]
          }
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
              <LinearGradient
                colors={['rgba(139,92,246,0.3)', 'rgba(99,102,241,0.3)']}
                style={styles.milestoneBadge}
              >
                <Text style={styles.milestoneEmoji}>{milestone.emoji}</Text>
                <Text style={styles.milestoneLabel}>{milestone.label}</Text>
              </LinearGradient>
            )}
          </View>

          <Animated.View style={node.status === 'current' ? { transform: [{ scale: pulseAnim }] } : undefined}>
            <TouchableOpacity
              disabled={node.status === 'locked'}
              onPress={() => {
                if (node.status !== 'locked') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              {node.status === 'completed' ? (
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={[styles.node, styles.nodeCompleted]}
                >
                  {getNodeContent()}
                </LinearGradient>
              ) : node.status === 'current' ? (
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={[styles.node, styles.nodeCurrent]}
                >
                  {getNodeContent()}
                  <View style={styles.currentPulse} />
                </LinearGradient>
              ) : (
                <View style={[styles.node, styles.nodeLocked]}>
                  {getNodeContent()}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    );
  };

  const getMotivationEmoji = () => {
    if (currentStreak === 0) return '\u{1F331}';
    if (currentStreak < 7) return '\u{1F4AA}';
    if (currentStreak < 30) return '\u{1F525}';
    return '\u{1F451}';
  };

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#251B5E']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'\u{1F680}'} {t('yourJourney')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Stats */}
        <Animated.View style={[styles.statsContainer, { opacity: statOpacity }]}>
          <Animated.View style={{ transform: [{ translateY: statSlide1 }] }}>
            <LinearGradient
              colors={['rgba(245,158,11,0.15)', 'rgba(239,68,68,0.15)']}
              style={styles.statCard}
            >
              <Text style={styles.statEmoji}>{'\u{1F525}'}</Text>
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>{t('dayStreak')}</Text>
            </LinearGradient>
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: statSlide2 }] }}>
            <LinearGradient
              colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.15)']}
              style={styles.statCard}
            >
              <Text style={styles.statEmoji}>{'\u{1F4DA}'}</Text>
              <Text style={styles.statValue}>{totalWordsLearned}</Text>
              <Text style={styles.statLabel}>{t('words')}</Text>
            </LinearGradient>
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: statSlide3 }] }}>
            <LinearGradient
              colors={['rgba(16,185,129,0.15)', 'rgba(5,150,105,0.15)']}
              style={styles.statCard}
            >
              <Text style={styles.statEmoji}>{'\u{1F4C5}'}</Text>
              <Text style={styles.statValue}>{Math.floor(currentStreak / 7)}</Text>
              <Text style={styles.statLabel}>{t('weeks')}</Text>
            </LinearGradient>
          </Animated.View>
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
            <LinearGradient
              colors={['rgba(99,102,241,0.1)', 'rgba(139,92,246,0.1)']}
              style={styles.motivationContainer}
            >
              <Text style={styles.motivationEmoji}>{getMotivationEmoji()}</Text>
              <Text style={styles.motivationText}>
                {currentStreak === 0
                  ? t('startJourney')
                  : currentStreak < 7
                    ? t('keepGoing')
                    : currentStreak < 30
                      ? t('amazingProgress')
                      : t('champion')}
              </Text>
            </LinearGradient>
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 42,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    minWidth: 95,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    marginTop: 16,
  },
  journeySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Node
  node: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  nodeCompleted: {
    borderColor: '#34D399',
  },
  nodeCurrent: {
    borderColor: '#818CF8',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  nodeLocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  nodeIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nodeIconCurrent: {
    fontSize: 20,
  },
  nodeIconLocked: {
    fontSize: 14,
  },
  currentPulse: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#6366F1',
    opacity: 0.2,
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
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  dayLabelLocked: {
    color: 'rgba(255,255,255,0.25)',
  },

  // Milestone
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  milestoneEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  milestoneLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
  },

  // Motivation
  motivationContainer: {
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  motivationEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default JourneyScreen;
