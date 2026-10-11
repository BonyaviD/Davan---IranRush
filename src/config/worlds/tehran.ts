import type { WorldConfig } from '../../core/types';

/** تهران: خیابان درختی، میدان با دروازه، برج دوردست، ترافیک عرضی، نسخه‌ی شبانه */
export const tehran: WorldConfig = {
  id: 'tehran',
  name: 'تهران',
  palette: {
    background: 0x141a2e,
    track: 0x3c3f46,
    trackEdge: 0xe6e6e6,
    gatePositive: 0x2ecc71,
    gateNegative: 0xe74c3c,
    crowd: 0xf1c40f,
    enemy: 0x9b59b6,
  },
  parallax: [
    { key: 'tehran-tower', speed: 0.05, color: 0x2b3555 },
    { key: 'tehran-trees', speed: 0.7, color: 0x2e6b3a },
  ],
  obstacleKinds: ['static', 'crossing'],
  night: true,
};
