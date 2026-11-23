import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GAME_CONFIG } from '../../config/gameConfig';
import { getItemDef } from '../../config/itemsConfig';
import { adService } from '../../services/adService';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';
import { useGameStore } from '../../store/useGameStore';

export const FlyingGift: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const unlockedMaxLevel = useGameStore((state) => state.unlockedMaxLevel);
  const spawnGiftItem = useGameStore((state) => state.spawnGiftItem);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const posX = useSharedValue(-80);
  const posY = useSharedValue(screenHeight * 0.25);
  const bobY = useSharedValue(0);

  // Trigger gift balloon periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isVisible) {
        startFlying();
      }
    }, GAME_CONFIG.EVENTS.FLYING_GIFT_INTERVAL_MS);

    // Initial appearance after 20 seconds of play for demonstration
    const initialTimer = setTimeout(() => {
      startFlying();
    }, 20000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, [isVisible]);

  const startFlying = () => {
    setIsVisible(true);
    posX.value = -80;
    posY.value = screenHeight * (0.2 + Math.random() * 0.25);

    // Gentle up and down floating bob
    bobY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(12, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Fly across horizontally in 10 seconds
    posX.value = withTiming(
      screenWidth + 80,
      {
        duration: 11000,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(setIsVisible)(false);
        }
      }
    );
  };

  const handlePressGift = () => {
    soundService.playPop();
    hapticService.selection();

    // Reward level: unlockedMaxLevel - 2 (minimum level 1)
    const rewardLevel = Math.max(1, unlockedMaxLevel - 2);
    const itemDef = getItemDef(rewardLevel);

    Alert.alert(
      'Hộp Quà Kỳ Diệu! 🎈',
      `Xem 1 video ngắn để nhận ngay [Cấp ${rewardLevel} - ${itemDef.name}] ${itemDef.emoji} vào khu vườn của bạn!`,
      [
        { text: 'Để Sau', style: 'cancel' },
        {
          text: 'Xem Ngay 📺',
          onPress: () => {
            adService.showRewardedAd(() => {
              const success = spawnGiftItem(rewardLevel);
              if (success) {
                soundService.playLevelUp();
                hapticService.success();
                Alert.alert(
                  'Nhận Quà Thành Công! 🎉',
                  `Bạn đã nhận được ${itemDef.name} ${itemDef.emoji}!`
                );
              } else {
                Alert.alert(
                  'Khu Vườn Đã Đầy!',
                  'Khu vườn không còn ô trống. Quà đã được chuyển thành 500 xu 🪙!'
                );
                useGameStore.getState().addCoins(500);
              }
              setIsVisible(false);
            });
          },
        },
      ]
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: posX.value },
        { translateY: posY.value + bobY.value },
      ],
    };
  });

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={styles.balloonCard}
        onPress={handlePressGift}
        activeOpacity={0.8}
      >
        <Text style={styles.balloonIcon}>🎈</Text>
        <Text style={styles.giftIcon}>🎁</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  balloonCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
    height: 75,
  },
  balloonIcon: {
    fontSize: 34,
    marginBottom: -10,
  },
  giftIcon: {
    fontSize: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
