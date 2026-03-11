import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShareTemplate } from '../types';

// Premium basari paylasim karti -- Instagram story tarzi gorsel tasarim
type ShareAchievementCardProps = {
  template: ShareTemplate;
};

// Sablon tipine gore renk paleti
const TEMPLATE_PALETTE: Record<string, { primary: string; glow: string; bg: string; accent: string }> = {
  streak: {
    primary: '#F59E0B',
    glow: 'rgba(245,158,11,0.25)',
    bg: 'rgba(245,158,11,0.08)',
    accent: '#FBBF24',
  },
  level: {
    primary: '#8B5CF6',
    glow: 'rgba(139,92,246,0.25)',
    bg: 'rgba(139,92,246,0.08)',
    accent: '#A78BFA',
  },
  words: {
    primary: '#10B981',
    glow: 'rgba(16,185,129,0.25)',
    bg: 'rgba(16,185,129,0.08)',
    accent: '#34D399',
  },
  badge: {
    primary: '#EC4899',
    glow: 'rgba(236,72,153,0.25)',
    bg: 'rgba(236,72,153,0.08)',
    accent: '#F472B6',
  },
  weekly_challenge: {
    primary: '#06B6D4',
    glow: 'rgba(6,182,212,0.25)',
    bg: 'rgba(6,182,212,0.08)',
    accent: '#22D3EE',
  },
};

const ShareAchievementCard = forwardRef<View, ShareAchievementCardProps>(
  ({ template }, ref) => {
    const palette = TEMPLATE_PALETTE[template.type] || TEMPLATE_PALETTE.level;

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        <View style={styles.background}>
          {/* Ust gradient serit */}
          <View style={styles.topBar}>
            <View style={[styles.topBarMain, { backgroundColor: palette.primary }]} />
            <View style={[styles.topBarFade, { backgroundColor: palette.glow }]} />
          </View>

          {/* Dekoratif kose desenleri */}
          <View style={[styles.cornerTL, { borderColor: palette.glow }]} />
          <View style={[styles.cornerBR, { borderColor: palette.glow }]} />

          {/* Arka plan glow */}
          <View style={[styles.glowOrb, { backgroundColor: palette.glow }]} />

          {/* Marka baslik */}
          <View style={styles.brandRow}>
            <View style={[styles.brandDot, { backgroundColor: palette.primary }]} />
            <Text style={styles.brandName}>One Word</Text>
          </View>

          {/* Basari emojisi -- buyuk ve vurgulu */}
          <View style={[styles.emojiContainer, { backgroundColor: palette.bg, borderColor: `${palette.primary}30` }]}>
            <Text style={styles.emoji}>{template.emoji}</Text>
          </View>

          {/* Baslik */}
          <Text style={styles.title}>{template.title}</Text>

          {/* Deger gosterimi -- premium pill */}
          <View style={[styles.valuePill, { backgroundColor: palette.bg, borderColor: `${palette.primary}40` }]}>
            <Text style={[styles.valueText, { color: palette.accent }]}>
              {template.value}
            </Text>
          </View>

          {/* Alt baslik */}
          <Text style={styles.subtitle}>{template.subtitle}</Text>

          {/* Dekoratif ayirici */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: palette.glow }]} />
            <View style={[styles.dividerDiamond, { backgroundColor: palette.primary }]} />
            <View style={[styles.dividerLine, { backgroundColor: palette.glow }]} />
          </View>

          {/* Alt kisim */}
          <Text style={styles.footerSlogan}>Learn a new word every day</Text>
          <Text style={[styles.footerBrand, { color: palette.primary }]}>oneword.app</Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: 380,
    borderRadius: 28,
    overflow: 'hidden',
  },
  background: {
    backgroundColor: '#0D0B1A',
    paddingHorizontal: 36,
    paddingVertical: 40,
    alignItems: 'center',
  },

  // Ust serit
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    flexDirection: 'row',
  },
  topBarMain: {
    flex: 3,
    height: 5,
  },
  topBarFade: {
    flex: 2,
    height: 5,
  },

  // Kose desenleri
  cornerTL: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRadius: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderRadius: 2,
  },

  // Glow efekti
  glowOrb: {
    position: 'absolute',
    top: '25%',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.25,
  },

  // Marka
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 4,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Emoji container
  emojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 52,
  },

  // Baslik
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
    letterSpacing: -0.3,
  },

  // Deger pill
  valuePill: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  valueText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  // Alt baslik
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },

  // Ayirici
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginVertical: 20,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerDiamond: {
    width: 6,
    height: 6,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },

  // Footer
  footerSlogan: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ShareAchievementCard;
