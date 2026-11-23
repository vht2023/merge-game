export const GAME_CONFIG = {
  GRID: {
    ROWS: 5,
    COLS: 5,
    TOTAL_CELLS: 25,
  },
  ENERGY: {
    MAX: 50,
    REGEN_INTERVAL_MS: 4000, // 4 seconds per 1 energy (nearly 4x faster)
    SPAWN_COST: 1,
    AD_REFILL_AMOUNT: 50,
  },
  IDLE: {
    MAX_OFFLINE_MS: 8 * 60 * 60 * 1000,  // 8 hours maximum offline earnings (perfect for overnight)
    MIN_OFFLINE_CLAIM_MS: 15 * 1000,     // Minimum 15 seconds to trigger offline dialog
    TICK_INTERVAL_MS: 1000,              // Passive coin tick every 1s
    AUTO_SPAWN_INTERVAL_MS: 8000,        // Free seed drops onto board every 8 seconds
    AD_MULTIPLIER: 2,
  },
  ECONOMY: {
    STARTING_COINS: 100,
    STARTING_ENERGY: 50,
    MAX_LEVEL: 30,                       // Expanded to 30 levels
    SPAWN_BASE_LEVEL: 1,
  },
  EVENTS: {
    FLYING_GIFT_INTERVAL_MS: 2.5 * 60 * 1000, // 2.5 minutes
  },
  DAILY_REWARDS: [
    { day: 1, coins: 500, energy: 20, itemLevel: 0, title: 'Khởi Đầu Tươi Mát' },
    { day: 2, coins: 1500, energy: 30, itemLevel: 3, title: 'Nhánh Cây Tràn Năng Lượng' },
    { day: 3, coins: 4000, energy: 50, itemLevel: 0, title: 'Nắng Ấm Khu Vườn' },
    { day: 4, coins: 10000, energy: 40, itemLevel: 4, title: 'Chậu Cây May Mắn' },
    { day: 5, coins: 30000, energy: 50, itemLevel: 0, title: 'Mưa Thuận Gió Hòa' },
    { day: 6, coins: 100000, energy: 50, itemLevel: 5, title: 'Nụ Hoa Kỳ Diệu' },
    { day: 7, coins: 500000, energy: 50, itemLevel: 8, title: 'Kho Báu Hướng Dương Vàng' },
  ],
} as const;
