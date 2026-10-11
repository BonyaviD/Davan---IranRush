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
  if (level.startCount < 1) errors.push('startCount must be >= 1');
  if (level.enemy.count < 1) errors.push('enemy.count must be >= 1');
  if (level.enemy.z > level.length) errors.push('enemy.z beyond length');
  let prevZ = -Infinity;
  for (const s of level.segments) {
    if (s.z <= prevZ) errors.push(`segments not strictly ascending at z=${s.z}`);
    if (s.z >= level.enemy.z) errors.push(`gate at z=${s.z} is after enemy`);
    prevZ = s.z;
  }
  return errors;
}
