import { describe, expect, it } from 'vitest';
import { GAME } from '../src/config/game.config';
import { LEVELS } from '../src/config/levels';
import { CrowdModel } from '../src/core/CrowdModel';
import { difficulty, generateCampaign } from '../src/core/LevelGen';
import { validateLevel } from '../src/core/LevelLoader';
import { greedyChoices, pathEvents, randomWinRate, simulateRun } from '../src/core/RunLogic';
import { battleDuration } from '../src/core/BattleLogic';
import { applyGate } from '../src/core/GateLogic';
import type { LevelData } from '../src/core/types';
import { toFaDigits } from '../src/ui/digits';

/** Play time in seconds on the best path: running + each fight's length + intro. */
function playSeconds(l: LevelData): number {
  const choices = greedyChoices(l, 'best');
  let count = l.startCount;
  let fights = 0;
  for (const ev of pathEvents(l)) {
    if (ev.kind === 'gate') count = applyGate(l.segments[ev.index]!.gates[choices[ev.index]!], count);
    else {
      const foe = ev.kind === 'enemy' ? l.enemies[ev.index]!.count : l.boss.hp;
      fights += battleDuration({ player: count, enemy: foe }) + GAME.afterFightPause;
      count -= foe;
    }
  }
  return l.length / GAME.runSpeed + fights + GAME.introSec;
}

describe.each(LEVELS.map((l) => [l.id, l] as const))('level %s', (_id, level) => {
  it('is valid', () => {
    expect(validateLevel(level)).toEqual([]);
  });

  it('the best path wins and the worst path loses', () => {
    expect(simulateRun(level, greedyChoices(level, 'best')).result).toBe('win');
    expect(simulateRun(level, greedyChoices(level, 'worst')).result).toBe('lose');
  });

  it('lasts a standard run (about 25 to 75 seconds)', () => {
    const t = playSeconds(level);
    expect(t).toBeGreaterThan(25);
    expect(t).toBeLessThan(75);
  });
});

describe('campaign', () => {
  it('is deterministic', () => {
    expect(generateCampaign(6)).toEqual(LEVELS.slice(0, 6));
  });

  it('ids are unique and cities rotate', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    expect(LEVELS.slice(0, 15).map((l) => l.world)).toEqual([
      ...Array(5).fill('tehran'),
      ...Array(5).fill('isfahan'),
      ...Array(5).fill('bazaar'),
    ]);
  });

  it('difficulty rises overall, with spikes at block ends', () => {
    expect(difficulty(0)).toBe(0);
    expect(difficulty(40)).toBeGreaterThan(difficulty(10));
    expect(difficulty(4)).toBeGreaterThan(difficulty(5));
  });

  it('later levels are longer and less forgiving to random play', () => {
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const early = LEVELS.slice(0, 5);
    const late = LEVELS.slice(35, 45);
    expect(avg(late.map(playSeconds))).toBeGreaterThan(avg(early.map(playSeconds)));
    expect(avg(late.map((l) => randomWinRate(l)))).toBeLessThan(avg(early.map((l) => randomWinRate(l))));
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
