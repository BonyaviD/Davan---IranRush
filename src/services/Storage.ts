/**
 * Progress persistence. M3 swaps the backend to @capacitor/preferences on native,
 * keeping localStorage as the browser fallback. Callers only see this async API.
 */
export interface Progress {
  unlockedLevel: number;
}

const KEY = 'davan.progress';
const DEFAULT: Progress = { unlockedLevel: 0 };

export async function loadProgress(): Promise<Progress> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<Progress>) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export async function saveProgress(p: Progress): Promise<void> {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable (private mode); progress is non-critical */
  }
}
