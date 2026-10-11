import { applyGate } from './GateLogic';
import type { BossKind, EnemyDef, GateDef, GateSegment, LevelData, WorldId } from './types';

/**
 * Procedural level generator with a difficulty curve.
 *
 * Every level is built by "playing" it while it is generated: the generator tracks the crowd
 * size on the best path (always picking the better gate) and on the worst path. Because every
 * gate and fight is monotonic in the crowd size, picking the better gate each time is the
 * optimal strategy, so these two numbers bound every possible run. Enemy groups and the boss
 * are sized from the best-path count, which guarantees each level is winnable, and the
 * generator retries until the worst path loses.
 *
 * Difficulty d in [0, 1] controls: level length, how big enemies are relative to the crowd,
 * how thin the final margin is, how subtle the gate choices are, and how many small div
 * patrols and mystery gates appear.
 *
 * Mystery gates stay hidden until the crowd has passed them, so the pick is blind. To keep
 * that fair, both sides of a mystery pair are positive, and the generator assumes the
 * unlucky (smaller) side when sizing what comes after.
 */

export const WORLD_ROTATION: WorldId[] = ['tehran', 'isfahan', 'bazaar'];
/** Levels per city block before moving to the next city. */
export const BLOCK = 5;

/** Small deterministic PRNG so every player gets the same levels. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Difficulty of level i (0-based): rises quickly at first, then flattens toward 1.
 * The last level of every block is a spike; the first level after it is a short breather.
 */
export function difficulty(i: number): number {
  const base = 1 - Math.exp(-i / 16);
  const pos = i % BLOCK;
  const wave = pos === BLOCK - 1 ? 0.12 : pos === 0 && i > 0 ? -0.06 : 0;
  return Math.min(1, Math.max(0, base + wave));
}

/** Round to numbers that read well on a gate. */
function nice(v: number): number {
  const n = Math.max(1, Math.round(v));
  if (n < 20) return n;
  if (n < 100) return Math.round(n / 5) * 5;
  return Math.round(n / 10) * 10;
}

const better = (a: GateDef, b: GateDef, count: number) => applyGate(a, count) >= applyGate(b, count);

/** One gate pair suited to the current best-path count and difficulty. */
function makeGates(rand: () => number, best: number, d: number): { gates: [GateDef, GateDef]; hidden: boolean } {
  const u = (a: number, b: number) => a + rand() * (b - a);
  // Soft cap on crowd size: past it the generator stops offering multiplies.
  const cap = 70 + 230 * d;
  const hidden = rand() < 0.06 + 0.2 * d;
  const H = (g: GateDef): GateDef => (hidden ? { ...g, hidden: true } : g);

  // Weighted template choice: easy pairs early, subtle and "lesser evil" pairs later.
  const growthOk = best < cap;
  // Additions scale with the crowd only up to the cap, so growth stays linear past it.
  const base = Math.min(best, cap);
  const w = {
    addSub: 1.2 - 0.6 * d,
    mulDiv: growthOk ? 1 - 0.5 * d : 0.03,
    mulAdd: growthOk ? 0.5 + 1.2 * d : 0.05,
    addAdd: 0.3 + 0.4 * d,
    bothBad: best >= 25 ? 0.05 + 0.9 * d : 0,
  };
  if (hidden) {
    // Blind picks only offer good-vs-better choices.
    w.addSub = w.mulDiv = w.bothBad = 0;
    if (!growthOk) w.mulAdd = 0;
  }
  const total = Object.values(w).reduce((s, x) => s + x, 0);
  let r = rand() * total;
  let pick: keyof typeof w = 'addSub';
  for (const k of Object.keys(w) as (keyof typeof w)[]) {
    r -= w[k];
    if (r <= 0) {
      pick = k;
      break;
    }
  }

  let a: GateDef;
  let b: GateDef;
  switch (pick) {
    case 'addSub':
      a = { op: 'add', value: nice(base * u(0.25, 0.7) + 3) };
      b = { op: 'sub', value: nice(best * u(0.2, 0.5) + 2) };
      break;
    case 'mulDiv':
      a = { op: 'mul', value: rand() < 0.75 ? 2 : 3 };
      b = { op: 'div', value: rand() < 0.7 ? 2 : 3 };
      break;
    case 'mulAdd': {
      // Close call: the add is worth about as much as the multiply at the current count.
      const k = rand() < 0.7 ? 2 : 3;
      a = { op: 'mul', value: k };
      b = { op: 'add', value: nice(best * (k - 1) * u(0.7, 1.3)) };
      break;
    }
    case 'addAdd':
      a = { op: 'add', value: nice(base * u(0.15, 0.4) + 2) };
      b = { op: 'add', value: nice(base * u(0.45, 0.8) + 4) };
      break;
    case 'bothBad':
      // Pick the lesser evil.
      a = { op: 'sub', value: nice(best * u(0.15, 0.55) + 1) };
      b = { op: 'div', value: 2 };
      break;
  }
  if (better(b, a, best) && applyGate(a, best) === applyGate(b, best)) b = { ...b, value: b.value + 1 };
  const gates: [GateDef, GateDef] = rand() < 0.5 ? [H(a), H(b)] : [H(b), H(a)];
  return { gates, hidden };
}

interface Plan {
  world: WorldId;
  boss: BossKind;
  index: number;
  id: string;
}

/** Builds one level; returns null if this seed did not satisfy the constraints. */
function tryGenerate(plan: Plan, seed: number): LevelData | null {
  const rand = mulberry32(seed);
  const d = difficulty(plan.index);
  const startCount = 10 + Math.floor(rand() * 6);
  const sections = 9 + Math.round(9 * d) + Math.floor(rand() * 3);

  const segments: GateSegment[] = [];
  const enemies: EnemyDef[] = [];
  let best = startCount;
  let worst = startCount;
  let z = 500;
  let sinceFight = 0;

  for (let s = 0; s < sections; s++) {
    const gap = 620 + Math.floor(rand() * 220);
    const last = s === sections - 1;
    const wantFight = s >= 2 && !last && sinceFight >= 2 && best > 12 && rand() < 0.35 + 0.25 * d;
    if (wantFight) {
      const ratio = 0.3 + 0.42 * d + (rand() - 0.5) * 0.1;
      const count = Math.max(3, Math.min(best - 3, nice(best * ratio)));
      if (count >= best) return null;
      enemies.push({ z, count });
      best -= count;
      worst = worst > count ? worst - count : 0;
      sinceFight = 0;
    } else {
      const { gates, hidden } = makeGates(rand, best, d);
      segments.push({ z, gates });
      const ga = applyGate(gates[0], best);
      const gb = applyGate(gates[1], best);
      // Hidden pairs: plan for the unlucky side, since the player can't see the values.
      best = hidden ? Math.min(ga, gb) : Math.max(ga, gb);
      worst = worst > 0 ? Math.min(applyGate(gates[0], worst), applyGate(gates[1], worst)) : 0;
      sinceFight++;
    }
    // Small div patrols sit halfway to the next section.
    if (!last && s >= 1 && best > 12 && rand() < 0.1 + 0.15 * d) {
      const count = Math.max(2, Math.min(best - 3, nice(best * (0.08 + 0.12 * d))));
      if (count >= 2 && best - count > 5) {
        enemies.push({ z: z + Math.round(gap / 2), count });
        best -= count;
        worst = worst > count ? worst - count : 0;
      }
    }
    z += gap;
  }

  // Boss: a thinner margin as difficulty rises, but always beatable even after some hits.
  const bossZ = z + 150;
  const hp = nice(best * (0.5 + 0.43 * d));
  if (hp < 15 || best - hp < 3) return null;
  if (worst > hp) return null; // the worst path must lose

  return {
    id: plan.id,
    world: plan.world,
    startCount,
    length: bossZ + 400,
    segments,
    enemies,
    boss: { z: bossZ, hp, kind: plan.boss },
  };
}

const BOSS_ROTATION: BossKind[] = ['div-sepid', 'akvan', 'div-sepid', 'akvan', 'zahhak'];

/** The whole campaign: `count` levels, cities rotating in blocks, bosses escalating to Zahhak. */
export function generateCampaign(count: number): LevelData[] {
  const levels: LevelData[] = [];
  const perWorld: Record<string, number> = {};
  for (let i = 0; i < count; i++) {
    const world = WORLD_ROTATION[Math.floor(i / BLOCK) % WORLD_ROTATION.length]!;
    perWorld[world] = (perWorld[world] ?? 0) + 1;
    const plan: Plan = { world, boss: BOSS_ROTATION[i % BLOCK]!, index: i, id: `${world}-${String(perWorld[world]).padStart(2, '0')}` };
    let level: LevelData | null = null;
    for (let attempt = 0; attempt < 200 && !level; attempt++) level = tryGenerate(plan, 7919 * (i + 1) + attempt * 104729);
    if (!level) throw new Error(`could not generate level ${plan.id}`);
    levels.push(level);
  }
  return levels;
}
