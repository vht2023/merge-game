import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { GAME_CONFIG } from '../config/gameConfig';
import { CellItem, DropResult, findEmptyIndices, handleDrop, spawnItem } from '../core/gridLogic';
import { Language } from '../i18n/translations';
import { mmkvStorage } from './storage';

export interface GameSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  musicEnabled: boolean;
  language: Language;
}

export interface GameStats {
  totalMerges: number;
  totalSpawns: number;
  totalCoinsEarned: number;
}

export interface DailyRewardItem {
  day: number;
  coins: number;
  energy: number;
  itemLevel: number;
  title: string;
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
  dailyStreak: number;
  lastDailyClaimDate: string | null;
  settings: GameSettings;
  stats: GameStats;

  // Actions
  spawn: () => { success: boolean; reason?: 'NO_ENERGY' | 'GRID_FULL'; spawnedLevel?: number };
  autoSpawnSeed: () => { success: boolean; spawnedIndex?: number };
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
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  resetGame: () => void;
  spawnGiftItem: (level: number) => boolean;
  isDailyAvailable: () => boolean;
  claimDailyReward: () => { success: boolean; reward?: DailyRewardItem };
}

const createInitialGrid = (): (CellItem | null)[] => {
  const grid = new Array(GAME_CONFIG.GRID.TOTAL_CELLS).fill(null);
  // Give player 2 starter seeds so they can merge immediately
  grid[11] = { uid: 'seed_init_1', level: 1, isNew: false };
  grid[12] = { uid: 'seed_init_2', level: 1, isNew: false };
  return grid;
};

function getLuckySpawnLevel(unlockedMaxLevel: number): number {
  if (unlockedMaxLevel < 5) return 1;
  const rand = Math.random();
  if (unlockedMaxLevel >= 20) {
    if (rand < 0.10) return 4;
    if (rand < 0.30) return 3;
    if (rand < 0.65) return 2;
    return 1;
  }
  if (unlockedMaxLevel >= 12) {
    if (rand < 0.08) return 4;
    if (rand < 0.25) return 3;
    if (rand < 0.55) return 2;
    return 1;
  }
  if (unlockedMaxLevel >= 8) {
    if (rand < 0.18) return 3;
    if (rand < 0.45) return 2;
    return 1;
  }
  // >= 5
  if (rand < 0.30) return 2;
  return 1;
}

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
      dailyStreak: 0,
      lastDailyClaimDate: null,
      settings: {
        soundEnabled: true,
        hapticEnabled: true,
        musicEnabled: true,
        language: 'vi',
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

        const spawnLvl = getLuckySpawnLevel(state.unlockedMaxLevel);
        const { newGrid, spawnedIndex, item } = spawnItem(state.grid, spawnLvl);

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

        return { success: true, spawnedLevel: spawnLvl };
      },

      autoSpawnSeed: () => {
        const state = get();
        const empty = findEmptyIndices(state.grid);
        if (empty.length === 0) return { success: false };

        // Chance for Level 1 or 2
        const spawnLvl = state.unlockedMaxLevel >= 5 && Math.random() < 0.25 ? 2 : 1;
        const { newGrid, spawnedIndex } = spawnItem(state.grid, spawnLvl);
        if (spawnedIndex === null) return { success: false };

        set((prev) => ({
          grid: newGrid,
          stats: {
            ...prev.stats,
            totalSpawns: prev.stats.totalSpawns + 1,
          },
        }));

        return { success: true, spawnedIndex };
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

      setLanguage: (lang: Language) => {
        set((prev) => ({
          settings: { ...prev.settings, language: lang },
        }));
      },

      toggleLanguage: () => {
        set((prev) => ({
          settings: {
            ...prev.settings,
            language: (prev.settings.language || 'vi') === 'vi' ? 'en' : 'vi',
          },
        }));
      },

      isDailyAvailable: () => {
        const state = get();
        const todayStr = new Date().toISOString().split('T')[0];
        return state.lastDailyClaimDate !== todayStr;
      },

      claimDailyReward: () => {
        const state = get();
        const todayStr = new Date().toISOString().split('T')[0];
        if (state.lastDailyClaimDate === todayStr) {
          return { success: false };
        }

        let newStreak = (state.dailyStreak || 0) + 1;
        if (newStreak > 7) {
          newStreak = 1;
        }

        const rewardIndex = (newStreak - 1) % GAME_CONFIG.DAILY_REWARDS.length;
        const reward = GAME_CONFIG.DAILY_REWARDS[rewardIndex];

        let newGrid = state.grid;
        if (reward.itemLevel > 0) {
          const spawnRes = spawnItem(state.grid, reward.itemLevel);
          if (spawnRes.spawnedIndex !== null) {
            newGrid = spawnRes.newGrid;
          }
        }

        set((prev) => ({
          dailyStreak: newStreak,
          lastDailyClaimDate: todayStr,
          coins: prev.coins + reward.coins,
          energy: Math.min(prev.maxEnergy, prev.energy + reward.energy),
          grid: newGrid,
          unlockedMaxLevel:
            reward.itemLevel > 0
              ? Math.max(prev.unlockedMaxLevel, reward.itemLevel)
              : prev.unlockedMaxLevel,
          discoveredLevels:
            reward.itemLevel > 0 && !prev.discoveredLevels.includes(reward.itemLevel)
              ? [...prev.discoveredLevels, reward.itemLevel].sort((a, b) => a - b)
              : prev.discoveredLevels,
          stats: {
            ...prev.stats,
            totalCoinsEarned: prev.stats.totalCoinsEarned + reward.coins,
          },
        }));

        return { success: true, reward };
      },

      resetGame: () => {
        const currentLang = get().settings.language || 'vi';
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
          dailyStreak: 0,
          lastDailyClaimDate: null,
          settings: {
            ...get().settings,
            language: currentLang,
          },
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
