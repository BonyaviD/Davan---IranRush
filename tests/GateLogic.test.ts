import { describe, expect, it } from 'vitest';
import { applyGate, isPositiveGate } from '../src/core/GateLogic';

describe('applyGate', () => {
  it('adds, subtracts, multiplies, divides', () => {
    expect(applyGate({ op: 'add', value: 10 }, 5)).toBe(15);
    expect(applyGate({ op: 'sub', value: 3 }, 5)).toBe(2);
    expect(applyGate({ op: 'mul', value: 3 }, 5)).toBe(15);
    expect(applyGate({ op: 'div', value: 2 }, 10)).toBe(5);
  });

  it('rounds results', () => {
    expect(applyGate({ op: 'div', value: 2 }, 7)).toBe(4);
    expect(applyGate({ op: 'mul', value: 1.5 }, 5)).toBe(8);
  });

  it('never goes below 0; sub can reach 0', () => {
    expect(applyGate({ op: 'sub', value: 50 }, 10)).toBe(0);
    expect(applyGate({ op: 'sub', value: 10 }, 10)).toBe(0);
  });

  it('mul/div keep at least 1 when count > 0', () => {
    expect(applyGate({ op: 'div', value: 5 }, 1)).toBe(1);
    expect(applyGate({ op: 'mul', value: 0 }, 7)).toBe(1);
  });

  it('div by 0 is a no-op', () => {
    expect(applyGate({ op: 'div', value: 0 }, 9)).toBe(9);
  });

  it('classifies gates', () => {
    expect(isPositiveGate({ op: 'add', value: 5 })).toBe(true);
    expect(isPositiveGate({ op: 'mul', value: 2 })).toBe(true);
    expect(isPositiveGate({ op: 'sub', value: 5 })).toBe(false);
    expect(isPositiveGate({ op: 'div', value: 2 })).toBe(false);
  });
});
