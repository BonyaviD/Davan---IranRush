import type { WorldConfig } from '../../core/types';

/** اصفهان: کاشی فیروزه‌ای و طلایی، پل */
export const isfahan: WorldConfig = {
  id: 'isfahan',
  name: 'اصفهان',
  palette: {
    background: 0x0f4c5c,
    track: 0xd9c49a,
    trackEdge: 0xc9a227,
    gatePositive: 0x1fb5a8,
    gateNegative: 0xd64545,
    crowd: 0xf5f5f5,
    enemy: 0x8e2c2c,
  },
  parallax: [
    { key: 'isfahan-domes', speed: 0.2, color: 0x1a7f8e },
    { key: 'isfahan-bridge', speed: 0.5, color: 0xc9a227 },
  ],
  obstacleKinds: ['static'],
};
