import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/config/levels';
import { validateLevel } from '../src/core/LevelLoader';
import { toFaDigits } from '../src/ui/digits';

describe('level data', () => {
  it.each(LEVELS.map((l) => [l.id, l] as const))('%s is valid', (_id, level) => {
    expect(validateLevel(level)).toEqual([]);
  });
});

describe('toFaDigits', () => {
  it('converts ascii digits', () => {
    expect(toFaDigits(1204)).toBe('۱۲۰۴');
  });
});
