/**
 * Deterministic battle simulation, independent of rendering.
 * Both sides lose people every tick until one hits 0. The tick size is chosen so the
 * battle finishes in roughly `targetDurationSec` regardless of the numbers involved.
 */
export interface BattleState {
  player: number;
  enemy: number;
}

export interface BattleConfig {
  targetDurationSec: number;
  tickSec: number;
}

export const DEFAULT_BATTLE: BattleConfig = { targetDurationSec: 2.5, tickSec: 0.05 };

/** Advance one tick. TODO(M1): implement + unit tests. */
export function battleTick(state: BattleState, perTick: number): BattleState {
  void perTick;
  return state;
}

/** People removed from each side per tick. TODO(M1). */
export function lossPerTick(state: BattleState, cfg: BattleConfig = DEFAULT_BATTLE): number {
  void state;
  void cfg;
  return 1;
}

export function battleOver(s: BattleState): boolean {
  return s.player <= 0 || s.enemy <= 0;
}
