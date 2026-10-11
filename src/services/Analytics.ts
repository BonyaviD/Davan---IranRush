/**
 * Minimal analytics: events are kept in a small local ring buffer and logged in dev builds.
 * To use a real backend (Firebase, GameAnalytics...), forward events in `send()`.
 */
export type AnalyticsEvent =
  | 'level_start'
  | 'level_win'
  | 'level_lose'
  | 'gate'
  | 'buy_character'
  | 'ad_offer'
  | 'ad_reward';

const KEY = 'davan.analytics';
const MAX = 200;

export function track(event: AnalyticsEvent, props: Record<string, string | number | boolean> = {}): void {
  const entry = { event, props, t: Date.now() };
  if (import.meta.env.DEV) console.debug('[analytics]', event, props);
  send(entry);
}

function send(entry: { event: AnalyticsEvent; props: Record<string, unknown>; t: number }): void {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown[];
    list.push(entry);
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch {
    /* analytics must never break the game */
  }
}
