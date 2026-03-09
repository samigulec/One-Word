// SkeletonLoader.tsx -- Shimmer animasyonlu iskelet yukleme bileseni
// Yukleme sirasinda icerik yer tutucusu olarak kullanilir

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// Temel skeleton loader prop tipleri
type SkeletonLoaderProps = {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
};

// Shimmer efektli tekil skeleton eleman
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width: skeletonWidth,
  height,
  borderRadius = 4,
  style,
}) => {
  // Dongusal opacity animasyonu: 0.3 -> 0.7 -> 0.3
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={[
        {
          width: skeletonWidth as any,
          height,
          borderRadius,
          backgroundColor: '#2A2A3E',
          opacity: shimmerAnim,
        },
        style,
      ]}
    />
  );
};

// Kelime karti boyutunda onceden ayarlanmis skeleton bilesen
const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  // Dongusal opacity animasyonu: 0.3 -> 0.7 -> 0.3
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.card}>
        {/* Emoji yer tutucusu */}
        <Animated.View
          style={[styles.skeletonElement, styles.emojiSkeleton, { opacity: shimmerAnim }]}
        />

        {/* Kelime baslik yer tutucusu */}
        <Animated.View
          style={[styles.skeletonElement, styles.wordSkeleton, { opacity: shimmerAnim }]}
        />

        {/* Telaffuz yer tutucusu */}
        <Animated.View
          style={[styles.skeletonElement, styles.pronunciationSkeleton, { opacity: shimmerAnim }]}
        />

        {/* Aksiyon butonlari yer tutucusu */}
        <View style={styles.actionRow}>
          {[0, 1, 2, 3].map((i) => (
            <Animated.View
              key={i}
              style={[styles.skeletonElement, styles.actionBtnSkeleton, { opacity: shimmerAnim }]}
            />
          ))}
        </View>

        {/* Anlam butonu yer tutucusu */}
        <Animated.View
          style={[styles.skeletonElement, styles.meaningBtnSkeleton, { opacity: shimmerAnim }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Kart dis kapsayicisi
  cardContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  // Kart ic yapisi -- gercek kelime kartinin boyut ve stilini taklit eder
  card: {
    width: width - 40,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  // Ortak skeleton eleman stili
  skeletonElement: {
    backgroundColor: '#2A2A3E',
  },
  // Emoji alani
  emojiSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 12,
  },
  // Kelime baslik alani
  wordSkeleton: {
    width: 180,
    height: 34,
    borderRadius: 8,
    marginBottom: 8,
  },
  // Telaffuz alani
  pronunciationSkeleton: {
    width: 120,
    height: 14,
    borderRadius: 4,
    marginBottom: 20,
  },
  // Aksiyon butonlari satiri
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  // Tekil aksiyon butonu
  actionBtnSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  // Anlam butonu alani
  meaningBtnSkeleton: {
    width: '100%',
    height: 44,
    borderRadius: 14,
  },
});

export { SkeletonLoader, SkeletonCard };
export default SkeletonLoader;
