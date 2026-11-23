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
  const resetGame = useGameStore((state) => state.resetGame);

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
      'Xóa Dữ Liệu Chơi Lại? ⚠️',
      'Toàn bộ bàn cờ, cấp độ mở khóa và số xu sẽ được khôi phục về trạng thái ban đầu. Bạn có chắc chắn không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác Nhận Xóa',
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
            <Text style={styles.title}>⚙️ Cài Đặt</Text>
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
            <View style={styles.row}>
              <View style={styles.labelGroup}>
                <Text style={styles.rowIcon}>🔊</Text>
                <Text style={styles.rowLabel}>Hiệu Ứng Âm Thanh</Text>
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

            <View style={styles.row}>
              <View style={styles.labelGroup}>
                <Text style={styles.rowIcon}>🎵</Text>
                <Text style={styles.rowLabel}>Nhạc Nền Thư Giãn (Lofi)</Text>
              </View>
              <Switch
                value={settings.musicEnabled}
                onValueChange={handleMusicChange}
                trackColor={{ false: '#BDBDBD', true: '#81C784' }}
                thumbColor={settings.musicEnabled ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.labelGroup}>
                <Text style={styles.rowIcon}>📳</Text>
                <Text style={styles.rowLabel}>Phản Hồi Rung (Haptic)</Text>
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
          </View>

          {/* Stats Section */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Thống Kê Trò Chơi</Text>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Lần Hợp Nhất:</Text>
              <Text style={styles.statVal}>{stats.totalMerges}</Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Lần Gieo Hạt:</Text>
              <Text style={styles.statVal}>{stats.totalSpawns}</Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLabel}>Tổng Xu Kiếm Được:</Text>
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
            <Text style={styles.resetButtonText}>🔄 Chơi Lại Từ Đầu</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Merge Garden v1.0.0 (Release Build)</Text>
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
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
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
  statsCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
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
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  resetButtonText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
