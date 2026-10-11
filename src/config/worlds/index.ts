import type { WorldConfig, WorldId } from '../../core/types';
import { bazaar } from './bazaar';
import { isfahan } from './isfahan';
import { tehran } from './tehran';

export const WORLDS: Record<WorldId, WorldConfig> = { bazaar, isfahan, tehran };
export const WORLD_ORDER: WorldId[] = ['bazaar', 'isfahan', 'tehran'];
