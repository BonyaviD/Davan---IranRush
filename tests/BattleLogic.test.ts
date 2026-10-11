import { describe, expect, it } from 'vitest';
import { battleOver, battleTick, lossPerTick, type BattleState } from '../src/core/BattleLogic';

function run(player: number, enemy: number) {
  let s: BattleState = { player, enemy };
  const per = lossPerTick(s);
  let ticks = 0;
  while (!battleOver(s)) {
    s = battleTick(s, per);
    ticks++;
  }
  return { s, ticks };
}

describe('battle', () => {
  it('larger side wins with the difference left over', () => {
    expect(run(120, 70).s).toEqual({ player: 50, enemy: 0 });
    expect(run(30, 70).s).toEqual({ player: 0, enemy: 40 });
  });

  it('tie means both reach 0 (player loses)', () => {
    expect(run(40, 40).s).toEqual({ player: 0, enemy: 0 });
  });

  it('is exact even when the loss does not divide evenly', () => {
    expect(run(6, 5).s).toEqual({ player: 1, enemy: 0 });
  });

  it('finishes in bounded time for any size', () => {
    for (const [p, e] of [[1, 1], [5, 3], [999, 5000], [100000, 99999]] as const) {
      expect(run(p, e).ticks).toBeLessThanOrEqual(50);
    }
  });
});
