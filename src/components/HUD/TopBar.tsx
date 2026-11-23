import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateTotalCoinsPerSecond } from '../../core/gridLogic';
import { formatNumber, formatTime } from '../../core/mathUtils';
import { TRANSLATIONS } from '../../i18n/translations';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';
import { useGameStore } from '../../store/useGameStore';

interface TopBarProps {
  onOpenSettings: () => void;
  onOpenDailyRewards: () => void;
  nextRegenSeconds: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSettings,
  onOpenDailyRewards,
  nextRegenSeconds,
}) => {
  const coins = useGameStore((state) => state.coins);
  const energy = useGameStore((state) => state.energy);
  const maxEnergy = useGameStore((state) => state.maxEnergy);
  const grid = useGameStore((state) => state.grid);
  const isDailyAvailable = useGameStore((state) => state.isDailyAvailable());
  const lang = useGameStore((state) => state.settings.language || 'vi');

  const t = TRANSLATIONS[lang].hud;
  const coinsPerSec = calculateTotalCoinsPerSecond(grid);

  const handleSettingsPress = () => {
    soundService.playPop();
    hapticService.selection();
    onOpenSettings();
  };

  const handleDailyPress = () => {
    soundService.playPop();
    hapticService.selection();
    onOpenDailyRewards();
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
            {energy >= maxEnergy ? t.energyFull : t.energyRegen(formatTime(nextRegenSeconds))}
          </Text>
        </View>
      </View>

      {/* Daily Gift Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleDailyPress}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonIcon}>🎁</Text>
        {isDailyAvailable && <View style={styles.redBadge} />}
      </TouchableOpacity>

      {/* Settings Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleSettingsPress}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  statTextGroup: {
    flexDirection: 'column',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B5E20',
  },
  statSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#689F38',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    position: 'relative',
  },
  buttonIcon: {
    fontSize: 19,
  },
  redBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
