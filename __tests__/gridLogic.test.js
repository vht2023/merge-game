const test = require('node:test');
const assert = require('node:assert/strict');

const {
  findEmptyIndices,
  findRandomEmptyIndex,
  spawnItem,
  handleDrop,
  calculateTotalCoinsPerSecond,
  calculateOfflineEarnings,
} = require('../dist/core/gridLogic.js');

const {
  indexToRowCol,
  rowColToIndex,
  pointToGridIndex,
  formatNumber,
  formatTime,
} = require('../dist/core/mathUtils.js');

test('indexToRowCol and rowColToIndex roundtrip', () => {
  const cols = 5;
  for (let i = 0; i < 25; i++) {
    const { row, col } = indexToRowCol(i, cols);
    const convertedIndex = rowColToIndex(row, col, cols);
    assert.equal(convertedIndex, i);
  }
});

test('pointToGridIndex converts relative coordinates accurately', () => {
  const geometry = {
    boardX: 0,
    boardY: 0,
    boardWidth: 320,
    boardHeight: 320,
    cellSize: 50,
    gap: 8,
    rows: 5,
    cols: 5,
    padding: 10,
  };

  // Center of cell (0, 0) -> x = 10 + 25 = 35, y = 10 + 25 = 35
  const index0 = pointToGridIndex(35, 35, geometry);
  assert.equal(index0, 0);

  // Center of cell (0, 1) -> x = 10 + 50 + 8 + 25 = 93, y = 35
  const index1 = pointToGridIndex(93, 35, geometry);
  assert.equal(index1, 1);

  // Outside bounds
  const outside = pointToGridIndex(500, 500, geometry);
  assert.equal(outside, null);
});

test('spawnItem finds an empty slot and places level 1 item', () => {
  const emptyGrid = new Array(25).fill(null);
  const { newGrid, spawnedIndex, item } = spawnItem(emptyGrid, 1);

  assert.notEqual(spawnedIndex, null);
  assert.equal(item.level, 1);
  assert.equal(newGrid[spawnedIndex].level, 1);
});

test('spawnItem returns null when grid is full', () => {
  const fullGrid = new Array(25).fill({ uid: 'test', level: 1 });
  const { newGrid, spawnedIndex, item } = spawnItem(fullGrid, 1);

  assert.equal(spawnedIndex, null);
  assert.equal(item, null);
  assert.equal(newGrid, fullGrid);
});

test('handleDrop MOVE: drops onto empty slot', () => {
  const grid = new Array(25).fill(null);
  grid[0] = { uid: 'seed_1', level: 1 };

  const result = handleDrop(grid, 0, 5, 15);
  assert.equal(result.type, 'MOVE');
  assert.equal(result.newGrid[0], null);
  assert.equal(result.newGrid[5].level, 1);
});

test('handleDrop MERGE: merges identical levels into level + 1 with rewards', () => {
  const grid = new Array(25).fill(null);
  grid[0] = { uid: 'seed_1', level: 1 };
  grid[1] = { uid: 'seed_2', level: 1 };

  const result = handleDrop(grid, 0, 1, 15);
  assert.equal(result.type, 'MERGE');
  assert.equal(result.mergedLevel, 2);
  assert.equal(result.newGrid[0], null);
  assert.equal(result.newGrid[1].level, 2);
  assert.ok(result.rewardCoins > 0);
});

test('handleDrop SWAP: swaps items with different levels', () => {
  const grid = new Array(25).fill(null);
  grid[0] = { uid: 'item_1', level: 1 };
  grid[1] = { uid: 'item_2', level: 3 };

  const result = handleDrop(grid, 0, 1, 15);
  assert.equal(result.type, 'SWAP');
  assert.equal(result.newGrid[0].level, 3);
  assert.equal(result.newGrid[1].level, 1);
});

test('handleDrop SWAP: swaps when items are at max level (cannot merge further)', () => {
  const grid = new Array(25).fill(null);
  grid[0] = { uid: 'max_1', level: 15 };
  grid[1] = { uid: 'max_2', level: 15 };

  const result = handleDrop(grid, 0, 1, 15);
  assert.equal(result.type, 'SWAP');
});

test('calculateOfflineEarnings respects cap', () => {
  const coinsPerSec = 10;
  const fourHoursMs = 4 * 60 * 60 * 1000;
  const sixHoursMs = 6 * 60 * 60 * 1000;

  const result = calculateOfflineEarnings(coinsPerSec, sixHoursMs, fourHoursMs);
  assert.equal(result.elapsedSeconds, 4 * 3600);
  assert.equal(result.earnedCoins, 10 * 4 * 3600);
});

test('formatNumber formats thousands and millions properly', () => {
  assert.equal(formatNumber(50), '50');
  assert.equal(formatNumber(1500), '1.5K');
  assert.equal(formatNumber(2000000), '2M');
});

test('formatTime formats seconds into MM:SS', () => {
  assert.equal(formatTime(15), '00:15');
  assert.equal(formatTime(75), '01:15');
  assert.equal(formatTime(3600), '60:00');
});
