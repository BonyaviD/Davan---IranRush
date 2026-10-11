import type { GateDef } from './types';

/**
 * apply(op, value, count) -> newCount.
 * Rules: results are rounded; div by 0 is ignored; result is clamped to >= 0.
 * (0 is allowed here so the caller can trigger an instant Lose.)
 */
export function applyGate(gate: GateDef, count: number): number {
  // TODO(M1): implement + unit tests
  void gate;
  return count;
}

/** True if the gate is "good" for the player (used only for coloring). */
export function isPositiveGate(gate: GateDef): boolean {
  return gate.op === 'add' || gate.op === 'mul';
}
