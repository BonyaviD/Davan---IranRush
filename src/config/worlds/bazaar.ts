import type { WorldConfig } from '../../core/types';

/** بازارچه‌ی سنتی: طاق آجری، چراغ آویز */
export const bazaar: WorldConfig = {
  id: 'bazaar',
  name: 'بازارچه',
  palette: {
    sky: 0xe9b37a,
    ground: 0xb98d63,
    road: 0xa4744d,
    roadLine: 0xd9b48a,
    sidewalk: 0x8c5e3c,
    gatePositive: 0x2fbf71,
    gateNegative: 0xd64545,
    crowd: 0x2f7de1,
    enemy: 0xc8372d,
    facades: [0xb5774b, 0xa86a40, 0xc28a5c],
    foliage: [0xf2b84b, 0xe39b3a],
  },
  landmark: 'bazaar-dome',
  fog: [25, 120],
  obstacleKinds: ['static'],
};
