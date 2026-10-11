import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/config/levels';
import { validateLevel } from '../src/core/LevelLoader';
import { allOutcomes, simulateRun } from '../src/core/RunLogic';
import { CrowdModel } from '../src/core/CrowdModel';
import { toFaDigits } from '../src/ui/digits';

describe.each(LEVELS.map((l) => [l.id, l] as const))('level %s', (_id, level) => {
  it('is valid', () => {
    expect(validateLevel(level)).toEqual([]);
  });

  it('good choices beat the boss, bad choices lose', () => {
    const outcomes = allOutcomes(level);
    expect(outcomes.some((o) => o.result === 'win')).toBe(true);
    expect(outcomes.some((o) => o.result === 'lose')).toBe(true);
  });
});

describe('simulateRun', () => {
  it('plays the tehran-06 best path through three div groups and Zahhak', () => {
    const tehran = LEVELS.find((l) => l.id === 'tehran-06')!;
    expect(simulateRun(tehran, [1, 0, 1, 1, 0])).toEqual({ count: 30, result: 'win' });
    expect(simulateRun(tehran, [1, 1, 1, 1, 0]).result).toBe('lose');
  });

  it('ships 12 levels with unique ids', () => {
    expect(LEVELS).toHaveLength(12);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(12);
  });
});

describe('CrowdModel', () => {
  it('dies at 0', () => {
    const m = new CrowdModel(10);
    m.passGate({ op: 'sub', value: 10 });
    expect(m.isDead).toBe(true);
  });
});

describe('toFaDigits', () => {
  it('converts ascii digits', () => {
    expect(toFaDigits(1204)).toBe('۱۲۰۴');
  });
});
