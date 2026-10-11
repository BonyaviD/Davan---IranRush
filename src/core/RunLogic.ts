import { applyGate } from './GateLogic';
import { battleWinner } from './BattleLogic';
import type { LevelData, RunResult } from './types';

export interface RunOutcome {
  /** Count left at the end (0 on a loss). */
  count: number;
  result: RunResult;
}

/** One thing that happens along the path, in z order. */
export type PathEvent =
  | { kind: 'gate'; z: number; index: number }
  | { kind: 'enemy'; z: number; index: number }
  | { kind: 'boss'; z: number };

/** Gates, enemy groups and the boss merged into one ascending timeline. */
export function pathEvents(level: LevelData): PathEvent[] {
  const events: PathEvent[] = [
    ...level.segments.map((s, index) => ({ kind: 'gate' as const, z: s.z, index })),
    ...level.enemies.map((e, index) => ({ kind: 'enemy' as const, z: e.z, index })),
    { kind: 'boss' as const, z: level.boss.z },
  ];
  return events.sort((a, b) => a.z - b.z);
}

/**
 * Simulates a full run given one lane choice (0/1) per gate segment. Each fight removes
 * the opponent's count from the crowd; a tie or a smaller crowd loses. Ignores obstacles.
 */
export function simulateRun(level: LevelData, choices: readonly (0 | 1)[]): RunOutcome {
  let count = level.startCount;
  for (const ev of pathEvents(level)) {
    if (ev.kind === 'gate') {
      count = applyGate(level.segments[ev.index]!.gates[choices[ev.index] ?? 0], count);
      if (count <= 0) return { count: 0, result: 'lose' };
      continue;
    }
    const foe = ev.kind === 'enemy' ? level.enemies[ev.index]!.count : level.boss.hp;
    if (battleWinner(count, foe) !== 'player') return { count: 0, result: 'lose' };
    count -= foe;
  }
  return { count, result: 'win' };
}

/**
 * Lane choices that maximize (best) or minimize (worst) the crowd at every gate. Gates and
 * fights are monotonic in the crowd size, so greedy-best is the optimal strategy and
 * greedy-worst the worst one: together they bound every possible run.
 */
export function greedyChoices(level: LevelData, mode: 'best' | 'worst'): (0 | 1)[] {
  const choices: (0 | 1)[] = [];
  let count = level.startCount;
  for (const ev of pathEvents(level)) {
    if (ev.kind === 'gate') {
      const [a, b] = level.segments[ev.index]!.gates;
      const ca = applyGate(a, count);
      const cb = applyGate(b, count);
      const pickA = mode === 'best' ? ca >= cb : ca <= cb;
      choices[ev.index] = pickA ? 0 : 1;
      count = pickA ? ca : cb;
    } else {
      const foe = ev.kind === 'enemy' ? level.enemies[ev.index]!.count : level.boss.hp;
      count = Math.max(0, count - foe);
    }
  }
  return choices;
}

/** Outcome of n random lane choices (seeded), for measuring how forgiving a level is. */
export function randomWinRate(level: LevelData, n = 400, seed = 1): number {
  let s = seed;
  const rand = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  let wins = 0;
  for (let k = 0; k < n; k++) {
    const choices = level.segments.map(() => (rand() < 0.5 ? 0 : 1) as 0 | 1);
    if (simulateRun(level, choices).result === 'win') wins++;
  }
  return wins / n;
}

