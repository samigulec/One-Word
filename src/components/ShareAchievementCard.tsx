import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShareTemplate } from '../types';

// Paylasim icin otomatik olusturulan basari karti
// react-native-view-shot ile screenshot alip paylasim yapilir
type ShareAchievementCardProps = {
  template: ShareTemplate;
};

// Sablon tipine gore gradient renkleri
const GRADIENT_COLORS: Record<string, string[]> = {
  streak: ['#F59E0B', '#EF4444'],
  level: ['#6366F1', '#8B5CF6'],
  words: ['#10B981', '#3B82F6'],
  badge: ['#EC4899', '#8B5CF6'],
  weekly_challenge: ['#F59E0B', '#10B981'],
};

const ShareAchievementCard = forwardRef<View, ShareAchievementCardProps>(
  ({ template }, ref) => {
    const colors = GRADIENT_COLORS[template.type] || GRADIENT_COLORS.level;

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        <View style={[styles.background, { backgroundColor: '#1A1145' }]}>
          {/* Ust dekoratif serit */}
          <View style={[styles.topStripe, { backgroundColor: colors[0] }]} />

          {/* Uygulama ismi */}
          <Text style={styles.appName}>{'\u{2726}'} One Word</Text>

          {/* Basari emojisi */}
          <Text style={styles.achievementEmoji}>{template.emoji}</Text>

          {/* Baslik */}
          <Text style={styles.title}>{template.title}</Text>

          {/* Deger gosterimi */}
          <View style={[styles.valueBadge, { backgroundColor: `${colors[0]}30`, borderColor: `${colors[0]}50` }]}>
            <Text style={[styles.valueText, { color: colors[0] }]}>
              {template.value}
            </Text>
          </View>

          {/* Alt baslik */}
          <Text style={styles.subtitle}>{template.subtitle}</Text>

          {/* Dekoratif ayirici */}
          <View style={styles.divider} />

          {/* Alt bilgi */}
          <Text style={styles.footer}>Learn a new word every day</Text>
          <Text style={styles.footerUrl}>oneword.app</Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: 360,
    borderRadius: 24,
    overflow: 'hidden',
  },
  background: {
    padding: 32,
    alignItems: 'center',
  },
  topStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 24,
    marginTop: 8,
  },
  achievementEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  valueBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  valueText: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
    marginVertical: 20,
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
  },
  footerUrl: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0.5,
  },
});

export default ShareAchievementCard;
