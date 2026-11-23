import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GAME_CONFIG } from '../../config/gameConfig';
import { getItemDef } from '../../config/itemsConfig';
import { formatNumber } from '../../core/mathUtils';
import { TRANSLATIONS } from '../../i18n/translations';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';
import { useGameStore } from '../../store/useGameStore';

interface DailyRewardModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  visible,
  onClose,
}) => {
  const dailyStreak = useGameStore((state) => state.dailyStreak);
  const isAvailable = useGameStore((state) => state.isDailyAvailable());
  const claimDailyReward = useGameStore((state) => state.claimDailyReward);
  const lang = useGameStore((state) => state.settings.language || 'vi');

  if (!visible) return null;

  const t = TRANSLATIONS[lang].daily;
  const currentDayIndex = isAvailable
    ? dailyStreak % 7
    : (dailyStreak - 1 + 7) % 7;

  const handleClaim = () => {
    const res = claimDailyReward();
    if (res.success) {
      soundService.playLevelUp();
      hapticService.success();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.subtitle}>{t.subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                soundService.playPop();
                onClose();
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {GAME_CONFIG.DAILY_REWARDS.map((item, index) => {
              const dayNum = index + 1;
              const isPast =
                !isAvailable ? dayNum <= dailyStreak : dayNum <= dailyStreak;
              const isCurrent = isAvailable && index === currentDayIndex;
              const itemPlant =
                item.itemLevel > 0 ? getItemDef(item.itemLevel, lang) : null;

              return (
                <View
                  key={`day_${dayNum}`}
                  style={[
                    styles.dayCard,
                    isCurrent && styles.dayCardCurrent,
                    isPast && !isCurrent && styles.dayCardPast,
                    dayNum === 7 && styles.dayCardFinal,
                  ]}
                >
                  <View style={styles.dayBadge}>
                    <Text
                      style={[
                        styles.dayBadgeText,
                        isCurrent && styles.dayBadgeTextCurrent,
                      ]}
                    >
                      {t.dayBadge(dayNum)}
                    </Text>
                  </View>

                  <Text style={styles.dayEmoji}>
                    {itemPlant ? itemPlant.emoji : '💰'}
                  </Text>

                  <Text style={styles.rewardText}>+{formatNumber(item.coins)} 🪙</Text>
                  {item.energy > 0 && (
                    <Text style={styles.rewardSubText}>+{item.energy} ⚡</Text>
                  )}
                  {itemPlant && (
                    <Text style={styles.plantBadgeText}>{itemPlant.name}</Text>
                  )}

                  {isPast && !isCurrent && (
                    <View style={styles.claimedOverlay}>
                      <Text style={styles.claimedCheck}>✓</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Action Button */}
          <View style={styles.actionContainer}>
            {isAvailable ? (
              <TouchableOpacity
                style={styles.claimButton}
                onPress={handleClaim}
                activeOpacity={0.8}
              >
                <Text style={styles.claimButtonText}>
                  {t.claimButton((dailyStreak % 7) + 1)}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.alreadyClaimedBox}>
                <Text style={styles.alreadyClaimedText}>
                  {t.alreadyClaimed}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1B5E20',
  },
  subtitle: {
    fontSize: 12,
    color: '#66BB6A',
    fontWeight: '600',
    marginTop: 2,
    maxWidth: 240,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#757575',
    fontWeight: 'bold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  dayCard: {
    width: '31%',
    backgroundColor: '#F1F8E9',
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C8E6C9',
    position: 'relative',
    overflow: 'hidden',
  },
  dayCardCurrent: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
    borderWidth: 2.5,
    transform: [{ scale: 1.03 }],
  },
  dayCardPast: {
    opacity: 0.65,
    backgroundColor: '#ECEFF1',
    borderColor: '#CFD8DC',
  },
  dayCardFinal: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD54F',
    marginTop: 4,
  },
  dayBadge: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  dayBadgeTextCurrent: {
    color: '#1B5E20',
  },
  dayEmoji: {
    fontSize: 24,
    marginVertical: 2,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1B5E20',
  },
  rewardSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F57C00',
  },
  plantBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0288D1',
    marginTop: 2,
    textAlign: 'center',
  },
  claimedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimedCheck: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2E7D32',
  },
  actionContainer: {
    marginTop: 18,
  },
  claimButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  alreadyClaimedBox: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
  },
  alreadyClaimedText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
