import type { GateDef } from './types';
import { applyGate } from './GateLogic';

/**
 * Authoritative crowd state. Pure logic, no Phaser.
 * The number of rendered sprites is derived from `count` but never drives it.
 */
export class CrowdModel {
  private _count: number;

  constructor(startCount: number) {
    this._count = Math.max(0, Math.round(startCount));
  }

  get count(): number {
    return this._count;
  }

  get isDead(): boolean {
    return this._count <= 0;
  }

  passGate(gate: GateDef): number {
    this._count = applyGate(gate, this._count);
    return this._count;
  }

  damage(amount: number): number {
    this._count = Math.max(0, this._count - Math.round(amount));
    return this._count;
  }
}
