import { describe, expect, it } from 'vitest';
import { clamp, damp, laneIndex } from '../src/core/Steering';

describe('steering', () => {
  it('damp is frame-rate independent', () => {
    let a = 0;
    for (let i = 0; i < 60; i++) a = damp(a, 1, 10, 1 / 60);
    let b = 0;
    for (let i = 0; i < 30; i++) b = damp(b, 1, 10, 1 / 30);
    expect(a).toBeCloseTo(b, 6);
  });

  it('clamps and picks lanes', () => {
    expect(clamp(2, -1, 1)).toBe(1);
    expect(laneIndex(-0.2)).toBe(0);
    expect(laneIndex(0.3)).toBe(1);
  });
});
