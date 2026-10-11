import type { LevelData } from '../../core/types';

/**
 * Balance (enforced by tests):
 *   best : 12 → ×2=24 → +15=39 → vs 20 divs=19 → ×3=57 → +25=82 → vs boss 60 = 22 left
 *   worst: 12 → −6=6 → ÷2=3 → vs 20 divs → lose
 */
export const isfahan01: LevelData = {
  id: 'isfahan-01',
  world: 'isfahan',
  startCount: 12,
  length: 3000,
  segments: [
    { z: 400, gates: [{ op: 'mul', value: 2 }, { op: 'sub', value: 6 }] },
    { z: 900, gates: [{ op: 'div', value: 2 }, { op: 'add', value: 15 }] },
    { z: 1700, gates: [{ op: 'sub', value: 10 }, { op: 'mul', value: 3 }] },
    { z: 2200, gates: [{ op: 'add', value: 25 }, { op: 'sub', value: 30 }] },
  ],
  enemies: [{ z: 1300, count: 20 }],
  boss: { z: 2750, hp: 60, kind: 'div-sepid' },
};
