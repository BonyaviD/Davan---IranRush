import * as THREE from 'three';
import { toFaDigits } from '../ui/digits';
import { drawNumber } from './style/textures';

/** A floating number above a group (people or boss hp); redraws only when the value changes. */
export class CountLabel {
  readonly sprite: THREE.Sprite;
  private readonly canvas = document.createElement('canvas');
  private readonly texture: THREE.CanvasTexture;
  private value = -1;

  constructor(scale = 1) {
    this.canvas.width = 256;
    this.canvas.height = 128;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.texture, depthTest: false, transparent: true }),
    );
    this.sprite.scale.set(1.6 * scale, 0.8 * scale, 1);
    this.sprite.renderOrder = 10;
  }

  set(n: number): void {
    if (n === this.value) return;
    this.value = n;
    const g = this.canvas.getContext('2d')!;
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    drawNumber(g, toFaDigits(n), this.canvas.width / 2, this.canvas.height / 2 + 5, 86);
    this.texture.needsUpdate = true;
    this.sprite.visible = n > 0;
  }

  dispose(): void {
    this.texture.dispose();
    this.sprite.material.dispose();
  }
}
