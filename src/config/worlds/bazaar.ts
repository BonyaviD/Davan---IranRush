import type { WorldConfig } from '../../core/types';

/** بازارچه‌ی سنتی: طاق آجری، چراغ آویز */
export const bazaar: WorldConfig = {
  id: 'bazaar',
  name: 'بازارچه',
  palette: {
    background: 0x3b2418,
    track: 0xb07a4f,
    trackEdge: 0x7a4a2c,
    gatePositive: 0x2fbf71,
    gateNegative: 0xd64545,
    crowd: 0x3a8dde,
    enemy: 0xc0392b,
  },
  parallax: [
    { key: 'bazaar-arches', speed: 0.3, color: 0x5a3422 },
    { key: 'bazaar-lamps', speed: 0.6, color: 0xf2b84b },
  ],
  obstacleKinds: ['static'],
};
