import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/** Short vibrations for gates, hits and wins. Native via Capacitor, navigator.vibrate on web. */
export function buzz(strength: 'light' | 'medium' | 'heavy' = 'light'): void {
  try {
    if (Capacitor.isNativePlatform()) {
      const style = strength === 'heavy' ? ImpactStyle.Heavy : strength === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
      void Haptics.impact({ style });
    } else {
      navigator.vibrate?.(strength === 'heavy' ? 40 : strength === 'medium' ? 20 : 10);
    }
  } catch {
    /* haptics are optional */
  }
}
