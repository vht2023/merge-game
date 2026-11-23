import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GAME_CONFIG } from '../config/gameConfig';
import { GameBoard } from '../components/Board/GameBoard';
import { BottomBar } from '../components/HUD/BottomBar';
import { FlyingGift } from '../components/HUD/FlyingGift';
import { TopBar } from '../components/HUD/TopBar';
import { CollectionModal } from '../components/Modals/CollectionModal';
import { DailyRewardModal } from '../components/Modals/DailyRewardModal';
import { NewDiscoveryModal } from '../components/Modals/NewDiscoveryModal';
import { OfflineRewardModal } from '../components/Modals/OfflineRewardModal';
import { SettingsModal } from '../components/Modals/SettingsModal';
import {
  calculateOfflineEarnings,
  calculateTotalCoinsPerSecond,
} from '../core/gridLogic';
import { hapticService } from '../services/hapticService';
import { soundService } from '../services/soundService';
import { useGameStore } from '../store/useGameStore';

export const GameScreen: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [offlineModalState, setOfflineModalState] = useState<{
    visible: boolean;
    earnedCoins: number;
    elapsedSeconds: number;
  }>({
    visible: false,
    earnedCoins: 0,
    elapsedSeconds: 0,
  });

  const [nextRegenSeconds, setNextRegenSeconds] = useState(
    GAME_CONFIG.ENERGY.REGEN_INTERVAL_MS / 1000
  );

  const grid = useGameStore((state) => state.grid);
  const lastActiveTimestamp = useGameStore((state) => state.lastActiveTimestamp);
  const checkAndApplyEnergyRegen = useGameStore(
    (state) => state.checkAndApplyEnergyRegen
  );
  const applyPassiveCoins = useGameStore((state) => state.applyPassiveCoins);
  const autoSpawnSeed = useGameStore((state) => state.autoSpawnSeed);
  const updateLastActiveTimestamp = useGameStore(
    (state) => state.updateLastActiveTimestamp
  );
  const isDailyAvailable = useGameStore((state) => state.isDailyAvailable);

  const initialOfflineCheckedRef = useRef(false);

  // 1. Initial Offline Earnings Calculation & Daily Reward popup
  useEffect(() => {
    if (!initialOfflineCheckedRef.current) {
      initialOfflineCheckedRef.current = true;
      const now = Date.now();
      const elapsedMs = now - lastActiveTimestamp;

      let hasOfflineReward = false;
      if (elapsedMs >= GAME_CONFIG.IDLE.MIN_OFFLINE_CLAIM_MS) {
        const coinsPerSec = calculateTotalCoinsPerSecond(grid);
        const { earnedCoins, elapsedSeconds } = calculateOfflineEarnings(
          coinsPerSec,
          elapsedMs,
          GAME_CONFIG.IDLE.MAX_OFFLINE_MS
        );

        if (earnedCoins > 0) {
          hasOfflineReward = true;
          setOfflineModalState({
            visible: true,
            earnedCoins,
            elapsedSeconds,
          });
        }
      }

      // If no offline reward to claim, prompt daily reward if ready
      if (!hasOfflineReward && isDailyAvailable()) {
        setTimeout(() => {
          setIsDailyOpen(true);
        }, 1200);
      }

      // Sync active timestamp and energy regen
      updateLastActiveTimestamp(now);
      checkAndApplyEnergyRegen(now);
      soundService.startBGM();
    }
  }, [
    grid,
    lastActiveTimestamp,
    updateLastActiveTimestamp,
    checkAndApplyEnergyRegen,
    isDailyAvailable,
  ]);

  // 2. Active Game Loop (Passive coins + Energy regeneration ticker)
  useEffect(() => {
    const loopInterval = setInterval(() => {
      const now = Date.now();

      // Energy regen
      const { nextRegenInSeconds } = checkAndApplyEnergyRegen(now);
      setNextRegenSeconds(nextRegenInSeconds);

      // Passive income
      const activeGrid = useGameStore.getState().grid;
      const coinsPerSec = calculateTotalCoinsPerSecond(activeGrid);
      if (coinsPerSec > 0) {
        applyPassiveCoins(coinsPerSec);
      }

      // Update keepalive timestamp
      updateLastActiveTimestamp(now);
    }, GAME_CONFIG.IDLE.TICK_INTERVAL_MS);

    return () => clearInterval(loopInterval);
  }, [checkAndApplyEnergyRegen, applyPassiveCoins, updateLastActiveTimestamp]);

  // 3. Free Auto-Spawn Dropper (Every 8 seconds drops a free seed into an empty cell)
  useEffect(() => {
    const autoSpawnInterval = setInterval(() => {
      const res = autoSpawnSeed();
      if (res.success) {
        soundService.playPop();
        hapticService.light();
      }
    }, GAME_CONFIG.IDLE.AUTO_SPAWN_INTERVAL_MS);

    return () => clearInterval(autoSpawnInterval);
  }, [autoSpawnSeed]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundContainer}>
        {/* Top HUD */}
        <TopBar
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenDailyRewards={() => setIsDailyOpen(true)}
          nextRegenSeconds={nextRegenSeconds}
        />

        {/* Center: Interactive Board */}
        <View style={styles.boardContainer}>
          <GameBoard />
        </View>

        {/* Flying Gift Event */}
        <FlyingGift />

        {/* Bottom HUD */}
        <BottomBar onOpenCollection={() => setIsCollectionOpen(true)} />

        {/* Modals */}
        <OfflineRewardModal
          visible={offlineModalState.visible}
          earnedCoins={offlineModalState.earnedCoins}
          elapsedSeconds={offlineModalState.elapsedSeconds}
          onClose={() => {
            setOfflineModalState((prev) => ({ ...prev, visible: false }));
            // If daily reward is available, show after closing offline modal
            if (isDailyAvailable()) {
              setTimeout(() => setIsDailyOpen(true), 400);
            }
          }}
        />

        <DailyRewardModal
          visible={isDailyOpen}
          onClose={() => setIsDailyOpen(false)}
        />

        <CollectionModal
          visible={isCollectionOpen}
          onClose={() => setIsCollectionOpen(false)}
        />

        <SettingsModal
          visible={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        <NewDiscoveryModal />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  backgroundContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
});
