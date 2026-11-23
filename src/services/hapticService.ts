import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/useGameStore';

export const hapticService = {
  light: async (): Promise<void> => {
    try {
      if (!useGameStore.getState().settings.hapticEnabled) return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored on unsupported platforms/devices
    }
  },

  medium: async (): Promise<void> => {
    try {
      if (!useGameStore.getState().settings.hapticEnabled) return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignored
    }
  },

  heavy: async (): Promise<void> => {
    try {
      if (!useGameStore.getState().settings.hapticEnabled) return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Ignored
    }
  },

  success: async (): Promise<void> => {
    try {
      if (!useGameStore.getState().settings.hapticEnabled) return;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignored
    }
  },

  selection: async (): Promise<void> => {
    try {
      if (!useGameStore.getState().settings.hapticEnabled) return;
      await Haptics.selectionAsync();
    } catch {
      // Ignored
    }
  },
};
