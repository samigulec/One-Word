// QuestsScreen.tsx -- Gunluk gorevler, haftalik zorluk, rozetler ve journey milestones
// v2.0.0 UX yeniden tasarimi: Ana sayfadan tasindi

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
// @ts-ignore
import { captureRef } from 'react-native-view-shot';
// @ts-ignore
import * as Sharing from 'expo-sharing';
import { Badge, EarnedBadge, BadgeCategory, DailyTasksData, DailyTaskId, WeeklyChallengeData, UserProgress, LevelInfo } from '../types';
import { ALL_BADGES, getBadgesByCategory } from '../utils/badges';
import { getEarnedBadges, getDailyTasks, completeDailyTask, claimDailyTasksBonus, getWeeklyChallenge, updateWeeklyChallengeGoal, claimWeeklyChallengeBonus, getUserProgress, getDailyXPStatus, addXP } from '../utils/storage';
import { getWeeklyChallengeProgress } from '../utils/weeklyChallenge';
import { LanguageCode, getTranslation as getUITranslation } from '../utils/translations';
import { ShareTemplate } from '../types';
import { createStreakTemplate, createWordsTemplate } from '../utils/shareTemplates';
import ShareAchievementCard from '../components/ShareAchievementCard';

const { width } = Dimensions.get('window');

// Gunluk gorev ikon ve label eslestirmesi
const TASK_CONFIG: Record<DailyTaskId, { icon: string; labelKey: 'taskLearnWord' | 'taskDiscoverMeaning' | 'taskPracticeAI' }> = {
  learn_word: { icon: '\u{1F4D6}', labelKey: 'taskLearnWord' },
  discover_meaning: { icon: '\u{1F50D}', labelKey: 'taskDiscoverMeaning' },
  practice_ai: { icon: '\u{1F4AC}', labelKey: 'taskPracticeAI' },
};

// Rozet kategori bilgileri
// Rozet kategori bilgileri -- ceviri anahtarlari ve emojiler
const CATEGORY_KEYS: Record<BadgeCategory, { titleKey: 'categoryStreak' | 'categoryWords' | 'categoryQuiz' | 'categoryLevel' | 'categorySpecial'; emoji: string }> = {
  streak: { titleKey: 'categoryStreak', emoji: '\u{1F525}' },
  words: { titleKey: 'categoryWords', emoji: '\u{1F4DA}' },
  quiz: { titleKey: 'categoryQuiz', emoji: '\u{1F9E0}' },
  level: { titleKey: 'categoryLevel', emoji: '\u{1F4CA}' },
  special: { titleKey: 'categorySpecial', emoji: '\u{2B50}' },
};

const CATEGORIES: BadgeCategory[] = ['streak', 'words', 'quiz', 'level', 'special'];

// Hedef ikon eslestirmesi (haftalik zorluk)
const GOAL_ICONS: Record<string, string> = {
  learn_words: '\u{1F4D6}',
  complete_quizzes: '\u{1F9E0}',
  ai_practice: '\u{1F4AC}',
};

// Tab secenekleri
type QuestTab = 'daily' | 'weekly' | 'badges' | 'journey';

type QuestsScreenProps = {
  nativeLanguage: LanguageCode;
  onClose: () => void;
  onNavigateToWeeklySummary?: () => void;
};

const QuestsScreen: React.FC<QuestsScreenProps> = ({
  nativeLanguage,
  onClose,
  onNavigateToWeeklySummary,
}) => {
  const t = (key: Parameters<typeof getUITranslation>[0]) => getUITranslation(key, nativeLanguage);

  // Aktif tab state
  const [activeTab, setActiveTab] = useState<QuestTab>('daily');

  // Gunluk gorev state'leri
  const [dailyTasks, setDailyTasks] = useState<DailyTasksData | null>(null);

  // Haftalik zorluk state
  const [weeklyChallenge, setWeeklyChallenge] = useState<WeeklyChallengeData | null>(null);

  // Rozet state'leri
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);

  // Journey state'leri
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  // Paylasim state'leri
  const [isSharing, setIsSharing] = useState(false);
  const [shareTemplate, setShareTemplate] = useState<ShareTemplate | null>(null);
  const shareCardRef = useRef<View>(null);

  // Animasyonlar
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Gorev tamamlanma animasyonlari
  const taskCheckScales = useRef<Record<string, Animated.Value>>({
    learn_word: new Animated.Value(0),
    discover_meaning: new Animated.Value(0),
    practice_ai: new Animated.Value(0),
  }).current;

  useEffect(() => {
    loadAllData();
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Tum verileri yukle
  const loadAllData = async () => {
    const [tasks, challenge, badges, progress] = await Promise.all([
      getDailyTasks(),
      getWeeklyChallenge(),
      getEarnedBadges(),
      getUserProgress(),
    ]);

    setDailyTasks(tasks);
    setWeeklyChallenge(challenge);
    setEarnedBadges(badges);
    setUserProgress(progress);

    // Tamamlanmis gorevlerin checkmark animasyonlarini baslat
    tasks.tasks.forEach(task => {
      if (task.completed) {
        taskCheckScales[task.id].setValue(1);
      }
    });
  };

  // Gorev etiketini getir
  const getTaskLabel = (taskId: DailyTaskId): string => {
    const config = TASK_CONFIG[taskId];
    return config ? t(config.labelKey) : taskId;
  };

  // Gorev ikonunu getir
  const getTaskIcon = (taskId: DailyTaskId): string => {
    const config = TASK_CONFIG[taskId];
    return config ? config.icon : '\u{2753}';
  };

  // Basari paylasim fonksiyonu
  const handleShareAchievement = useCallback(async (template: ShareTemplate) => {
    setShareTemplate(template);
    setIsSharing(true);
    setTimeout(async () => {
      try {
        if (!shareCardRef.current) {
          setIsSharing(false);
          return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const uri = await captureRef(shareCardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Achievement',
          });
        }
      } catch (error) {
        console.error('Share error:', error);
      } finally {
        setIsSharing(false);
      }
    }, 200);
  }, []);

  // Journey milestone verileri
  interface DayNode {
    day: number;
    status: 'completed' | 'current' | 'locked';
  }

  const generateNodes = (): DayNode[] => {
    const streak = userProgress?.streak || 0;
    const nodes: DayNode[] = [];
    const totalDays = Math.max(streak + 7, 14);
    for (let i = 1; i <= totalDays; i++) {
      let status: 'completed' | 'current' | 'locked';
      if (i < streak) status = 'completed';
      else if (i === streak || (streak === 0 && i === 1)) status = 'current';
      else status = 'locked';
      nodes.push({ day: i, status });
    }
    return nodes;
  };

  const getMilestone = (day: number): { label: string; emoji: string } | null => {
    if (day === 7) return { label: t('week1'), emoji: '\u{2B50}' };
    if (day === 14) return { label: t('weeks2'), emoji: '\u{1F31F}' };
    if (day === 30) return { label: t('month1'), emoji: '\u{1F3C6}' };
    if (day === 60) return { label: t('months2'), emoji: '\u{1F48E}' };
    if (day === 100) return { label: t('days100'), emoji: '\u{1F451}' };
    return null;
  };

  // Rozet yardimci fonksiyonlari
  const earnedIds = new Set(earnedBadges.map(b => b.badgeId));
  const totalEarned = earnedBadges.length;
  const totalBadges = ALL_BADGES.length;

  const getEarnedDate = (badgeId: string): string | null => {
    const earned = earnedBadges.find(b => b.badgeId === badgeId);
    return earned ? earned.earnedDate : null;
  };

  // Tab secici renderla
  const renderTabBar = () => (
    <View style={styles.tabSelector}>
      {([
        { id: 'daily' as QuestTab, label: t('questsDaily'), icon: '\u{2705}' },
        { id: 'weekly' as QuestTab, label: t('questsWeekly'), icon: '\u{1F3AF}' },
        { id: 'badges' as QuestTab, label: t('questsBadges'), icon: '\u{1F3C6}' },
        { id: 'journey' as QuestTab, label: t('questsJourney'), icon: '\u{1F680}' },
      ]).map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab(tab.id);
          }}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: activeTab === tab.id }}
        >
          <Text style={styles.tabItemIcon}>{tab.icon}</Text>
          <Text style={[styles.tabItemLabel, activeTab === tab.id && styles.tabItemLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Gunluk gorevler tab icerig
  const renderDailyTab = () => (
    <View style={styles.tabContent}>
      {dailyTasks && (
        <>
          {/* Gorev baslik */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">{'\u{2705}'} {t('dailyTasks')}</Text>
            {dailyTasks.allCompleted && (
              <View style={styles.completeBadge}>
                <Text style={styles.completeBadgeText}>{t('dailyTasksComplete')}</Text>
              </View>
            )}
          </View>

          {/* Gorevler listesi */}
          {dailyTasks.tasks.map((task) => (
            <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardCompleted]} accessibilityLabel={`${getTaskLabel(task.id)}, ${task.completed ? 'completed' : 'not completed'}, ${task.xp} XP`}>
              <View style={styles.taskLeft}>
                <View style={[styles.taskIconContainer, task.completed && styles.taskIconCompleted]}>
                  {task.completed ? (
                    <Animated.View style={{ transform: [{ scale: taskCheckScales[task.id] }] }}>
                      <Text style={styles.taskCheckmark}>{'\u2713'}</Text>
                    </Animated.View>
                  ) : (
                    <Text style={styles.taskIcon}>{getTaskIcon(task.id)}</Text>
                  )}
                </View>
                <Text style={[styles.taskLabel, task.completed && styles.taskLabelCompleted]}>
                  {getTaskLabel(task.id)}
                </Text>
              </View>
              <View style={[styles.taskXPBadge, task.completed && styles.taskXPBadgeCompleted]}>
                <Text style={[styles.taskXPText, task.completed && styles.taskXPTextCompleted]}>
                  +{task.xp} XP
                </Text>
              </View>
            </View>
          ))}

          {/* Bonus bilgisi */}
          {dailyTasks.allCompleted && dailyTasks.bonusClaimed && (
            <View style={styles.bonusRow}>
              <Text style={styles.bonusText}>{'\u{1F381}'} {t('dailyTasksBonus')}: +30 XP</Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  // Haftalik zorluk tab icerigi
  const renderWeeklyTab = () => {
    if (!weeklyChallenge) return null;
    const progress = getWeeklyChallengeProgress(weeklyChallenge);
    const allComplete = weeklyChallenge.goals.every(g => g.completed);

    return (
      <View style={styles.tabContent}>
        {/* Zorluk baslik */}
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeEmoji}>{weeklyChallenge.categoryEmoji}</Text>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle} accessibilityRole="header">{weeklyChallenge.themeTitle}</Text>
            <Text style={styles.challengeSubtitle}>{t('weeklyChallenge')}</Text>
          </View>
          <View style={styles.challengeProgressBadge}>
            <Text style={[styles.challengeProgressText, allComplete && styles.challengeProgressComplete]}>
              {progress}%
            </Text>
          </View>
        </View>

        {/* Ilerleme cubugu */}
        <View style={styles.challengeProgressBar}>
          <View style={[
            styles.challengeProgressFill,
            { width: `${progress}%` as any },
            allComplete && styles.challengeProgressFillComplete,
          ]} />
        </View>

        {/* Hedefler listesi */}
        {weeklyChallenge.goals.map((goal) => {
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

        {/* Tamamlandi bilgisi */}
        {allComplete && (
          <LinearGradient
            colors={['rgba(251,191,36,0.1)', 'rgba(251,191,36,0.05)']}
            style={styles.challengeCompleteBanner}
          >
            <Text style={styles.challengeCompleteText}>
              {'\u{1F389}'} Challenge Complete! +{weeklyChallenge.bonusXPClaimed ? '0' : '100'} XP
            </Text>
          </LinearGradient>
        )}

        {/* Haftalik Ozet butonu */}
        {onNavigateToWeeklySummary && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onNavigateToWeeklySummary();
            }}
            activeOpacity={0.8}
            style={styles.weeklySummaryButton}
            accessibilityRole="button"
            accessibilityLabel="Weekly Summary"
            accessibilityHint="Shows your weekly progress statistics"
          >
            <LinearGradient
              colors={['rgba(52,211,153,0.15)', 'rgba(16,185,129,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.weeklySummaryInner}
            >
              <Text style={styles.weeklySummaryEmoji}>{'\u{1F4CA}'}</Text>
              <View style={styles.weeklySummaryTextContainer}>
                <Text style={styles.weeklySummaryTitle}>{t('weeklySummary')}</Text>
                <Text style={styles.weeklySummarySubtitle}>{t('progressStats')}</Text>
              </View>
              <Text style={styles.weeklySummaryArrow}>{'\u203A'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Rozetler tab icerigi
  const renderBadgesTab = () => (
    <View style={styles.tabContent}>
      {/* Ilerleme ozeti */}
      <View style={styles.badgeProgressBar}>
        <View style={styles.badgeProgressInfo}>
          <Text style={styles.badgeProgressText}>{totalEarned}/{totalBadges}</Text>
          <Text style={styles.badgeProgressLabel}>{t('badgeEarned')}</Text>
        </View>
        <View style={styles.badgeProgressTrack}>
          <View style={[styles.badgeProgressFill, { width: `${(totalEarned / totalBadges) * 100}%` }]} />
        </View>
      </View>

      {/* Kategoriler */}
      {CATEGORIES.map((category) => {
        const catInfo = CATEGORY_KEYS[category];
        const badges = getBadgesByCategory(category);

        return (
          <View key={category}>
            <Text style={styles.badgeCategoryTitle} accessibilityRole="header">{catInfo.emoji} {t(catInfo.titleKey)}</Text>
            <View style={styles.badgeGrid}>
              {badges.map((badge) => {
                const isEarned = earnedIds.has(badge.id);
                const earnedDate = getEarnedDate(badge.id);

                return (
                  <View
                    key={badge.id}
                    style={[styles.badgeCard, !isEarned && styles.badgeCardLocked]}
                    accessibilityLabel={`Badge: ${badge.name}, ${isEarned ? 'earned' : 'locked'}. ${badge.description}`}
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
    </View>
  );

  // Journey tab icerigi
  const renderJourneyTab = () => {
    const streak = userProgress?.streak || 0;
    const totalWords = userProgress?.totalIdiomsLearned || 0;
    const nodes = generateNodes();

    return (
      <View style={styles.tabContent}>
        {/* Istatistikler */}
        <View style={styles.journeyStats}>
          <LinearGradient
            colors={['rgba(245,158,11,0.15)', 'rgba(239,68,68,0.15)']}
            style={styles.journeyStatCard}
          >
            <Text style={styles.journeyStatEmoji}>{'\u{1F525}'}</Text>
            <Text style={styles.journeyStatValue}>{streak}</Text>
            <Text style={styles.journeyStatLabel}>{t('dayStreak')}</Text>
          </LinearGradient>
          <LinearGradient
            colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.15)']}
            style={styles.journeyStatCard}
          >
            <Text style={styles.journeyStatEmoji}>{'\u{1F4DA}'}</Text>
            <Text style={styles.journeyStatValue}>{totalWords}</Text>
            <Text style={styles.journeyStatLabel}>{t('words')}</Text>
          </LinearGradient>
          <LinearGradient
            colors={['rgba(16,185,129,0.15)', 'rgba(5,150,105,0.15)']}
            style={styles.journeyStatCard}
          >
            <Text style={styles.journeyStatEmoji}>{'\u{1F4C5}'}</Text>
            <Text style={styles.journeyStatValue}>{Math.floor(streak / 7)}</Text>
            <Text style={styles.journeyStatLabel}>{t('weeks')}</Text>
          </LinearGradient>
        </View>

        {/* Paylasim butonlari */}
        <View style={styles.shareRow}>
          {streak >= 3 && (
            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.7}
              disabled={isSharing}
              onPress={() => handleShareAchievement(createStreakTemplate(streak))}
              accessibilityRole="button"
              accessibilityLabel={`Share your ${streak} day streak`}
              accessibilityHint="Opens the share dialog"
            >
              <Text style={styles.shareBtnText}>{'\u{1F525}'} {t('shareStreak')}</Text>
            </TouchableOpacity>
          )}
          {totalWords >= 5 && (
            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.7}
              disabled={isSharing}
              onPress={() => handleShareAchievement(createWordsTemplate(totalWords))}
              accessibilityRole="button"
              accessibilityLabel={`Share your ${totalWords} learned words`}
              accessibilityHint="Opens the share dialog"
            >
              <Text style={styles.shareBtnText}>{'\u{1F4DA}'} {t('shareWords')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Journey Path - sadece ilk 14 gun */}
        <Text style={styles.journeyPathTitle} accessibilityRole="header">{t('learningPath')}</Text>
        <Text style={styles.journeyPathSubtitle}>{t('unlockDays')}</Text>

        <View style={styles.journeyPath}>
          {nodes.slice(0, 14).map((node, index) => {
            const isLeft = index % 2 === 0;
            const milestone = getMilestone(node.day);

            return (
              <View key={node.day} style={styles.journeyNodeRow}>
                <View style={[styles.journeyNodeContainer, isLeft ? styles.journeyNodeLeft : styles.journeyNodeRight]}>
                  <View style={[styles.journeyDayLabel, !isLeft && styles.journeyDayLabelRight]}>
                    <Text style={[styles.journeyDayText, node.status === 'locked' && styles.journeyDayTextLocked]}>
                      {t('day')} {node.day}
                    </Text>
                    {milestone && (
                      <LinearGradient
                        colors={['rgba(139,92,246,0.3)', 'rgba(99,102,241,0.3)']}
                        style={styles.journeyMilestone}
                      >
                        <Text style={styles.journeyMilestoneEmoji}>{milestone.emoji}</Text>
                        <Text style={styles.journeyMilestoneLabel}>{milestone.label}</Text>
                      </LinearGradient>
                    )}
                  </View>
                  {node.status === 'completed' ? (
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={[styles.journeyNode, styles.journeyNodeCompleted]}
                    >
                      <Text style={styles.journeyNodeIcon}>{'\u2713'}</Text>
                    </LinearGradient>
                  ) : node.status === 'current' ? (
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      style={[styles.journeyNode, styles.journeyNodeCurrent]}
                    >
                      <Text style={styles.journeyNodeIcon}>{'\u{2728}'}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.journeyNode, styles.journeyNodeLocked]}>
                      <Text style={styles.journeyNodeIconLocked}>{'\u{1F512}'}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Motivasyon mesaji */}
        <LinearGradient
          colors={['rgba(99,102,241,0.1)', 'rgba(139,92,246,0.1)']}
          style={styles.motivationContainer}
        >
          <Text style={styles.motivationEmoji}>
            {streak === 0 ? '\u{1F331}' : streak < 7 ? '\u{1F4AA}' : streak < 30 ? '\u{1F525}' : '\u{1F451}'}
          </Text>
          <Text style={styles.motivationText}>
            {streak === 0
              ? t('startJourney')
              : streak < 7
                ? t('keepGoing')
                : streak < 30
                  ? t('amazingProgress')
                  : t('champion')}
          </Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0F0A2E', '#1A1145', '#1E1650']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Go back" accessibilityHint="Returns to the previous screen">
            <Text style={styles.closeIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">{'\u{1F3AF}'} {t('quests')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab secici */}
        {renderTabBar()}

        {/* Tab icerigi */}
        <Animated.View style={{ flex: 1, opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'daily' && renderDailyTab()}
            {activeTab === 'weekly' && renderWeeklyTab()}
            {activeTab === 'badges' && renderBadgesTab()}
            {activeTab === 'journey' && renderJourneyTab()}
          </ScrollView>
        </Animated.View>

        {/* Gizli paylasim karti */}
        {shareTemplate && (
          <View style={styles.shareCardHidden} pointerEvents="none">
            <ShareAchievementCard ref={shareCardRef} template={shareTemplate} />
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

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
  placeholder: { width: 42 },

  // Tab secici
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
  },
  tabItemIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabItemLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  tabItemLabelActive: {
    color: '#A78BFA',
    fontWeight: '700',
  },

  // Tab icerigi
  tabContent: {
    gap: 8,
  },

  // Gunluk gorevler
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
  },
  completeBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  taskCardCompleted: {
    backgroundColor: 'rgba(52,211,153,0.06)',
    borderColor: 'rgba(52,211,153,0.15)',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIconCompleted: {
    backgroundColor: 'rgba(52,211,153,0.2)',
  },
  taskIcon: { fontSize: 18 },
  taskCheckmark: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34D399',
  },
  taskLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  taskLabelCompleted: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'line-through',
  },
  taskXPBadge: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskXPBadgeCompleted: {
    backgroundColor: 'rgba(52,211,153,0.1)',
  },
  taskXPText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBBF24',
  },
  taskXPTextCompleted: {
    color: '#34D399',
  },
  bonusRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  bonusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
  },

  // Haftalik zorluk
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  challengeEmoji: { fontSize: 36 },
  challengeInfo: { flex: 1 },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  challengeSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  challengeProgressBadge: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  challengeProgressText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#A78BFA',
  },
  challengeProgressComplete: {
    color: '#34D399',
  },
  challengeProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  challengeProgressFillComplete: {
    backgroundColor: '#34D399',
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
    marginBottom: 8,
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
  goalIcon: { fontSize: 16 },
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
  challengeCompleteBanner: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  challengeCompleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
  weeklySummaryButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  weeklySummaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  weeklySummaryEmoji: { fontSize: 22, marginRight: 12 },
  weeklySummaryTextContainer: { flex: 1 },
  weeklySummaryTitle: { fontSize: 15, fontWeight: '700', color: '#34D399' },
  weeklySummarySubtitle: { fontSize: 12, color: 'rgba(52,211,153,0.6)', marginTop: 2 },
  weeklySummaryArrow: { fontSize: 24, fontWeight: '700', color: 'rgba(52,211,153,0.6)' },

  // Rozetler
  badgeProgressBar: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  badgeProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeProgressText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#A78BFA',
  },
  badgeProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  badgeProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  badgeCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
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
    width: '48%' as any,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
    flexGrow: 1,
    flexBasis: '46%' as any,
  },
  badgeCardLocked: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  badgeEmoji: { fontSize: 36, marginBottom: 8 },
  badgeEmojiLocked: { opacity: 0.4 },
  badgeName: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
  badgeNameLocked: { color: 'rgba(255,255,255,0.3)' },
  badgeDesc: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 15 },
  badgeDescLocked: { color: 'rgba(255,255,255,0.2)' },
  badgeDate: { fontSize: 10, color: '#A78BFA', marginTop: 6, fontWeight: '600' },

  // Journey
  journeyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  journeyStatCard: {
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    minWidth: 95,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  journeyStatEmoji: { fontSize: 24, marginBottom: 4 },
  journeyStatValue: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  journeyStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Paylasim
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  shareBtn: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A78BFA',
  },
  shareCardHidden: {
    position: 'absolute',
    top: -9999,
    left: -9999,
  },

  // Journey Path
  journeyPathTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  journeyPathSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  journeyPath: {
    alignItems: 'center',
  },
  journeyNodeRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  journeyNodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  journeyNodeLeft: {
    justifyContent: 'flex-start',
    paddingLeft: 20,
  },
  journeyNodeRight: {
    justifyContent: 'flex-end',
    paddingRight: 20,
  },
  journeyDayLabel: {
    marginRight: 12,
    alignItems: 'flex-end',
  },
  journeyDayLabelRight: {
    marginRight: 0,
    marginLeft: 12,
    alignItems: 'flex-start',
  },
  journeyDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  journeyDayTextLocked: {
    color: 'rgba(255,255,255,0.25)',
  },
  journeyMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  journeyMilestoneEmoji: { fontSize: 12, marginRight: 4 },
  journeyMilestoneLabel: { fontSize: 11, fontWeight: '700', color: '#A78BFA' },
  journeyNode: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  journeyNodeCompleted: {
    borderColor: '#34D399',
  },
  journeyNodeCurrent: {
    borderColor: '#818CF8',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  journeyNodeLocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  journeyNodeIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  journeyNodeIconLocked: {
    fontSize: 14,
  },

  // Motivasyon
  motivationContainer: {
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  motivationEmoji: { fontSize: 32, marginBottom: 8 },
  motivationText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default QuestsScreen;
