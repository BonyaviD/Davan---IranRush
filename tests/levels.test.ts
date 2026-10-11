import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/config/levels';
import { validateLevel } from '../src/core/LevelLoader';
import { countRange } from '../src/core/RunLogic';
import { CrowdModel } from '../src/core/CrowdModel';
import { toFaDigits } from '../src/ui/digits';

describe.each(LEVELS.map((l) => [l.id, l] as const))('level %s', (_id, level) => {
  it('is valid', () => {
    expect(validateLevel(level)).toEqual([]);
  });

  it('best choices win, worst choices lose', () => {
    const { best, worst } = countRange(level);
    expect(best).toBeGreaterThan(level.enemy.count);
    expect(worst).toBeLessThanOrEqual(level.enemy.count);
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
