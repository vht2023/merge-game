import React from 'react';
import { StyleSheet, View } from 'react-native';

interface GridCellProps {
  index: number;
  size: number;
  isTargetHovered?: boolean;
}

export const GridCell = React.memo<GridCellProps>(({ size, isTargetHovered }) => {
  return (
    <View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          borderRadius: Math.max(12, size * 0.2),
        },
        isTargetHovered && styles.cellHovered,
      ]}
    >
      <View style={styles.innerDot} />
    </View>
  );
});

GridCell.displayName = 'GridCell';

const styles = StyleSheet.create({
  cell: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cellHovered: {
    backgroundColor: 'rgba(255, 235, 59, 0.4)',
    borderColor: '#FDD835',
    borderWidth: 2,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
});
