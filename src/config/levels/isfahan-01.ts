import type { LevelData } from '../../core/types';

/**
 * Balance (enforced by tests):
 *   best : 12 → ×2=24 → +15=39 → ×3=117 → +10=127  vs 100 → win
 *   worst: 12 → −6=6  → ÷2=3   → −20=0              → instant lose
 */
export const isfahan01: LevelData = {
  id: 'isfahan-01',
  world: 'isfahan',
  startCount: 12,
  length: 3000,
  segments: [
    { z: 400, gates: [{ op: 'mul', value: 2 }, { op: 'sub', value: 6 }] },
    { z: 1000, gates: [{ op: 'div', value: 2 }, { op: 'add', value: 15 }] },
    { z: 1600, gates: [{ op: 'sub', value: 20 }, { op: 'mul', value: 3 }] },
    { z: 2200, gates: [{ op: 'add', value: 10 }, { op: 'sub', value: 30 }] },
  ],
  enemy: { z: 2800, count: 100 },
};
