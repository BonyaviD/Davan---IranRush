import type { WorldConfig } from '../../core/types';

/** تهران: خیابان چناری با سرو و شکوفه، برج میلاد، رشته‌کوه البرز */
export const tehran: WorldConfig = {
  id: 'tehran',
  name: 'تهران',
  palette: {
    skyTop: 0x23408e,
    skyHorizon: 0xf7dfa0,
    ground: 0xd9c99a,
    road: 0x9b8fa6,
    roadLine: 0xe2b04a,
    gatePositive: 0x23966e,
    gateNegative: 0xbe3732,
    walls: [0xf3e3c3, 0xeed2b0, 0xf6e8d2, 0xe8c9a4],
    ridges: [0xb99ac7, 0xe7a39a, 0xefc193],
    trees: [0x2e6a45, 0xf3a9bd],
  },
  landmark: 'milad',
  fog: [90, 900],
  obstacleKinds: ['static', 'crossing'],
};
