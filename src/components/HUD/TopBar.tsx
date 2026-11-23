import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateTotalCoinsPerSecond } from '../../core/gridLogic';
import { formatNumber, formatTime } from '../../core/mathUtils';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';
import { useGameStore } from '../../store/useGameStore';

interface TopBarProps {
  onOpenSettings: () => void;
  nextRegenSeconds: number;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSettings, nextRegenSeconds }) => {
  const coins = useGameStore((state) => state.coins);
  const energy = useGameStore((state) => state.energy);
  const maxEnergy = useGameStore((state) => state.maxEnergy);
  const grid = useGameStore((state) => state.grid);

  const coinsPerSec = calculateTotalCoinsPerSecond(grid);

  const handleSettingsPress = () => {
    soundService.playPop();
    hapticService.selection();
    onOpenSettings();
  };

  return (
    <View style={styles.container}>
      {/* Coins Card */}
      <View style={styles.statCard}>
        <Text style={styles.statIcon}>🪙</Text>
        <View style={styles.statTextGroup}>
          <Text style={styles.statValue}>{formatNumber(coins)}</Text>
          <Text style={styles.statSubText}>+{formatNumber(coinsPerSec)}/s</Text>
        </View>
      </View>

      {/* Energy Card */}
      <View style={styles.statCard}>
        <Text style={styles.statIcon}>⚡</Text>
        <View style={styles.statTextGroup}>
          <Text style={styles.statValue}>
            {energy}/{maxEnergy}
          </Text>
          <Text style={styles.statSubText}>
            {energy >= maxEnergy ? 'Đầy' : `+1s: ${formatTime(nextRegenSeconds)}`}
          </Text>
        </View>
      </View>

      {/* Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={handleSettingsPress}
        activeOpacity={0.7}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  statTextGroup: {
    flexDirection: 'column',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B5E20',
  },
  statSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#689F38',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsIcon: {
    fontSize: 20,
  },
});
