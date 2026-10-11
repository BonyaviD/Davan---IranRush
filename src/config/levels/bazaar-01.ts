import type { LevelData } from '../../core/types';

/**
 * Balance (enforced by tests):
 *   best : 10 → +10=20 → ×2=40 → vs 15 divs=25 → +20=45 → ×2=90 → vs boss 60 = 30 left
 *   worst: 10 → −5=5 → +5=10 → vs 15 divs → lose
 */
export const bazaar01: LevelData = {
  id: 'bazaar-01',
  world: 'bazaar',
  startCount: 10,
  length: 3000,
  segments: [
    { z: 400, gates: [{ op: 'add', value: 10 }, { op: 'sub', value: 5 }] },
    { z: 900, gates: [{ op: 'mul', value: 2 }, { op: 'add', value: 5 }] },
    { z: 1700, gates: [{ op: 'sub', value: 10 }, { op: 'add', value: 20 }] },
    { z: 2200, gates: [{ op: 'div', value: 2 }, { op: 'mul', value: 2 }] },
  ],
  enemies: [{ z: 1300, count: 15 }],
  boss: { z: 2750, hp: 60, kind: 'div-sepid' },
};
