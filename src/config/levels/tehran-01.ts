import type { LevelData } from '../../core/types';

/**
 * Balance (enforced by tests):
 *   best : 15 → 30 → ×3=90 → vs 30 divs=60 → +40=100 → ×2=200 → vs 60 divs=140
 *          → +30=170 → vs Zahhak 120 = 50 left
 *   worst: 15 → 30 → −10=20 → vs 30 divs → lose
 */
export const tehran01: LevelData = {
  id: 'tehran-01',
  world: 'tehran',
  startCount: 15,
  length: 3800,
  segments: [
    { z: 400, gates: [{ op: 'add', value: 15 }, { op: 'mul', value: 2 }] },
    { z: 900, gates: [{ op: 'mul', value: 3 }, { op: 'sub', value: 10 }] },
    { z: 1700, gates: [{ op: 'div', value: 2 }, { op: 'add', value: 40 }] },
    { z: 2200, gates: [{ op: 'sub', value: 25 }, { op: 'mul', value: 2 }] },
    { z: 3000, gates: [{ op: 'add', value: 30 }, { op: 'sub', value: 40 }] },
  ],
  enemies: [
    { z: 1300, count: 30 },
    { z: 2600, count: 60 },
  ],
  boss: { z: 3500, hp: 120, kind: 'zahhak' },
};
