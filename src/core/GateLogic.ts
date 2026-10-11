import type { GateDef } from './types';

/**
 * apply(op, value, count) -> newCount.
 * - Result is always rounded to an integer and never negative.
 * - mul/div never kill the crowd: if count > 0 the result stays >= 1.
 * - sub can reach 0, which the caller treats as an instant Lose.
 * - div by 0 (or a non-finite value) is a no-op.
 */
export function applyGate(gate: GateDef, count: number): number {
  const c = Math.max(0, Math.round(count));
  const v = gate.value;
  if (!Number.isFinite(v)) return c;

  let next: number;
  switch (gate.op) {
    case 'add':
      next = c + v;
      break;
    case 'sub':
      next = c - v;
      break;
    case 'mul':
      next = c * v;
      break;
    case 'div':
      next = v === 0 ? c : c / v;
      break;
  }

  next = Math.max(0, Math.round(next));
  if ((gate.op === 'mul' || gate.op === 'div') && c > 0) next = Math.max(1, next);
  return next;
}

/** True if the gate is "good" for the player (used only for coloring). */
export function isPositiveGate(gate: GateDef): boolean {
  if (gate.op === 'add') return gate.value >= 0;
  if (gate.op === 'mul') return gate.value >= 1;
  if (gate.op === 'sub') return gate.value <= 0;
  return gate.value > 0 && gate.value <= 1;
}
