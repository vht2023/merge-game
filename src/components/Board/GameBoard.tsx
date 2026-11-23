import React, { useCallback, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { GAME_CONFIG } from '../../config/gameConfig';
import { BoardGeometry } from '../../core/mathUtils';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';
import { useGameStore } from '../../store/useGameStore';
import { DraggableItem } from './DraggableItem';
import { GridCell } from './GridCell';

export const GameBoard: React.FC = () => {
  const grid = useGameStore((state) => state.grid);
  const dropItem = useGameStore((state) => state.dropItem);

  const windowWidth = Dimensions.get('window').width;

  // Compute adaptive geometry for 5x5 grid
  const { geometry, gridWidth, gridHeight } = useMemo(() => {
    const rows = GAME_CONFIG.GRID.ROWS;
    const cols = GAME_CONFIG.GRID.COLS;
    const outerPadding = 10;
    const borderWidth = 4;
    const gap = 8;
    const maxBoardWidth = 400;

    const availableContainerWidth = Math.min(windowWidth - 28, maxBoardWidth);
    const availableForGrid =
      availableContainerWidth - (outerPadding + borderWidth) * 2;
    const cellSize = Math.floor((availableForGrid - gap * (cols - 1)) / cols);

    const actualGridWidth = cellSize * cols + gap * (cols - 1);
    const actualGridHeight = cellSize * rows + gap * (rows - 1);

    const geom: BoardGeometry = {
      boardX: 0,
      boardY: 0,
      boardWidth: actualGridWidth,
      boardHeight: actualGridHeight,
      cellSize,
      gap,
      rows,
      cols,
      padding: 0, // Zero padding because items live in the exact same container as cells
    };

    return {
      geometry: geom,
      gridWidth: actualGridWidth,
      gridHeight: actualGridHeight,
    };
  }, [windowWidth]);

  const handleDrop = useCallback(
    (fromIndex: number, toIndex: number) => {
      const result = dropItem(fromIndex, toIndex);

      if (result.type === 'MERGE') {
        soundService.playMerge();
        hapticService.success();
      } else if (result.type === 'MOVE' || result.type === 'SWAP') {
        soundService.playPop();
        hapticService.light();
      }
    },
    [dropItem]
  );

  return (
    <View style={styles.boardOuterWrapper}>
      {/* Inner grid container: shared coordinate space for cells and items */}
      <View
        style={[
          styles.innerGridContainer,
          {
            width: gridWidth,
            height: gridHeight,
          },
        ]}
      >
        {/* Background static grid cells (5 rows x 5 cols) */}
        <View style={{ gap: geometry.gap }}>
          {Array.from({ length: geometry.rows }).map((_, r) => (
            <View
              key={`row_${r}`}
              style={[styles.gridRow, { gap: geometry.gap }]}
            >
              {Array.from({ length: geometry.cols }).map((_, c) => {
                const i = r * geometry.cols + c;
                return (
                  <View
                    key={`cell_${i}`}
                    style={{
                      width: geometry.cellSize,
                      height: geometry.cellSize,
                    }}
                  >
                    <GridCell index={i} size={geometry.cellSize} />
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Interactive Draggable Items */}
        {grid.map((item, index) => {
          if (!item) return null;
          return (
            <DraggableItem
              key={item.uid}
              item={item}
              index={index}
              geometry={geometry}
              onDrop={handleDrop}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  boardOuterWrapper: {
    backgroundColor: '#C8E6C9',
    borderRadius: 24,
    padding: 10,
    borderWidth: 4,
    borderColor: '#81C784',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    alignSelf: 'center',
  },
  innerGridContainer: {
    position: 'relative',
  },
  gridRow: {
    flexDirection: 'row',
  },
});
