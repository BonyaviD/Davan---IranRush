import type { WorldConfig } from '../../core/types';

/** اصفهان: کاشی فیروزه‌ای و طلایی، سی‌وسه‌پل، گنبد */
export const isfahan: WorldConfig = {
  id: 'isfahan',
  name: 'اصفهان',
  palette: {
    skyTop: 0x1f5e8e,
    skyHorizon: 0xf3e2b0,
    ground: 0xdcc79a,
    road: 0xcdb48c,
    roadLine: 0x1fa3a8,
    gatePositive: 0x1f9a8e,
    gateNegative: 0xbe3732,
    walls: [0xe6d2a6, 0xdcc394, 0xeedcb4, 0xd8bd8a],
    ridges: [0xa9b6d6, 0xd9b48f, 0xe9cf9f],
    trees: [0x2e6a45, 0xf6d36b],
  },
  landmark: 'siosepol',
  fog: [80, 850],
  obstacleKinds: ['static'],
};
