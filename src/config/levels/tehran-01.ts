import type { LevelData } from '../../core/types';

/**
 * Balance (enforced by tests):
 *   best : 15 → 30 → ×3=90 → +40=130 → ×2=260 → +30=290  vs 180 → win
 *   worst: 15 → 30 → −10=20 → ÷3=7 → −25=0                → instant lose
 */
export const tehran01: LevelData = {
  id: 'tehran-01',
  world: 'tehran',
  startCount: 15,
  length: 3400,
  segments: [
    { z: 400, gates: [{ op: 'add', value: 15 }, { op: 'mul', value: 2 }] },
    { z: 1000, gates: [{ op: 'mul', value: 3 }, { op: 'sub', value: 10 }] },
    { z: 1600, gates: [{ op: 'div', value: 3 }, { op: 'add', value: 40 }] },
    { z: 2200, gates: [{ op: 'sub', value: 25 }, { op: 'mul', value: 2 }] },
    { z: 2800, gates: [{ op: 'add', value: 30 }, { op: 'sub', value: 40 }] },
  ],
  enemy: { z: 3200, count: 180 },
};
