import type { GateDef, GateOp } from '../core/types';

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** Converts ASCII digits in a number/string to Persian digits. */
export function toFaDigits(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)] ?? d);
}

const OP_SYMBOL: Record<GateOp, string> = { add: '+', sub: '−', mul: '×', div: '÷' };

export function formatGate(gate: GateDef): string {
  return OP_SYMBOL[gate.op] + toFaDigits(gate.value);
}
