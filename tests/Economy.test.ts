import { describe, expect, it } from 'vitest';
import {
  buyCharacter,
  completeLevel,
  newProgress,
  normalizeProgress,
  toggleEquipped,
  winReward,
} from '../src/core/Economy';
import { obstacleHits, obstacleX } from '../src/core/ObstacleLogic';
import type { ObstacleDef } from '../src/core/types';

describe('economy', () => {
  it('pays more for more survivors and later levels', () => {
    expect(winReward(50, 0)).toBe(70);
    expect(winReward(50, 2)).toBeGreaterThan(winReward(50, 0));
  });

  it('unlocks the next level on a win and never past the last', () => {
    const p = completeLevel(newProgress(), 0, 30, 3);
    expect(p).toMatchObject({ unlocked: 1, current: 1, coins: 30 });
    expect(completeLevel({ ...p, unlocked: 2 }, 2, 0, 3).unlocked).toBe(2);
  });

  it('buys characters only with enough coins, once', () => {
    const rich = { ...newProgress(), coins: 500 };
    const r = buyCharacter(rich, 'rostam', 300);
    expect(r.ok && r.progress.coins).toBe(200);
    expect(r.ok && r.progress.equipped).toContain('rostam');
    expect(buyCharacter(newProgress(), 'rostam', 300)).toEqual({ ok: false, reason: 'coins' });
    if (r.ok) expect(buyCharacter(r.progress, 'rostam', 1)).toEqual({ ok: false, reason: 'owned' });
  });

  it('never leaves the crowd empty', () => {
    const one = toggleEquipped(newProgress(), 'arian');
    expect(one.equipped).toEqual(['tara']);
    expect(toggleEquipped(one, 'tara').equipped).toEqual(['tara']);
  });

  it('repairs broken saves', () => {
    const p = normalizeProgress({ unlocked: 99, coins: -5, equipped: ['ghost'] }, 4);
    expect(p).toMatchObject({ unlocked: 3, current: 3, coins: 0 });
    expect(p.equipped).toEqual(['arian', 'tara']);
  });
});

describe('obstacles', () => {
  const taxi: ObstacleDef = { z: 0, kind: 'crossing', x: -1, halfWidth: 0.3, damage: 5, speed: 0.5, look: 'taxi' };

  it('crossing traffic sweeps the whole road and back', () => {
    expect(obstacleX(taxi, 0)).toBeCloseTo(-1);
    expect(obstacleX(taxi, 2)).toBeCloseTo(0);
    expect(obstacleX(taxi, 4)).toBeCloseTo(1);
    expect(obstacleX(taxi, 6)).toBeCloseTo(0);
    expect(obstacleX({ ...taxi, kind: 'static', x: 0.4 }, 9)).toBe(0.4);
  });

  it('hits only when the crowd core overlaps', () => {
    expect(obstacleHits(0, 0.3, 0.2, 0.2)).toBe(true);
    expect(obstacleHits(0, 0.3, 0.8, 0.2)).toBe(false);
  });
});
