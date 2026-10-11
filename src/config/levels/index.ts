import type { LevelData } from '../../core/types';
import { BAZAAR } from './bazaar';
import { ISFAHAN } from './isfahan';
import { TEHRAN } from './tehran';

/** All levels in play order: Tehran, then Isfahan, then the bazaar. */
export const LEVELS: LevelData[] = [...TEHRAN, ...ISFAHAN, ...BAZAAR];
