export interface Point {
  x: number;
  y: number;
}

export interface BoardGeometry {
  boardX: number;
  boardY: number;
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
  gap: number;
  rows: number;
  cols: number;
  padding: number;
}

/**
 * Converts a 1D index to row and column
 */
export const indexToRowCol = (index: number, cols: number): { row: number; col: number } => {
  'worklet';
  return {
    row: Math.floor(index / cols),
    col: index % cols,
  };
};

/**
 * Converts row and column to a 1D index
 */
export const rowColToIndex = (row: number, col: number, cols: number): number => {
  'worklet';
  return row * cols + col;
};

/**
 * Calculates which cell index a relative board point (x, y) falls into.
 * Returns null if the point is outside the grid bounds.
 */
export const pointToGridIndex = (
  x: number,
  y: number,
  geometry: BoardGeometry
): number | null => {
  'worklet';
  const { padding, cellSize, gap, rows, cols } = geometry;

  const innerX = x - padding;
  const innerY = y - padding;

  if (innerX < 0 || innerY < 0) {
    return null;
  }

  const stride = cellSize + gap;
  const col = Math.floor(innerX / stride);
  const row = Math.floor(innerY / stride);

  if (col < 0 || col >= cols || row < 0 || row >= rows) {
    return null;
  }

  // Check if point lands inside cell vs gap
  const cellRelativeX = innerX - col * stride;
  const cellRelativeY = innerY - row * stride;

  // Be slightly forgiving around borders for smooth gameplay
  if (cellRelativeX > cellSize + gap * 0.7 || cellRelativeY > cellSize + gap * 0.7) {
    return null;
  }

  return rowColToIndex(row, col, cols);
};

/**
 * Formats large coin values (e.g. 1.2K, 3.4M, 5.6B)
 */
export const formatNumber = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num < 1000) return Math.floor(num).toLocaleString();

  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
  const i = Math.floor(Math.log10(Math.abs(num)) / 3);

  if (i >= suffixes.length) return num.toExponential(2);

  const formatted = (num / Math.pow(10, i * 3)).toFixed(1).replace(/\.0$/, '');
  return `${formatted}${suffixes[i]}`;
};

/**
 * Formats seconds into MM:SS
 */
export const formatTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Generates unique UID for draggable items
 */
let uidCounter = 0;
export const generateUID = (prefix: string = 'item'): string => {
  uidCounter += 1;
  return `${prefix}_${Date.now()}_${uidCounter}_${Math.random().toString(36).substring(2, 7)}`;
};
