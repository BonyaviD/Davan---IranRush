import Phaser from 'phaser';
import { SCENES } from './keys';

/** Background only; the actual menu is DOM (ui/Menu.ts, M3). For now jumps straight into play. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    this.scene.start(SCENES.game, { levelId: 'bazaar-01' });
  }
}
