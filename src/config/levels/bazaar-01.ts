import type { LevelData } from '../../core/types';

/**
 * Balance (enforced by tests in M1):
 *   best : 10 → +10=20 → ×2=40 → +20=60 → ×2=120  vs 70 → win
 *   worst: 10 → −5=5   → +5=10 → −10=0             → instant lose
 */
export const bazaar01: LevelData = {
  id: 'bazaar-01',
  world: 'bazaar',
  startCount: 10,
  length: 3000,
  segments: [
    { z: 400, gates: [{ op: 'add', value: 10 }, { op: 'sub', value: 5 }] },
    { z: 900, gates: [{ op: 'mul', value: 2 }, { op: 'add', value: 5 }] },
    { z: 1500, gates: [{ op: 'sub', value: 10 }, { op: 'add', value: 20 }] },
    { z: 2100, gates: [{ op: 'div', value: 2 }, { op: 'mul', value: 2 }] },
  ],
  enemy: { z: 2800, count: 70 },
};
