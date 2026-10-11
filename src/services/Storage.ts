import { Preferences } from '@capacitor/preferences';
import { normalizeProgress, type Progress } from '../core/Economy';

/**
 * Progress persistence. Capacitor Preferences stores natively on Android/iOS and falls back
 * to localStorage in the browser, so one code path covers both.
 */
const KEY = 'davan.progress.v1';

export async function loadProgress(levelCount: number): Promise<Progress> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return normalizeProgress(value ? (JSON.parse(value) as Partial<Progress>) : null, levelCount);
  } catch {
    return normalizeProgress(null, levelCount);
  }
}

export async function saveProgress(p: Progress): Promise<void> {
  try {
    await Preferences.set({ key: KEY, value: JSON.stringify(p) });
  } catch {
    /* storage unavailable (private mode); progress is non-critical */
  }
}
