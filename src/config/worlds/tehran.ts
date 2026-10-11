import type { WorldConfig } from '../../core/types';

/** تهران: خیابان چناری، برج میلاد، البرز، ترافیک عرضی */
export const tehran: WorldConfig = {
  id: 'tehran',
  name: 'تهران',
  palette: {
    sky: 0xf3c58f,
    ground: 0xcfb08a,
    road: 0x45464c,
    roadLine: 0xf2f2f2,
    sidewalk: 0xb9a58c,
    gatePositive: 0x2ecc71,
    gateNegative: 0xe74c3c,
    crowd: 0x2f7de1,
    enemy: 0xc8372d,
    facades: [0xd8c3a0, 0xc7a27c, 0xe2d6c2, 0xb88a64, 0xcdb9a0],
    foliage: [0x4f8a3c, 0x5c9945, 0x46803a],
  },
  landmark: 'milad',
  fog: [90, 650],
  obstacleKinds: ['static', 'crossing'],
};
