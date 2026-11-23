import React from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatNumber } from '../../core/mathUtils';
import { TRANSLATIONS } from '../../i18n/translations';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';
import { useGameStore } from '../../store/useGameStore';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const settings = useGameStore((state) => state.settings);
  const stats = useGameStore((state) => state.stats);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const toggleMusic = useGameStore((state) => state.toggleMusic);
  const toggleHaptics = useGameStore((state) => state.toggleHaptics);
  const setLanguage = useGameStore((state) => state.setLanguage);
  const resetGame = useGameStore((state) => state.resetGame);

  const lang = settings.language || 'vi';
  const t = TRANSLATIONS[lang].settings;

  if (!visible) return null;

  const handleMusicChange = () => {
    toggleMusic();
    hapticService.selection();
    if (settings.musicEnabled) {
      soundService.pauseBGM();
    } else {
      soundService.resumeBGM();
    }
  };

  const handleReset = () => {
    Alert.alert(
      t.resetConfirmTitle,
      t.resetConfirmBody,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.confirmReset,
          style: 'destructive',
          onPress: () => {
            resetGame();
            soundService.playPop();
            hapticService.medium();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t.title}</Text>
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

          {/* Settings Toggles */}
          <View style={styles.section}>
            {/* Sound FX */}
            <View style={styles.row}>
              <View style={styles.labelGroup}>
                <Text style={styles.rowIcon}>🔊</Text>
                <Text style={styles.rowLabel}>{t.sfx}</Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={() => {
                  toggleSound();
                  hapticService.selection();
                }}
                trackColor={{ false: '#BDBDBD', true: '#81C784' }}
                thumbColor={settings.soundEnabled ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            {/* BGM */}
            <View style={styles.row}>
              <View style={styles.labelGroup}>
                <Text style={styles.rowIcon}>🎵</Text>
                <Text style={styles.rowLabel}>{t.bgm}</Text>
              </View>
              <Switch
                value={settings.musicEnabled}
                onValueChange={handleMusicChange}
                trackColor={{ false: '#BDBDBD', true: '#81C784' }}
                thumbColor={settings.musicEnabled ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            {/* Haptics */}
            <View style={styles.row}>
              <View style={styles.labelGroup}>
                <Text style={styles.rowIcon}>📳</Text>
                <Text style={styles.rowLabel}>{t.haptics}</Text>
              </View>
              <Switch
                value={settings.hapticEnabled}
                onValueChange={() => {
                  toggleHaptics();
                  hapticService.selection();
                }}
                trackColor={{ false: '#BDBDBD', true: '#81C784' }}
                thumbColor={settings.hapticEnabled ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            {/* Language Switcher */}
            <View style={styles.rowLanguage}>
              <View style={styles.labelGroup}>
                <Text style={styles.rowIcon}>🌐</Text>
                <Text style={styles.rowLabel}>{t.language}</Text>
              </View>
              <View style={styles.langButtonGroup}>
                <TouchableOpacity
                  style={[
                    styles.langButton,
                    lang === 'vi' && styles.langButtonActive,
                  ]}
                  onPress={() => {
                    setLanguage('vi');
                    soundService.playPop();
                    hapticService.selection();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.langButtonText,
                      lang === 'vi' && styles.langButtonTextActive,
                    ]}
                  >
                    Tiếng Việt
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.langButton,
                    lang === 'en' && styles.langButtonActive,
                  ]}
                  onPress={() => {
                    setLanguage('en');
                    soundService.playPop();
                    hapticService.selection();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.langButtonText,
                      lang === 'en' && styles.langButtonTextActive,
                    ]}
                  >
                    English
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>{t.statsTitle}</Text>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>{t.totalMerges}</Text>
              <Text style={styles.statVal}>{stats.totalMerges}</Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>{t.totalSpawns}</Text>
              <Text style={styles.statVal}>{stats.totalSpawns}</Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>{t.totalCoins}</Text>
              <Text style={styles.statVal}>
                {formatNumber(stats.totalCoinsEarned)} 🪙
              </Text>
            </View>
          </View>

          {/* Reset button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>{t.resetBtn}</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>{t.version}</Text>
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
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#666666',
  },
  section: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  rowLanguage: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    gap: 8,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  langButtonGroup: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  langButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  langButtonActive: {
    backgroundColor: '#4CAF50',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  langButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#558B2F',
  },
  langButtonTextActive: {
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DCEDC8',
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#33691E',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#558B2F',
  },
  statVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B5E20',
  },
  resetButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButtonText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '700',
  },
  versionText: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
