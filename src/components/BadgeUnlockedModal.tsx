import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Badge } from '../types';

type BadgeUnlockedModalProps = {
  badge: Badge | null;
  visible: boolean;
  onClose: () => void;
};

const { width } = Dimensions.get('window');

const BadgeUnlockedModal: React.FC<BadgeUnlockedModalProps> = ({
  badge,
  visible,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const shineRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Giris animasyonu
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Emoji bounce animasyonu (biraz gecikmeli)
      setTimeout(() => {
        Animated.spring(emojiScale, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }).start();
      }, 200);

      // Parlama animasyonu
      Animated.loop(
        Animated.timing(shineRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      emojiScale.setValue(0);
      shineRotate.setValue(0);
    }
  }, [visible, badge]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!visible || !badge) return null;

  const spin = shineRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={handleClose}>
        <Animated.View style={[styles.modal, { transform: [{ scale: scaleAnim }] }]}>
          {/* Parlama efekti */}
          <Animated.View style={[styles.shine, { transform: [{ rotate: spin }] }]}>
            <View style={styles.shineBeam} />
            <View style={[styles.shineBeam, { transform: [{ rotate: '60deg' }] }]} />
            <View style={[styles.shineBeam, { transform: [{ rotate: '120deg' }] }]} />
          </Animated.View>

          {/* Rozet emojisi */}
          <Animated.Text style={[styles.emoji, { transform: [{ scale: emojiScale }] }]}>
            {badge.emoji}
          </Animated.Text>

          {/* Baslik */}
          <Text style={styles.title}>Yeni Rozet!</Text>

          {/* Rozet adi */}
          <Text style={styles.badgeName}>{badge.name}</Text>

          {/* Aciklama */}
          <Text style={styles.description}>{badge.description}</Text>

          {/* Kapat butonu */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Harika!</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayTouch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modal: {
    backgroundColor: '#1A1145',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: width * 0.82,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: -40,
  },
  shineBeam: {
    position: 'absolute',
    width: 2,
    height: 200,
    backgroundColor: 'rgba(167,139,250,0.1)',
    left: 99,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#A78BFA',
  },
});

export default BadgeUnlockedModal;
