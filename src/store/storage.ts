import { StateStorage } from 'zustand/middleware';

let mmkvInstance: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv');
  mmkvInstance = new MMKV({
    id: 'merge-garden-storage',
  });
} catch {
  // Graceful fallback for non-native environments (tests, web, expo go preview)
  mmkvInstance = null;
}

// Fallback in-memory map
const memoryFallback = new Map<string, string>();

export const mmkvStorage: StateStorage = {
  setItem: (name: string, value: string): void => {
    if (mmkvInstance) {
      try {
        mmkvInstance.set(name, value);
        return;
      } catch {
        // Fall back to memory if MMKV write fails
      }
    }
    memoryFallback.set(name, value);
  },
  getItem: (name: string): string | null => {
    if (mmkvInstance) {
      try {
        const value = mmkvInstance.getString(name);
        return value ?? null;
      } catch {
        // Fall back to memory
      }
    }
    return memoryFallback.get(name) ?? null;
  },
  removeItem: (name: string): void => {
    if (mmkvInstance) {
      try {
        mmkvInstance.delete(name);
        return;
      } catch {
        // Fall back to memory
      }
    }
    memoryFallback.delete(name);
  },
};
