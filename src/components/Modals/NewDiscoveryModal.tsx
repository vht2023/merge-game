import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getItemDef } from '../../config/itemsConfig';
import { formatNumber } from '../../core/mathUtils';
import { TRANSLATIONS } from '../../i18n/translations';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';
import { useGameStore } from '../../store/useGameStore';

export const NewDiscoveryModal: React.FC = () => {
  const newlyDiscoveredLevel = useGameStore(
    (state) => state.newlyDiscoveredLevel
  );
  const dismissNewDiscovery = useGameStore(
    (state) => state.dismissNewDiscovery
  );
  const lang = useGameStore((state) => state.settings.language || 'vi');

  const isVisible = newlyDiscoveredLevel !== null;

  useEffect(() => {
    if (isVisible) {
      soundService.playLevelUp();
      hapticService.success();
    }
  }, [isVisible]);

  if (!isVisible || newlyDiscoveredLevel === null) return null;

  const t = TRANSLATIONS[lang].discovery;
  const def = getItemDef(newlyDiscoveredLevel, lang);

  const handleDismiss = () => {
    soundService.playPop();
    hapticService.light();
    dismissNewDiscovery();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.stars}>✨ 🎉 ✨</Text>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>

          {/* Plant Badge Card */}
          <View
            style={[
              styles.itemBadge,
              {
                backgroundColor: def.badgeColor,
                borderColor: def.borderColor,
              },
            ]}
          >
            <View
              style={[
                styles.levelTag,
                { backgroundColor: def.borderColor },
              ]}
            >
              <Text style={styles.levelTagText}>{t.level(def.level)}</Text>
            </View>
            <Text style={styles.emoji}>{def.emoji}</Text>
            <Text style={styles.name}>{def.name}</Text>
            <Text style={styles.description}>{def.description}</Text>
          </View>

          {/* Bonus reward banner */}
          <View style={styles.bonusBanner}>
            <Text style={styles.bonusLabel}>{t.bonusReward}</Text>
            <Text style={styles.bonusValue}>
              +{formatNumber(def.mergeReward)} 🪙
            </Text>
          </View>

          <TouchableOpacity
            style={styles.claimButton}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.claimButtonText}>{t.buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    borderColor: '#FFF59D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  stars: {
    fontSize: 26,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E65100',
    letterSpacing: 1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#616161',
    textAlign: 'center',
    marginBottom: 16,
  },
  itemBadge: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  levelTag: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  levelTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emoji: {
    fontSize: 56,
    marginTop: 6,
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#4E342E',
    textAlign: 'center',
    lineHeight: 17,
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FDD835',
    marginBottom: 20,
    gap: 8,
  },
  bonusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5D4037',
  },
  bonusValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E65100',
  },
  claimButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#81C784',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
