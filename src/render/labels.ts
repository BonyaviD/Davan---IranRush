import * as THREE from 'three';
import { toFaDigits } from '../ui/digits';

/**
 * In-world labels are drawn into canvas textures. They contain only Persian digits and
 * operator symbols (no Arabic-script joining), and the canvas is forced LTR so "+۱۰"
 * is not bidi-reordered. Words and sentences stay in the DOM UI.
 */
const FONT = 'Vazirmatn, Tahoma, sans-serif';

function drawCentered(g: CanvasRenderingContext2D, text: string, w: number, h: number, size: number): void {
  g.direction = 'ltr';
  g.font = `900 ${size}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = size * 0.14;
  g.strokeStyle = 'rgba(0,0,0,0.5)';
  g.strokeText(text, w / 2, h / 2 + size * 0.06);
  g.fillStyle = '#fff';
  g.fillText(text, w / 2, h / 2 + size * 0.06);
}

/** A gate panel texture: tinted translucent background with the operation text. */
export function gateTexture(text: string, color: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  const col = new THREE.Color(color);
  g.fillStyle = `rgba(${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0},0.72)`;
  g.fillRect(0, 0, c.width, c.height);
  drawCentered(g, text, c.width, c.height, 78);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A floating number above a crowd; redraws only when the value changes. */
export class CountLabel {
  readonly sprite: THREE.Sprite;
  private readonly canvas = document.createElement('canvas');
  private readonly texture: THREE.CanvasTexture;
  private value = -1;

  constructor() {
    this.canvas.width = 256;
    this.canvas.height = 128;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.texture, depthTest: false, transparent: true }),
    );
    this.sprite.scale.set(1.6, 0.8, 1);
    this.sprite.renderOrder = 10;
  }

  set(n: number): void {
    if (n === this.value) return;
    this.value = n;
    const g = this.canvas.getContext('2d')!;
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    drawCentered(g, toFaDigits(n), this.canvas.width, this.canvas.height, 86);
    this.texture.needsUpdate = true;
    this.sprite.visible = n > 0;
  }
}
