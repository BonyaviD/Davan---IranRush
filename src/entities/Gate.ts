import Phaser from 'phaser';
import { GAME } from '../config/game.config';
import { isPositiveGate } from '../core/GateLogic';
import type { GateSegment, WorldConfig } from '../core/types';
import { formatGate } from '../ui/digits';
import { LABEL_STYLE } from './labels';

const GATE_H = 90;

/** A left/right gate pair spanning the track at one z. Placeholder rectangles + labels. */
export class GatePair {
  passed = false;
  private readonly rects: Phaser.GameObjects.Rectangle[] = [];
  private readonly labels: Phaser.GameObjects.Text[] = [];

  constructor(
    scene: Phaser.Scene,
    readonly segment: GateSegment,
    world: WorldConfig,
  ) {
    const half = GAME.trackWidth / 2;
    const cx = GAME.width / 2;
    segment.gates.forEach((gate, i) => {
      const x = cx + (i === 0 ? -half / 2 : half / 2);
      const color = isPositiveGate(gate) ? world.palette.gatePositive : world.palette.gateNegative;
      this.rects.push(
        scene.add
          .rectangle(x, 0, half - 10, GATE_H, color, 0.55)
          .setStrokeStyle(4, color, 1)
          .setDepth(5),
      );
      this.labels.push(scene.add.text(x, 0, formatGate(gate), LABEL_STYLE).setOrigin(0.5).setDepth(6));
    });
  }

  layout(screenY: number): void {
    const visible = screenY > -GATE_H && screenY < GAME.height + GATE_H;
    for (let i = 0; i < 2; i++) {
      this.rects[i]!.setY(screenY).setVisible(visible);
      this.labels[i]!.setY(screenY).setVisible(visible);
    }
  }

  markPassed(chosen: 0 | 1): void {
    this.passed = true;
    for (let i = 0; i < 2; i++) {
      this.rects[i]!.setAlpha(i === chosen ? 0.2 : 0.5);
      this.labels[i]!.setAlpha(i === chosen ? 0.3 : 0.6);
    }
  }
}
