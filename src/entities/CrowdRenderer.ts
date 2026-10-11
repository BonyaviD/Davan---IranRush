import Phaser from 'phaser';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Draws a crowd as a capped pool of sprites in a sunflower (Vogel) cluster.
 * All sprites are created once; update() does no allocation.
 * The rendered amount is min(count, max): purely cosmetic, never gameplay state.
 */
export class CrowdRenderer {
  centerX = 0;
  centerY = 0;

  private readonly sprites: Phaser.GameObjects.Image[] = [];
  private readonly offX: Float32Array;
  private readonly offY: Float32Array;
  private shown = 0;

  constructor(
    scene: Phaser.Scene,
    texture: string,
    tint: number,
    private readonly max: number,
    private readonly spacing: number,
    private readonly personRadius: number,
    depth: number,
  ) {
    this.offX = new Float32Array(max);
    this.offY = new Float32Array(max);
    for (let i = 0; i < max; i++) {
      const r = spacing * Math.sqrt(i);
      const a = i * GOLDEN_ANGLE;
      this.offX[i] = Math.cos(a) * r;
      this.offY[i] = Math.sin(a) * r * 0.85; // slight vertical squash reads as perspective
      this.sprites.push(scene.add.image(0, 0, texture).setTint(tint).setVisible(false).setDepth(depth));
    }
  }

  /** Cluster radius in px for the currently shown sprites. */
  get radius(): number {
    return this.spacing * Math.sqrt(Math.max(0, this.shown - 1)) + this.personRadius;
  }

  setCount(count: number): void {
    const n = Math.min(this.max, Math.max(0, Math.floor(count)));
    for (let i = this.shown; i < n; i++) {
      // New people spawn at the center and spread outward via smoothing.
      this.sprites[i]!.setPosition(this.centerX, this.centerY).setVisible(true);
    }
    for (let i = n; i < this.shown; i++) this.sprites[i]!.setVisible(false);
    this.shown = n;
  }

  /** Snap every sprite to its slot (used on spawn). */
  snap(): void {
    for (let i = 0; i < this.shown; i++) {
      this.sprites[i]!.setPosition(this.centerX + this.offX[i]!, this.centerY + this.offY[i]!);
    }
  }

  update(dt: number): void {
    const k = 1 - Math.exp(-18 * dt);
    for (let i = 0; i < this.shown; i++) {
      const s = this.sprites[i]!;
      s.x += (this.centerX + this.offX[i]! - s.x) * k;
      s.y += (this.centerY + this.offY[i]! - s.y) * k;
    }
  }

  destroy(): void {
    for (const s of this.sprites) s.destroy();
    this.sprites.length = 0;
  }
}
