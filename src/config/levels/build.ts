import type { BossKind, GateDef, GateOp, LevelData, ObstacleDef, WorldId } from '../../core/types';

/** Compact authoring helpers so level files read like a script of the run. */
export const g = (op: GateOp, value: number, hidden = false): GateDef => (hidden ? { op, value, hidden } : { op, value });
export const add = (v: number, h = false) => g('add', v, h);
export const sub = (v: number, h = false) => g('sub', v, h);
export const mul = (v: number, h = false) => g('mul', v, h);
export const div = (v: number, h = false) => g('div', v, h);

export const taxi = (z: number, x = -1, speed = 0.45): ObstacleDef => ({ z, kind: 'crossing', x, halfWidth: 0.34, damage: 8, speed, look: 'taxi' });
export const motor = (z: number, x = 1, speed = 0.7): ObstacleDef => ({ z, kind: 'crossing', x, halfWidth: 0.22, damage: 5, speed, look: 'motor' });
export const cart = (z: number, x: number): ObstacleDef => ({ z, kind: 'static', x, halfWidth: 0.34, damage: 6, look: 'cart' });
export const urn = (z: number, x: number): ObstacleDef => ({ z, kind: 'static', x, halfWidth: 0.28, damage: 6, look: 'urn' });

type Step =
  | { gate: [number, GateDef, GateDef] }
  | { enemy: [number, number] }
  | { obstacle: ObstacleDef };

export const G = (z: number, left: GateDef, right: GateDef): Step => ({ gate: [z, left, right] });
export const E = (z: number, count: number): Step => ({ enemy: [z, count] });
export const O = (o: ObstacleDef): Step => ({ obstacle: o });

export function level(
  id: string,
  world: WorldId,
  startCount: number,
  steps: Step[],
  boss: { z: number; hp: number; kind: BossKind },
): LevelData {
  const out: LevelData = { id, world, startCount, length: boss.z + 350, segments: [], obstacles: [], enemies: [], boss };
  for (const s of steps) {
    if ('gate' in s) out.segments.push({ z: s.gate[0], gates: [s.gate[1], s.gate[2]] });
    else if ('enemy' in s) out.enemies.push({ z: s.enemy[0], count: s.enemy[1] });
    else out.obstacles!.push(s.obstacle);
  }
  return out;
}
