/**
 * Deterministic battle simulation, independent of rendering.
 * Both sides lose the same number of people each tick until one hits 0.
 * The per-tick loss is sized so the smaller side is wiped out in ~targetDurationSec.
 * Player wins only if strictly larger; a tie ends with both at 0 = Lose.
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

/** People removed from each side per tick, fixed for the whole battle. */
export function lossPerTick(state: BattleState, cfg: BattleConfig = DEFAULT_BATTLE): number {
  const ticks = Math.max(1, Math.round(cfg.targetDurationSec / cfg.tickSec));
  const smaller = Math.min(state.player, state.enemy);
  return Math.max(1, Math.ceil(smaller / ticks));
}

/** Advance one tick. Both sides always lose the same amount, so the outcome is exact. */
export function battleTick(state: BattleState, perTick: number): BattleState {
  const loss = Math.max(0, Math.min(perTick, state.player, state.enemy));
  return { player: state.player - loss, enemy: state.enemy - loss };
}

export function battleOver(s: BattleState): boolean {
  return s.player <= 0 || s.enemy <= 0;
}

/** Closed-form outcome, used by tests and level balancing. */
export function battleWinner(player: number, enemy: number): 'player' | 'enemy' {
  return player > enemy ? 'player' : 'enemy';
}
