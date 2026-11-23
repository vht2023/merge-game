import { getItemDef } from '../config/itemsConfig';
import { generateUID } from './mathUtils';

export interface CellItem {
  uid: string;
  level: number;
  isNew?: boolean;
}

export type DropResultType = 'NOOP' | 'MOVE' | 'MERGE' | 'SWAP';

export interface DropResult {
  type: DropResultType;
  newGrid: (CellItem | null)[];
  fromIndex: number;
  toIndex: number;
  mergedLevel?: number;
  rewardCoins?: number;
}

/**
 * Finds all empty indices in the grid
 */
export const findEmptyIndices = (grid: (CellItem | null)[]): number[] => {
  const emptyIndices: number[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === null) {
      emptyIndices.push(i);
    }
  }
  return emptyIndices;
};

/**
 * Finds a random empty cell index or returns null if grid is full
 */
export const findRandomEmptyIndex = (grid: (CellItem | null)[]): number | null => {
  const empty = findEmptyIndices(grid);
  if (empty.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * empty.length);
  return empty[randomIndex];
};

/**
 * Pure function: Spawns an item on a random empty slot.
 */
export const spawnItem = (
  grid: (CellItem | null)[],
  level: number = 1
): {
  newGrid: (CellItem | null)[];
  spawnedIndex: number | null;
  item: CellItem | null;
} => {
  const targetIndex = findRandomEmptyIndex(grid);
  if (targetIndex === null) {
    return { newGrid: grid, spawnedIndex: null, item: null };
  }

  const newItem: CellItem = {
    uid: generateUID('spawn'),
    level,
    isNew: true,
  };

  const newGrid = [...grid];
  newGrid[targetIndex] = newItem;

  return {
    newGrid,
    spawnedIndex: targetIndex,
    item: newItem,
  };
};

/**
 * Pure function: Handles drop interaction between fromIndex and toIndex
 */
export const handleDrop = (
  grid: (CellItem | null)[],
  fromIndex: number,
  toIndex: number,
  maxLevel: number = 15
): DropResult => {
  // If dropped in the same slot or invalid bounds
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= grid.length ||
    toIndex < 0 ||
    toIndex >= grid.length
  ) {
    return { type: 'NOOP', newGrid: grid, fromIndex, toIndex };
  }

  const sourceItem = grid[fromIndex];
  if (!sourceItem) {
    return { type: 'NOOP', newGrid: grid, fromIndex, toIndex };
  }

  const targetItem = grid[toIndex];
  const newGrid = [...grid];

  // Case 1: Target slot is empty -> Move
  if (!targetItem) {
    newGrid[fromIndex] = null;
    newGrid[toIndex] = { ...sourceItem, isNew: false };
    return {
      type: 'MOVE',
      newGrid,
      fromIndex,
      toIndex,
    };
  }

  // Case 2: Both items have the same level and not yet at max level -> MERGE
  if (sourceItem.level === targetItem.level && sourceItem.level < maxLevel) {
    const nextLevel = sourceItem.level + 1;
    const itemDef = getItemDef(nextLevel);

    newGrid[fromIndex] = null;
    newGrid[toIndex] = {
      uid: generateUID('merge'),
      level: nextLevel,
      isNew: true,
    };

    return {
      type: 'MERGE',
      newGrid,
      fromIndex,
      toIndex,
      mergedLevel: nextLevel,
      rewardCoins: itemDef.mergeReward,
    };
  }

  // Case 3: Items have different levels or already at max level -> SWAP
  newGrid[fromIndex] = { ...targetItem, isNew: false };
  newGrid[toIndex] = { ...sourceItem, isNew: false };

  return {
    type: 'SWAP',
    newGrid,
    fromIndex,
    toIndex,
  };
};

/**
 * Calculates sum of coins generated per second across the whole grid
 */
export const calculateTotalCoinsPerSecond = (grid: (CellItem | null)[]): number => {
  return grid.reduce((total, item) => {
    if (!item) return total;
    const def = getItemDef(item.level);
    return total + (def.coinsPerSecond || 0);
  }, 0);
};

/**
 * Computes offline reward earnings given idle duration in milliseconds
 */
export const calculateOfflineEarnings = (
  coinsPerSec: number,
  elapsedMs: number,
  maxOfflineMs: number
): { earnedCoins: number; elapsedSeconds: number } => {
  if (coinsPerSec <= 0 || elapsedMs <= 0) {
    return { earnedCoins: 0, elapsedSeconds: 0 };
  }

  const cappedElapsedMs = Math.min(elapsedMs, maxOfflineMs);
  const elapsedSeconds = Math.floor(cappedElapsedMs / 1000);
  const earnedCoins = Math.floor(coinsPerSec * elapsedSeconds);

  return { earnedCoins, elapsedSeconds };
};
