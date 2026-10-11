import type { LevelData } from './types';
import { LEVELS } from '../config/levels';

/** Lookup + validation of level data. Pure. */
export function getLevel(id: string): LevelData | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function levelIndex(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}

/** Next level id, wrapping to the first after the last. */
export function nextLevelId(id: string): string {
  const i = levelIndex(id);
  return LEVELS[(i + 1) % LEVELS.length]!.id;
}

export function levelsForWorld(world: LevelData['world']): LevelData[] {
  return LEVELS.filter((l) => l.world === world);
}

/** Returns a list of problems; empty = valid. */
export function validateLevel(level: LevelData): string[] {
  const errors: string[] = [];
  const boss = level.boss;
  if (level.startCount < 1) errors.push('startCount must be >= 1');
  if (boss.hp < 1) errors.push('boss.hp must be >= 1');
  if (boss.z > level.length) errors.push('boss.z beyond length');
  const ascending = (zs: number[], what: string) => {
    for (let i = 1; i < zs.length; i++) if (zs[i]! <= zs[i - 1]!) errors.push(`${what} not strictly ascending at z=${zs[i]}`);
  };
  ascending(level.segments.map((s) => s.z), 'segments');
  ascending(level.enemies.map((e) => e.z), 'enemies');
  for (const s of level.segments) if (s.z >= boss.z) errors.push(`gate at z=${s.z} is after the boss`);
  for (const e of level.enemies) {
    if (e.count < 1) errors.push(`enemy at z=${e.z} has no people`);
    if (e.z >= boss.z) errors.push(`enemy at z=${e.z} is after the boss`);
    if (level.segments.some((s) => Math.abs(s.z - e.z) < 200)) errors.push(`enemy at z=${e.z} is too close to a gate`);
  }
  for (const o of level.obstacles ?? []) {
    if (o.halfWidth <= 0 || o.damage < 0) errors.push(`obstacle at z=${o.z} has bad size/damage`);
    const fights = [...level.enemies.map((e) => e.z), boss.z];
    if (fights.some((z) => Math.abs(z - o.z) < 150)) errors.push(`obstacle at z=${o.z} is inside a fight`);
    if (level.segments.some((s) => Math.abs(s.z - o.z) < 120)) errors.push(`obstacle at z=${o.z} overlaps a gate`);
  }
  return errors;
}
