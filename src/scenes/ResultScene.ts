import Phaser from 'phaser';
import { nextLevelId } from '../core/LevelLoader';
import type { RunResult } from '../core/types';
import { ResultPanel } from '../ui/ResultPanel';
import { SCENES } from './keys';

export interface ResultSceneData {
  levelId: string;
  result: RunResult;
  remaining: number;
}

/** Launched on top of GameScene; shows the DOM Win/Lose panel and routes the buttons. */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super(SCENES.result);
  }

  create(data: ResultSceneData): void {
    const panel = new ResultPanel(data.result, data.remaining, {
      onNext: () => this.goTo(nextLevelId(data.levelId)),
      onRetry: () => this.goTo(data.levelId),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => panel.destroy());
  }

  /** Restarts GameScene with the given level and shuts this scene down. */
  private goTo(levelId: string): void {
    this.scene.start(SCENES.game, { levelId });
  }
}
