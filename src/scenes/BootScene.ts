import Phaser from 'phaser';
import { GAME } from '../config/game.config';
import { SCENES, TEX } from './keys';

/** Generates placeholder textures (circles/rects) so the rest of the game only references keys. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    const r = GAME.personRadius;
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillCircle(r, r, r).generateTexture(TEX.person, r * 2, r * 2);
    g.clear().fillStyle(0xffffff).fillCircle(r, r, r).generateTexture(TEX.enemy, r * 2, r * 2);
    g.clear().fillStyle(0xffffff).fillRect(0, 0, 4, 4).generateTexture(TEX.pixel, 4, 4);
    g.destroy();

    this.scene.start(SCENES.menu);
  }
}
