import Phaser from 'phaser';
import { GAME } from '../config/game.config';
import type { EnemyDef, WorldConfig } from '../core/types';
import { toFaDigits } from '../ui/digits';
import { TEX } from '../scenes/keys';
import { CrowdRenderer } from './CrowdRenderer';
import { LABEL_STYLE } from './labels';

/** Enemy group at the end of the track: a crowd renderer plus a count label. */
export class Enemy {
  readonly crowd: CrowdRenderer;
  private readonly label: Phaser.GameObjects.Text;
  private count: number;

  constructor(scene: Phaser.Scene, readonly def: EnemyDef, world: WorldConfig) {
    this.count = def.count;
    this.crowd = new CrowdRenderer(
      scene,
      TEX.enemy,
      world.palette.enemy,
      GAME.maxCrowdSprites,
      GAME.crowdSpacing,
      GAME.personRadius,
      9,
    );
    this.crowd.centerX = GAME.width / 2;
    this.crowd.setCount(def.count);
    this.label = scene.add.text(0, 0, toFaDigits(def.count), LABEL_STYLE).setOrigin(0.5).setDepth(20);
  }

  setCount(n: number): void {
    if (n === this.count) return;
    this.count = n;
    this.crowd.setCount(n);
    this.label.setText(toFaDigits(n)).setVisible(n > 0);
  }

  layout(screenY: number, dt: number, snap = false): void {
    this.crowd.centerY = screenY;
    if (snap) this.crowd.snap();
    else this.crowd.update(dt);
    this.label.setPosition(this.crowd.centerX, screenY - this.crowd.radius - 34);
  }
}
