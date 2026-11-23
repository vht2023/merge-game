import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatNumber } from '../../core/mathUtils';
import { TRANSLATIONS } from '../../i18n/translations';
import { adService } from '../../services/adService';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';
import { useGameStore } from '../../store/useGameStore';

interface OfflineRewardModalProps {
  visible: boolean;
  earnedCoins: number;
  elapsedSeconds: number;
  onClose: () => void;
}

export const OfflineRewardModal: React.FC<OfflineRewardModalProps> = ({
  visible,
  earnedCoins,
  elapsedSeconds,
  onClose,
}) => {
  const addCoins = useGameStore((state) => state.addCoins);
  const lang = useGameStore((state) => state.settings.language || 'vi');

  if (!visible || earnedCoins <= 0) return null;

  const t = TRANSLATIONS[lang].offline;
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const timeString =
    hours > 0
      ? `${hours} ${t.hours} ${minutes} ${t.minutes}`
      : `${minutes} ${t.minutes}`;

  const handleClaimNormal = () => {
    soundService.playCoin();
    hapticService.success();
    addCoins(earnedCoins);
    onClose();
  };

  const handleClaimDouble = () => {
    hapticService.selection();
    adService.showRewardedAd(
      () => {
        soundService.playLevelUp();
        hapticService.success();
        addCoins(earnedCoins * 2);
        onClose();
      },
      () => {
        // Closed without reward
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.headerEmoji}>🌸</Text>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle(timeString)}</Text>

          <View style={styles.coinContainer}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinAmount}>+{formatNumber(earnedCoins)}</Text>
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            style={styles.doubleButton}
            onPress={handleClaimDouble}
            activeOpacity={0.8}
          >
            <Text style={styles.doubleButtonText}>
              {t.doubleButton(formatNumber(earnedCoins * 2))}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.normalButton}
            onPress={handleClaimNormal}
            activeOpacity={0.7}
          >
            <Text style={styles.normalButtonText}>
              {t.normalButton(formatNumber(earnedCoins))}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C8E6C9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerEmoji: {
    fontSize: 50,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FBC02D',
    marginBottom: 24,
  },
  coinIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  coinAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#E65100',
  },
  doubleButton: {
    width: '100%',
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#F57C00',
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  doubleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  normalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  normalButtonText: {
    color: '#757575',
    fontSize: 14,
    fontWeight: '600',
  },
});
