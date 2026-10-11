import { generateCampaign } from '../../core/LevelGen';
import type { LevelData } from '../../core/types';

/** Number of levels in the campaign (cities rotate every 5 levels). */
export const LEVEL_COUNT = 45;

/** All levels in play order, generated deterministically at startup (a few ms). */
export const LEVELS: LevelData[] = generateCampaign(LEVEL_COUNT);
