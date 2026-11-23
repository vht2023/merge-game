import { AppState, AppStateStatus } from 'react-native';
import { useGameStore } from '../store/useGameStore';

let createAudioPlayerFn: any = null;
let setAudioModeAsyncFn: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expoAudio = require('expo-audio');
  createAudioPlayerFn = expoAudio.createAudioPlayer;
  setAudioModeAsyncFn = expoAudio.setAudioModeAsync;
} catch {
  // Safe fallback
}

class SoundService {
  private bgmPlayer: any = null;
  private isBgmPlaying = false;
  private isMutedForBackground = false;
  private audioModePromise: Promise<void> | null = null;

  constructor() {
    this.audioModePromise = this.initAudioMode();
    this.setupAppStateListener();
  }

  private async initAudioMode() {
    if (!setAudioModeAsyncFn) return;
    try {
      await setAudioModeAsyncFn({
        playsInSilentMode: true,
        playsInSilentModeIOS: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      });
    } catch {
      // Ignore
    }
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (this.isMutedForBackground) {
          this.isMutedForBackground = false;
          if (useGameStore.getState().settings.musicEnabled) {
            this.resumeBGM();
          }
        }
      } else {
        if (this.isBgmPlaying) {
          this.isMutedForBackground = true;
          this.pauseBGM();
        }
      }
    });
  }

  private playSFX(source: any, volume = 1.0) {
    if (!useGameStore.getState().settings.soundEnabled) return;
    if (!createAudioPlayerFn) return;

    try {
      const player = createAudioPlayerFn(source);
      player.volume = volume;
      player.play();

      if (player && typeof player.addListener === 'function') {
        const sub = player.addListener('playbackStatusUpdate', (status: any) => {
          if (status?.didJustFinish) {
            try {
              sub?.remove?.();
              player?.remove?.();
            } catch {
              // Ignored
            }
          }
        });
      }
    } catch {
      // Ignored
    }
  }

  public playPop() {
    this.playSFX(require('../../assets/sounds/pop.wav'), 0.75);
  }

  public playMerge() {
    this.playSFX(require('../../assets/sounds/merge.wav'), 1.0);
  }

  public playCoin() {
    this.playSFX(require('../../assets/sounds/coin.wav'), 0.85);
  }

  public playLevelUp() {
    this.playSFX(require('../../assets/sounds/levelup.wav'), 1.0);
  }

  public async startBGM() {
    if (!useGameStore.getState().settings.musicEnabled) return;
    if (!createAudioPlayerFn) return;

    if (this.audioModePromise) {
      try {
        await this.audioModePromise;
      } catch {
        // Ignore
      }
    }

    if (this.bgmPlayer) {
      this.resumeBGM();
      return;
    }

    try {
      this.bgmPlayer = createAudioPlayerFn(
        require('../../assets/sounds/bgm_lofi.wav')
      );
      this.bgmPlayer.loop = true;
      this.bgmPlayer.volume = 0.35;
      this.bgmPlayer.play();
      this.isBgmPlaying = true;
    } catch {
      // Ignore
    }
  }

  public pauseBGM() {
    if (this.bgmPlayer && this.isBgmPlaying) {
      try {
        this.bgmPlayer.pause();
        this.isBgmPlaying = false;
      } catch {
        // Ignore
      }
    }
  }

  public resumeBGM() {
    if (!useGameStore.getState().settings.musicEnabled) return;
    if (this.bgmPlayer && !this.isBgmPlaying) {
      try {
        this.bgmPlayer.play();
        this.isBgmPlaying = true;
      } catch {
        // Ignore
      }
    } else if (!this.bgmPlayer) {
      this.startBGM();
    }
  }

  public stopBGM() {
    if (this.bgmPlayer) {
      try {
        this.bgmPlayer.pause();
        this.bgmPlayer.remove();
      } catch {
        // Ignore
      }
      this.bgmPlayer = null;
      this.isBgmPlaying = false;
    }
  }
}

export const soundService = new SoundService();
