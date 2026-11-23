import { soundService } from './soundService';

let mobileAdsInstance: any = null;
let RewardedAdClass: any = null;
let RewardedAdEventTypeRef: any = null;
let TestIdsRef: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gma = require('react-native-google-mobile-ads');
  mobileAdsInstance = gma.default;
  RewardedAdClass = gma.RewardedAd;
  RewardedAdEventTypeRef = gma.RewardedAdEventType;
  TestIdsRef = gma.TestIds;
} catch {
  // Native module not linked (e.g. Expo Go / web / mock)
}

class AdService {
  private rewardedAd: any = null;
  private isLoaded = false;
  private isAdShowing = false;
  private isInitializing = false;

  constructor() {
    this.init();
  }

  public async init() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    if (mobileAdsInstance) {
      try {
        await mobileAdsInstance().initialize();
        this.loadRewardedAd();
      } catch (err) {
        console.warn('Google Mobile Ads initialization warning:', err);
      }
    }
  }

  public loadRewardedAd() {
    if (!RewardedAdClass || !TestIdsRef) {
      // In dev environment or mock, simulate ad readiness
      this.isLoaded = true;
      return;
    }

    try {
      const adUnitId = TestIdsRef.REWARDED;
      this.rewardedAd = RewardedAdClass.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.rewardedAd.addAdEventListener(RewardedAdEventTypeRef.LOADED, () => {
        this.isLoaded = true;
      });

      this.rewardedAd.addAdEventListener(RewardedAdEventTypeRef.EARNED_REWARD, () => {
        // Will be handled during show
      });

      this.rewardedAd.load();
    } catch (e) {
      console.warn('Failed to load Rewarded Ad:', e);
      this.isLoaded = false;
    }
  }

  public isRewardedReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Shows rewarded ad with sound pause/resume and reward callback
   */
  public async showRewardedAd(
    onRewardEarned: () => void,
    onDismissed?: () => void
  ): Promise<boolean> {
    if (this.isAdShowing) return false;

    // Pause game music while ad runs
    soundService.pauseBGM();

    // Fallback if Google Mobile Ads native module is not linked (web / dev client fallback)
    if (!RewardedAdClass || !this.rewardedAd || !this.isLoaded) {
      this.isAdShowing = true;
      try {
        // Give immediate reward in test/fallback mode
        onRewardEarned();
        if (onDismissed) onDismissed();
      } finally {
        this.isAdShowing = false;
        soundService.resumeBGM();
      }
      return true;
    }

    return new Promise<boolean>((resolve) => {
      let earned = false;
      this.isAdShowing = true;

      const unsubscribeLoaded = this.rewardedAd.addAdEventListener(
        RewardedAdEventTypeRef.EARNED_REWARD,
        () => {
          earned = true;
          onRewardEarned();
        }
      );

      // On dismiss or closed
      const unsubscribeClosed = this.rewardedAd.addAdEventListener(
        'closed',
        () => {
          unsubscribeLoaded();
          unsubscribeClosed();
          this.isLoaded = false;
          this.isAdShowing = false;
          soundService.resumeBGM();
          if (onDismissed) onDismissed();
          this.loadRewardedAd(); // Preload next ad
          resolve(earned);
        }
      );

      try {
        this.rewardedAd.show();
      } catch {
        unsubscribeLoaded();
        unsubscribeClosed();
        this.isLoaded = false;
        this.isAdShowing = false;
        soundService.resumeBGM();
        // Fallback grant reward if show failed
        onRewardEarned();
        if (onDismissed) onDismissed();
        resolve(true);
      }
    });
  }
}

export const adService = new AdService();
