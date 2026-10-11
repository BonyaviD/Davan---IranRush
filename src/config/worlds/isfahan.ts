import type { WorldConfig } from '../../core/types';

/** اصفهان: کاشی فیروزه‌ای و طلایی، سی‌وسه‌پل */
export const isfahan: WorldConfig = {
  id: 'isfahan',
  name: 'اصفهان',
  palette: {
    sky: 0xbfe0e8,
    ground: 0xd9c49a,
    road: 0xcbb489,
    roadLine: 0x1a8f9e,
    sidewalk: 0xb89c6a,
    gatePositive: 0x1fb5a8,
    gateNegative: 0xd64545,
    crowd: 0x2f7de1,
    enemy: 0x8e2c2c,
    facades: [0xd8c39b, 0xcdb184, 0xe0cfa8],
    foliage: [0x5c9945, 0x4f8a3c],
  },
  landmark: 'siosepol',
  fog: [80, 520],
  obstacleKinds: ['static'],
};
