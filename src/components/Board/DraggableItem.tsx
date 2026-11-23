import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { getItemDef } from '../../config/itemsConfig';
import { CellItem } from '../../core/gridLogic';
import { BoardGeometry, pointToGridIndex } from '../../core/mathUtils';
import { hapticService } from '../../services/hapticService';
import { soundService } from '../../services/soundService';

interface DraggableItemProps {
  item: CellItem;
  index: number;
  geometry: BoardGeometry;
  onDrop: (fromIndex: number, toIndex: number) => void;
}

export const DraggableItem = React.memo<DraggableItemProps>(
  ({ item, index, geometry, onDrop }) => {
    const { cellSize, gap, padding, cols } = geometry;
    const def = getItemDef(item.level);

    // Initial position on grid
    const col = index % cols;
    const row = Math.floor(index / cols);
    const baseX = padding + col * (cellSize + gap);
    const baseY = padding + row * (cellSize + gap);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const zIndex = useSharedValue(1);

    // Bounce animation on new spawn or merge
    useEffect(() => {
      if (item.isNew) {
        scale.value = withSequence(
          withTiming(1.28, { duration: 160 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        );
      }
    }, [item.uid, item.isNew, scale]);

    const handlePickupFeedback = () => {
      soundService.playPop();
      hapticService.light();
    };

    const handleDropAction = (targetIndex: number | null) => {
      if (targetIndex !== null && targetIndex !== index) {
        onDrop(index, targetIndex);
      }
    };

    const panGesture = Gesture.Pan()
      .onStart(() => {
        'worklet';
        zIndex.value = 999;
        scale.value = withSpring(1.18, { damping: 12 });
        runOnJS(handlePickupFeedback)();
      })
      .onUpdate((event) => {
        'worklet';
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      })
      .onEnd((event) => {
        'worklet';
        const fingerX = baseX + cellSize / 2 + event.translationX;
        const fingerY = baseY + cellSize / 2 + event.translationY;

        const targetIndex = pointToGridIndex(fingerX, fingerY, geometry);

        if (targetIndex !== null && targetIndex !== index) {
          // Valid drop target: reset immediately and let store update
          translateX.value = 0;
          translateY.value = 0;
          scale.value = 1;
          zIndex.value = 1;
          runOnJS(handleDropAction)(targetIndex);
        } else {
          // Snap back with spring
          translateX.value = withSpring(0, { damping: 16, stiffness: 220 });
          translateY.value = withSpring(0, { damping: 16, stiffness: 220 });
          scale.value = withSpring(1, { damping: 14 });
          zIndex.value = 1;
        }
      });

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
        zIndex: zIndex.value,
      };
    });

    return (
      <View
        style={[
          styles.container,
          {
            left: baseX,
            top: baseY,
            width: cellSize,
            height: cellSize,
          },
        ]}
        pointerEvents="box-none"
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.itemCard,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor: def.badgeColor,
                borderColor: def.borderColor,
                borderRadius: Math.max(14, cellSize * 0.22),
              },
              animatedStyle,
            ]}
          >
            {/* Level Badge */}
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: def.borderColor },
              ]}
            >
              <Text style={styles.levelText}>{item.level}</Text>
            </View>

            {/* Central Emoji / Artwork */}
            <Text
              style={[
                styles.emoji,
                { fontSize: Math.floor(cellSize * 0.44) },
              ]}
            >
              {def.emoji}
            </Text>

            {/* Coins per second info */}
            <View style={styles.rateContainer}>
              <Text style={styles.rateText}>+{def.coinsPerSecond}/s</Text>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  }
);

DraggableItem.displayName = 'DraggableItem';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  itemCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#1b5e20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  levelBadge: {
    position: 'absolute',
    top: 3,
    left: 4,
    minWidth: 18,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  emoji: {
    textAlign: 'center',
  },
  rateContainer: {
    position: 'absolute',
    bottom: 2,
    alignItems: 'center',
  },
  rateText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2E7D32',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
