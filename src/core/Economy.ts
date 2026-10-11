/**
 * Player progress and the coin economy. Pure functions over plain data so they are easy to
 * test and to persist; the Storage service only loads and saves this object.
 */
export interface Progress {
  /** Highest level index the player may play (0-based). */
  unlocked: number;
  /** Level index the "play" button continues from. */
  current: number;
  coins: number;
  /** Character ids the player owns. */
  owned: string[];
  /** Character ids mixed into the player's crowd (subset of owned, never empty). */
  equipped: string[];
  sound: boolean;
}

export const STARTER_CHARACTERS = ['arian', 'tara'];

export function newProgress(): Progress {
  return {
    unlocked: 0,
    current: 0,
    coins: 0,
    owned: [...STARTER_CHARACTERS],
    equipped: [...STARTER_CHARACTERS],
    sound: true,
  };
}

/** Repairs anything missing or inconsistent in saved data (older versions, manual edits). */
export function normalizeProgress(p: Partial<Progress> | null | undefined, levelCount: number): Progress {
  const base = newProgress();
  const owned = Array.from(new Set([...(p?.owned ?? []), ...STARTER_CHARACTERS]));
  const equipped = (p?.equipped ?? []).filter((id) => owned.includes(id));
  const last = Math.max(0, levelCount - 1);
  const unlocked = clampInt(p?.unlocked ?? base.unlocked, 0, last);
  return {
    unlocked,
    current: clampInt(p?.current ?? unlocked, 0, unlocked),
    coins: Math.max(0, Math.floor(p?.coins ?? 0)),
    owned,
    equipped: equipped.length ? equipped : [...STARTER_CHARACTERS],
    sound: p?.sound ?? true,
  };
}

function clampInt(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(Number.isFinite(v) ? v : min)));
}

/** Coins for beating a level: a base amount plus one per survivor. */
export function winReward(survivors: number, levelIndex: number): number {
  return 20 + levelIndex * 5 + Math.max(0, Math.floor(survivors));
}

/** Records a win: pays coins and unlocks/advances to the next level. */
export function completeLevel(p: Progress, levelIndex: number, coins: number, levelCount: number): Progress {
  const next = Math.min(levelIndex + 1, levelCount - 1);
  return {
    ...p,
    coins: p.coins + coins,
    unlocked: Math.max(p.unlocked, next),
    current: next,
  };
}

export type BuyResult = { ok: true; progress: Progress } | { ok: false; reason: 'owned' | 'coins' };

export function buyCharacter(p: Progress, id: string, price: number): BuyResult {
  if (p.owned.includes(id)) return { ok: false, reason: 'owned' };
  if (p.coins < price) return { ok: false, reason: 'coins' };
  return { ok: true, progress: { ...p, coins: p.coins - price, owned: [...p.owned, id], equipped: [...p.equipped, id] } };
}

/** Adds or removes an owned character from the crowd; the last one can't be removed. */
export function toggleEquipped(p: Progress, id: string): Progress {
  if (!p.owned.includes(id)) return p;
  if (p.equipped.includes(id)) {
    return p.equipped.length > 1 ? { ...p, equipped: p.equipped.filter((e) => e !== id) } : p;
  }
  return { ...p, equipped: [...p.equipped, id] };
}
