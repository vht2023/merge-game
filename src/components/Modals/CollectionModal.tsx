import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GAME_CONFIG } from '../../config/gameConfig';
import { getItemDef } from '../../config/itemsConfig';
import { formatNumber } from '../../core/mathUtils';
import { TRANSLATIONS } from '../../i18n/translations';
import { soundService } from '../../services/soundService';
import { useGameStore } from '../../store/useGameStore';

interface CollectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  visible,
  onClose,
}) => {
  const discoveredLevels = useGameStore((state) => state.discoveredLevels);
  const lang = useGameStore((state) => state.settings.language || 'vi');

  if (!visible) return null;

  const t = TRANSLATIONS[lang].collection;
  const totalLevels = GAME_CONFIG.ECONOMY.MAX_LEVEL;
  const progressPercent = Math.round(
    (discoveredLevels.length / totalLevels) * 100
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.subtitle}>
                {t.subtitle(discoveredLevels.length, totalLevels, progressPercent)}
              </Text>
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

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>

          {/* Items List */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {Array.from({ length: totalLevels }).map((_, i) => {
              const level = i + 1;
              const isDiscovered = discoveredLevels.includes(level);
              const def = getItemDef(level, lang);

              return (
                <View
                  key={`coll_${level}`}
                  style={[
                    styles.itemRow,
                    isDiscovered ? styles.itemDiscovered : styles.itemLocked,
                  ]}
                >
                  {/* Left Avatar / Silhouette */}
                  <View
                    style={[
                      styles.avatarBox,
                      isDiscovered
                        ? {
                            backgroundColor: def.badgeColor,
                            borderColor: def.borderColor,
                          }
                        : styles.avatarLocked,
                    ]}
                  >
                    <Text style={styles.avatarEmoji}>
                      {isDiscovered ? def.emoji : '🔒'}
                    </Text>
                    <View
                      style={[
                        styles.levelTag,
                        isDiscovered
                          ? { backgroundColor: def.borderColor }
                          : styles.levelTagLocked,
                      ]}
                    >
                      <Text style={styles.levelTagText}>{level}</Text>
                    </View>
                  </View>

                  {/* Right Details */}
                  <View style={styles.infoBox}>
                    <Text
                      style={[
                        styles.itemName,
                        !isDiscovered && styles.itemNameLocked,
                      ]}
                    >
                      {isDiscovered
                        ? def.name
                        : `${t.levelLabel(level)} (${t.lockedName})`}
                    </Text>
                    <Text style={styles.itemDesc}>
                      {isDiscovered ? def.description : t.lockedDesc}
                    </Text>

                    {isDiscovered && (
                      <View style={styles.statsRow}>
                        <View style={styles.statChip}>
                          <Text style={styles.statChipText}>
                            🌾 {t.generates(formatNumber(def.coinsPerSecond))}
                          </Text>
                        </View>
                        <View style={styles.statChip}>
                          <Text style={styles.statChipText}>
                            🎁 {t.mergeReward(formatNumber(def.mergeReward))} 🪙
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555555',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  scrollView: {
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  itemDiscovered: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E0E0E0',
  },
  itemLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#EAEAEA',
    opacity: 0.75,
  },
  avatarBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 14,
  },
  avatarLocked: {
    backgroundColor: '#E0E0E0',
    borderColor: '#BDBDBD',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  levelTag: {
    position: 'absolute',
    top: -6,
    left: -6,
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  levelTagLocked: {
    backgroundColor: '#757575',
  },
  levelTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  infoBox: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#212121',
  },
  itemNameLocked: {
    color: '#757575',
  },
  itemDesc: {
    fontSize: 12,
    color: '#616161',
    marginTop: 2,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  statChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
});
