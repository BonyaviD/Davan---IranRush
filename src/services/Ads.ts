import { el, uiRoot } from '../ui/dom';
import { toFaDigits } from '../ui/digits';
import { track } from './Analytics';

/**
 * Rewarded ads behind one small interface. The game only calls `showRewarded()` and gets
 * true when the player earned the reward.
 *
 * Shipping real ads: install an AdMob plugin (e.g. @capacitor-community/admob), create a
 * class implementing RewardedAds with your ad unit ids, and assign it to `ads` in main.ts.
 * Until then the simulated provider shows a short placeholder so the reward flow is testable.
 */
export interface RewardedAds {
  showRewarded(placement: string): Promise<boolean>;
}

class SimulatedAds implements RewardedAds {
  showRewarded(placement: string): Promise<boolean> {
    track('ad_offer', { placement });
    return new Promise((resolve) => {
      const root = el('div', 'ad-sim interactive');
      const label = el('p', 'ad-sim-text');
      const skip = el('button', 'btn btn-ghost', 'بستن');
      root.append(el('b', '', 'تبلیغ آزمایشی'), label, skip);
      uiRoot().append(root);
      let left = 3;
      const tick = () => (label.textContent = `جایزه تا ${toFaDigits(left)} ثانیه‌ی دیگه`);
      tick();
      const timer = window.setInterval(() => {
        left--;
        if (left > 0) return tick();
        window.clearInterval(timer);
        root.remove();
        track('ad_reward', { placement });
        resolve(true);
      }, 1000);
      skip.addEventListener('click', () => {
        window.clearInterval(timer);
        root.remove();
        resolve(false);
      });
    });
  }
}

export let ads: RewardedAds = new SimulatedAds();
export function setAdsProvider(provider: RewardedAds): void {
  ads = provider;
}
