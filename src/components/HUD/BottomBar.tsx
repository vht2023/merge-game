import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GAME_CONFIG } from '../../config/gameConfig';
import { adService } from '../../services/adService';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';
import { useGameStore } from '../../store/useGameStore';

interface BottomBarProps {
  onOpenCollection: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ onOpenCollection }) => {
  const spawn = useGameStore((state) => state.spawn);
  const energy = useGameStore((state) => state.energy);
  const maxEnergy = useGameStore((state) => state.maxEnergy);
  const refillEnergy = useGameStore((state) => state.refillEnergy);
  const discoveredLevels = useGameStore((state) => state.discoveredLevels);

  const spawnerScale = useSharedValue(1);

  const handleSpawnPress = () => {
    // Punchy bounce effect on button
    spawnerScale.value = withSequence(
      withTiming(0.88, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );

    const result = spawn();

    if (result.success) {
      soundService.playPop();
      hapticService.light();
    } else {
      hapticService.heavy();
      if (result.reason === 'NO_ENERGY') {
        Alert.alert(
          'Hết Năng Lượng ⚡',
          'Bạn đã dùng hết năng lượng! Hãy chờ hồi phục tự nhiên hoặc xem 1 quảng cáo để hồi đầy 30 năng lượng.',
          [
            { text: 'Chờ', style: 'cancel' },
            {
              text: 'Xem Ads Hồi Đầy ⚡',
              onPress: handleWatchAdForEnergy,
            },
          ]
        );
      } else if (result.reason === 'GRID_FULL') {
        Alert.alert(
          'Khu Vườn Đã Đầy! 🌸',
          'Không còn ô trống nào trên bàn cờ. Hãy hợp nhất các cây cùng cấp độ để tạo thêm chỗ trống nhé!'
        );
      }
    }
  };

  const handleWatchAdForEnergy = () => {
    hapticService.selection();
    adService.showRewardedAd(
      () => {
        refillEnergy();
        soundService.playLevelUp();
        hapticService.success();
        Alert.alert('Thành Công! 🎉', 'Bạn đã được hồi đầy 30 năng lượng ⚡!');
      },
      () => {
        // Dismissed
      }
    );
  };

  const handleCollectionPress = () => {
    soundService.playPop();
    hapticService.selection();
    onOpenCollection();
  };

  const animatedSpawnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: spawnerScale.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Sổ tay sưu tầm */}
      <TouchableOpacity
        style={styles.sideButton}
        onPress={handleCollectionPress}
        activeOpacity={0.7}
      >
        <Text style={styles.sideButtonIcon}>📖</Text>
        <Text style={styles.sideButtonText}>Sổ Tay</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {discoveredLevels.length}/{GAME_CONFIG.ECONOMY.MAX_LEVEL}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Main Spawner Button */}
      <Animated.View style={animatedSpawnerStyle}>
        <TouchableOpacity
          style={[
            styles.spawnerButton,
            energy < GAME_CONFIG.ENERGY.SPAWN_COST && styles.spawnerDisabled,
          ]}
          onPress={handleSpawnPress}
          activeOpacity={0.85}
        >
          <View style={styles.spawnerContent}>
            <Text style={styles.spawnerEmoji}>🌱</Text>
            <Text style={styles.spawnerTitle}>Gieo Hạt</Text>
            <View style={styles.costBadge}>
              <Text style={styles.costText}>-1 ⚡</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Nạp Năng Lượng Ads Button */}
      <TouchableOpacity
        style={[
          styles.sideButton,
          energy >= maxEnergy && styles.sideButtonFaded,
        ]}
        onPress={handleWatchAdForEnergy}
        activeOpacity={0.7}
      >
        <Text style={styles.sideButtonIcon}>📺</Text>
        <Text style={styles.sideButtonText}>Nạp ⚡</Text>
        <View style={[styles.badge, styles.adBadge]}>
          <Text style={styles.badgeText}>+30</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sideButton: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C8E6C9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  sideButtonFaded: {
    opacity: 0.75,
  },
  sideButtonIcon: {
    fontSize: 26,
  },
  sideButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#388E3C',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  adBadge: {
    backgroundColor: '#F57C00',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  spawnerButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#A5D6A7',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  spawnerDisabled: {
    backgroundColor: '#9E9E9E',
    borderColor: '#BDBDBD',
  },
  spawnerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spawnerEmoji: {
    fontSize: 34,
  },
  spawnerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  costBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  costText: {
    color: '#FFF9C4',
    fontSize: 10,
    fontWeight: '800',
  },
});
