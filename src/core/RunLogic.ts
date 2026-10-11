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

/** Every possible lane combination's outcome (levels have few segments). */
export function allOutcomes(level: LevelData): RunOutcome[] {
  const n = level.segments.length;
  const out: RunOutcome[] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    const choices = Array.from({ length: n }, (_, i) => ((mask >> i) & 1) as 0 | 1);
    out.push(simulateRun(level, choices));
  }
  return out;
}
