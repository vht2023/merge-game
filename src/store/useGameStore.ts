import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { GAME_CONFIG } from '../config/gameConfig';
import { CellItem, DropResult, handleDrop, spawnItem } from '../core/gridLogic';
import { mmkvStorage } from './storage';

export interface GameSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  musicEnabled: boolean;
}

export interface GameStats {
  totalMerges: number;
  totalSpawns: number;
  totalCoinsEarned: number;
}

export interface GameStoreState {
  grid: (CellItem | null)[];
  coins: number;
  energy: number;
  maxEnergy: number;
  unlockedMaxLevel: number;
  discoveredLevels: number[];
  newlyDiscoveredLevel: number | null;
  lastActiveTimestamp: number;
  lastEnergyRegenTimestamp: number;
  settings: GameSettings;
  stats: GameStats;

  // Actions
  spawn: () => { success: boolean; reason?: 'NO_ENERGY' | 'GRID_FULL' };
  dropItem: (fromIndex: number, toIndex: number) => DropResult;
  addCoins: (amount: number) => void;
  consumeEnergy: (amount: number) => boolean;
  refillEnergy: () => void;
  checkAndApplyEnergyRegen: (now?: number) => { regenerated: number; nextRegenInSeconds: number };
  applyPassiveCoins: (coinsToAdd: number) => void;
  updateLastActiveTimestamp: (now?: number) => void;
  dismissNewDiscovery: () => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  toggleMusic: () => void;
  resetGame: () => void;
  spawnGiftItem: (level: number) => boolean;
}

const createInitialGrid = (): (CellItem | null)[] => {
  const grid = new Array(GAME_CONFIG.GRID.TOTAL_CELLS).fill(null);
  // Give player 2 starter seeds so they can merge immediately
  grid[11] = { uid: 'seed_init_1', level: 1, isNew: false };
  grid[12] = { uid: 'seed_init_2', level: 1, isNew: false };
  return grid;
};

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      grid: createInitialGrid(),
      coins: GAME_CONFIG.ECONOMY.STARTING_COINS,
      energy: GAME_CONFIG.ECONOMY.STARTING_ENERGY,
      maxEnergy: GAME_CONFIG.ENERGY.MAX,
      unlockedMaxLevel: 1,
      discoveredLevels: [1],
      newlyDiscoveredLevel: null,
      lastActiveTimestamp: Date.now(),
      lastEnergyRegenTimestamp: Date.now(),
      settings: {
        soundEnabled: true,
        hapticEnabled: true,
        musicEnabled: true,
      },
      stats: {
        totalMerges: 0,
        totalSpawns: 0,
        totalCoinsEarned: 0,
      },

      spawn: () => {
        const state = get();
        if (state.energy < GAME_CONFIG.ENERGY.SPAWN_COST) {
          return { success: false, reason: 'NO_ENERGY' };
        }

        const { newGrid, spawnedIndex, item } = spawnItem(
          state.grid,
          GAME_CONFIG.ECONOMY.SPAWN_BASE_LEVEL
        );

        if (spawnedIndex === null || !item) {
          return { success: false, reason: 'GRID_FULL' };
        }

        set((prev) => ({
          grid: newGrid,
          energy: prev.energy - GAME_CONFIG.ENERGY.SPAWN_COST,
          lastActiveTimestamp: Date.now(),
          stats: {
            ...prev.stats,
            totalSpawns: prev.stats.totalSpawns + 1,
          },
        }));

        return { success: true };
      },

      spawnGiftItem: (level: number) => {
        const state = get();
        const { newGrid, spawnedIndex } = spawnItem(state.grid, level);
        if (spawnedIndex === null) return false;

        const isNewDiscovery = !state.discoveredLevels.includes(level);
        set((prev) => ({
          grid: newGrid,
          unlockedMaxLevel: Math.max(prev.unlockedMaxLevel, level),
          discoveredLevels: isNewDiscovery
            ? [...prev.discoveredLevels, level].sort((a, b) => a - b)
            : prev.discoveredLevels,
          newlyDiscoveredLevel: isNewDiscovery ? level : prev.newlyDiscoveredLevel,
          lastActiveTimestamp: Date.now(),
        }));
        return true;
      },

      dropItem: (fromIndex: number, toIndex: number) => {
        const state = get();
        const result = handleDrop(
          state.grid,
          fromIndex,
          toIndex,
          GAME_CONFIG.ECONOMY.MAX_LEVEL
        );

        if (result.type === 'NOOP') {
          return result;
        }

        const updates: Partial<GameStoreState> = {
          grid: result.newGrid,
          lastActiveTimestamp: Date.now(),
        };

        if (result.type === 'MERGE' && result.mergedLevel) {
          const mergedLevel = result.mergedLevel;
          const reward = result.rewardCoins || 0;
          const isNewDiscovery = !state.discoveredLevels.includes(mergedLevel);

          updates.coins = state.coins + reward;
          updates.unlockedMaxLevel = Math.max(state.unlockedMaxLevel, mergedLevel);

          if (isNewDiscovery) {
            updates.discoveredLevels = [...state.discoveredLevels, mergedLevel].sort((a, b) => a - b);
            updates.newlyDiscoveredLevel = mergedLevel;
          }

          updates.stats = {
            ...state.stats,
            totalMerges: state.stats.totalMerges + 1,
            totalCoinsEarned: state.stats.totalCoinsEarned + reward,
          };
        }

        set(updates);
        return result;
      },

      addCoins: (amount: number) => {
        if (amount <= 0) return;
        set((prev) => ({
          coins: prev.coins + amount,
          lastActiveTimestamp: Date.now(),
          stats: {
            ...prev.stats,
            totalCoinsEarned: prev.stats.totalCoinsEarned + amount,
          },
        }));
      },

      consumeEnergy: (amount: number) => {
        const state = get();
        if (state.energy < amount) return false;
        set((prev) => ({
          energy: prev.energy - amount,
          lastActiveTimestamp: Date.now(),
        }));
        return true;
      },

      refillEnergy: () => {
        set((prev) => ({
          energy: prev.maxEnergy,
          lastEnergyRegenTimestamp: Date.now(),
          lastActiveTimestamp: Date.now(),
        }));
      },

      checkAndApplyEnergyRegen: (now = Date.now()) => {
        const state = get();
        if (state.energy >= state.maxEnergy) {
          return { regenerated: 0, nextRegenInSeconds: GAME_CONFIG.ENERGY.REGEN_INTERVAL_MS / 1000 };
        }

        const elapsed = now - state.lastEnergyRegenTimestamp;
        const interval = GAME_CONFIG.ENERGY.REGEN_INTERVAL_MS;

        if (elapsed < interval) {
          const remainingSec = Math.ceil((interval - elapsed) / 1000);
          return { regenerated: 0, nextRegenInSeconds: remainingSec };
        }

        const possiblePoints = Math.floor(elapsed / interval);
        const neededPoints = state.maxEnergy - state.energy;
        const pointsToAdd = Math.min(possiblePoints, neededPoints);

        const remainderMs = elapsed % interval;
        const newTimestamp = now - remainderMs;

        set((prev) => ({
          energy: Math.min(prev.maxEnergy, prev.energy + pointsToAdd),
          lastEnergyRegenTimestamp: newTimestamp,
        }));

        const remainingSec = Math.ceil((interval - remainderMs) / 1000);
        return { regenerated: pointsToAdd, nextRegenInSeconds: remainingSec };
      },

      applyPassiveCoins: (coinsToAdd: number) => {
        if (coinsToAdd <= 0) return;
        set((prev) => ({
          coins: prev.coins + coinsToAdd,
          stats: {
            ...prev.stats,
            totalCoinsEarned: prev.stats.totalCoinsEarned + coinsToAdd,
          },
        }));
      },

      updateLastActiveTimestamp: (now = Date.now()) => {
        set({ lastActiveTimestamp: now });
      },

      dismissNewDiscovery: () => {
        set({ newlyDiscoveredLevel: null });
      },

      toggleSound: () => {
        set((prev) => ({
          settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled },
        }));
      },

      toggleHaptics: () => {
        set((prev) => ({
          settings: { ...prev.settings, hapticEnabled: !prev.settings.hapticEnabled },
        }));
      },

      toggleMusic: () => {
        set((prev) => ({
          settings: { ...prev.settings, musicEnabled: !prev.settings.musicEnabled },
        }));
      },

      resetGame: () => {
        set({
          grid: createInitialGrid(),
          coins: GAME_CONFIG.ECONOMY.STARTING_COINS,
          energy: GAME_CONFIG.ECONOMY.STARTING_ENERGY,
          maxEnergy: GAME_CONFIG.ENERGY.MAX,
          unlockedMaxLevel: 1,
          discoveredLevels: [1],
          newlyDiscoveredLevel: null,
          lastActiveTimestamp: Date.now(),
          lastEnergyRegenTimestamp: Date.now(),
          stats: {
            totalMerges: 0,
            totalSpawns: 0,
            totalCoinsEarned: 0,
          },
        });
      },
    }),
    {
      name: 'merge_garden_game_state_v1',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
