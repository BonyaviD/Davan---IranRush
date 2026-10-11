import type { WorldConfig } from '../../core/types';

/** بازارچه‌ی سنتی: طاق آجری، چراغ آویز، گنبد */
export const bazaar: WorldConfig = {
  id: 'bazaar',
  name: 'بازارچه',
  palette: {
    skyTop: 0x3a2f78,
    skyHorizon: 0xf2c27a,
    ground: 0xc9a173,
    road: 0xb08a6a,
    roadLine: 0xf2c865,
    gatePositive: 0x23966e,
    gateNegative: 0xbe3732,
    walls: [0xc98f5e, 0xb87d4f, 0xd49c6a, 0xc08452],
    ridges: [0x9a7fb3, 0xd38f7c, 0xe2ad7e],
    trees: [0x2e6a45, 0xf3a9bd],
  },
  landmark: 'bazaar-dome',
  fog: [40, 600],
  obstacleKinds: ['static'],
};
