export const GAME_CONFIG = {
  GRID: {
    ROWS: 5,
    COLS: 5,
    TOTAL_CELLS: 25,
  },
  ENERGY: {
    MAX: 30,
    REGEN_INTERVAL_MS: 15000, // 15 seconds per 1 energy
    SPAWN_COST: 1,
    AD_REFILL_AMOUNT: 30,
  },
  IDLE: {
    MAX_OFFLINE_MS: 4 * 60 * 60 * 1000, // 4 hours maximum offline earnings
    MIN_OFFLINE_CLAIM_MS: 15 * 1000,    // Minimum 15 seconds to trigger offline dialog
    TICK_INTERVAL_MS: 1000,             // Passive coin tick every 1s
    AD_MULTIPLIER: 2,
  },
  ECONOMY: {
    STARTING_COINS: 50,
    STARTING_ENERGY: 30,
    MAX_LEVEL: 15,
    SPAWN_BASE_LEVEL: 1,
  },
  EVENTS: {
    FLYING_GIFT_INTERVAL_MS: 3 * 60 * 1000, // 3 minutes
  },
} as const;
