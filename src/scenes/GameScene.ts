import Phaser from 'phaser';
import { GAME } from '../config/game.config';
import { WORLDS } from '../config/worlds';
import { getLevel } from '../core/LevelLoader';
import type { LevelData } from '../core/types';
import { SCENES } from './keys';

export interface GameSceneData {
  levelId: string;
}

/**
 * Run loop (M1): scroll by distance += runSpeed * dt, steer via pointer drag,
 * gate/obstacle AABB checks, then battle. Rendering lives in entities/*.
 */
export class GameScene extends Phaser.Scene {
  private level!: LevelData;

  constructor() {
    super(SCENES.game);
  }

  init(data: GameSceneData): void {
    const level = getLevel(data.levelId);
    if (!level) throw new Error(`Unknown level: ${data.levelId}`);
    this.level = level;
  }

  create(): void {
    const world = WORLDS[this.level.world];
    this.cameras.main.setBackgroundColor(world.palette.background);
    // Placeholder track so the skeleton visibly runs.
    this.add
      .rectangle(GAME.width / 2, GAME.height / 2, GAME.trackWidth, GAME.height, world.palette.track)
      .setStrokeStyle(6, world.palette.trackEdge);
  }

  override update(_time: number, _deltaMs: number): void {
    // TODO(M1): distance/steering/gates/battle
  }
}
