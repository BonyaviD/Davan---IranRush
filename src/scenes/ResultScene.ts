import Phaser from 'phaser';
import { SCENES } from './keys';

/** Thin scene; the Win/Lose panel itself is DOM (ui/ResultPanel.ts). */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super(SCENES.result);
  }
}
