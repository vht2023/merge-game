import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface LoadingScreenProps {
  onFinish: () => void;
}

const TIPS = [
  '💡 Ghép 2 cây cùng cấp để khám phá giống loài mới!',
  '⚡ Năng lượng tự hồi phục 1 điểm mỗi 15 giây!',
  '🪙 Cây cấp càng cao sinh ra càng nhiều xu mỗi giây!',
  '🎈 Chạm vào bóng bay quà tặng để nhận cây cấp cao!',
  '📖 Mở Sổ Tay để xem các phần thưởng mở khóa!',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [percent, setPercent] = useState(0);

  // Animations
  const logoScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  const screenWidth = Dimensions.get('window').width;
  const barMaxWidth = Math.min(screenWidth - 80, 280);

  // Rotate tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 1200);
    return () => clearInterval(tipInterval);
  }, []);

  // Breathing pulse animation on logo
  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700 }),
        withTiming(0.95, { duration: 700 })
      ),
      -1,
      true
    );
  }, [logoScale]);

  // Loading progress sequence
  useEffect(() => {
    let current = 0;
    const progressInterval = setInterval(() => {
      current += Math.floor(Math.random() * 5) + 3;
      if (current >= 100) {
        current = 100;
        clearInterval(progressInterval);
        setPercent(100);
        progressWidth.value = withTiming(barMaxWidth, { duration: 300 }, () => {
          // Fade out loading screen smoothly
          screenOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
            if (finished) {
              runOnJS(onFinish)();
            }
          });
        });
      } else {
        setPercent(current);
        progressWidth.value = withTiming((current / 100) * barMaxWidth, {
          duration: 100,
        });
      }
    }, 110);

    return () => clearInterval(progressInterval);
  }, [barMaxWidth, onFinish, progressWidth, screenOpacity]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: progressWidth.value,
    };
  });

  const animatedScreenStyle = useAnimatedStyle(() => {
    return {
      opacity: screenOpacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedScreenStyle]}>
      {/* Background soft circles */}
      <View style={styles.glowCircle} />

      {/* Main Branding */}
      <View style={styles.brandingContainer}>
        <Animated.View style={[styles.logoBadge, animatedLogoStyle]}>
          <Text style={styles.logoEmoji}>🌱</Text>
        </Animated.View>

        <Text style={styles.title}>MERGE GARDEN</Text>
        <Text style={styles.subtitle}>Khu Vườn Chữa Lành</Text>
      </View>

      {/* Loading Progress Section */}
      <View style={styles.loadingSection}>
        {/* Progress Bar Container */}
        <View style={[styles.progressBarTrack, { width: barMaxWidth }]}>
          <Animated.View
            style={[styles.progressBarFill, animatedProgressStyle]}
          />
        </View>

        <Text style={styles.percentText}>{percent}%</Text>

        {/* Tip text */}
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
        </View>
      </View>

      <Text style={styles.footerText}>Phiên bản 1.0.0 • Tải tài nguyên...</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    zIndex: 99999,
    elevation: 999,
  },
  glowCircle: {
    position: 'absolute',
    top: '25%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#A5D6A7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 54,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8E6C9',
    marginTop: 6,
    letterSpacing: 1,
  },
  loadingSection: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 30,
  },
  progressBarTrack: {
    height: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#81C784',
    overflow: 'hidden',
    justifyContent: 'center',
    padding: 1,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#66BB6A',
    borderRadius: 5,
  },
  percentText: {
    color: '#FFF9C4',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  tipBox: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
  },
  tipText: {
    color: '#E8F5E9',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
});
