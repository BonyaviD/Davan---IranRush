import { applyGate } from './GateLogic';
import { battleWinner } from './BattleLogic';
import type { LevelData, RunResult } from './types';

export interface RunOutcome {
  /** Count when reaching the enemy (0 if killed by a gate). */
  count: number;
  result: RunResult;
}

/** Simulates a full run given one lane choice (0/1) per segment. Ignores obstacles. */
export function simulateRun(level: LevelData, choices: readonly (0 | 1)[]): RunOutcome {
  let count = level.startCount;
  for (let i = 0; i < level.segments.length; i++) {
    const seg = level.segments[i]!;
    count = applyGate(seg.gates[choices[i] ?? 0], count);
    if (count <= 0) return { count: 0, result: 'lose' };
  }
  const result = battleWinner(count, level.enemy.count) === 'player' ? 'win' : 'lose';
  return { count, result };
}

/** Best and worst achievable counts at the enemy (exhaustive; levels have few segments). */
export function countRange(level: LevelData): { best: number; worst: number } {
  const n = level.segments.length;
  let best = -Infinity;
  let worst = Infinity;
  for (let mask = 0; mask < 1 << n; mask++) {
    const choices = Array.from({ length: n }, (_, i) => ((mask >> i) & 1) as 0 | 1);
    const { count } = simulateRun(level, choices);
    best = Math.max(best, count);
    worst = Math.min(worst, count);
  }
  return { best, worst };
}
