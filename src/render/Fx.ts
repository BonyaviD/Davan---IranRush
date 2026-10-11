import * as THREE from 'three';
import { GOLD } from './style/materials';
import { canvasTexture, drawNumber } from './style/textures';

/** Floating "+۱۰" style numbers that rise and fade above the crowd. Pooled sprites. */
export class Popups {
  readonly group = new THREE.Group();
  private readonly items: { sprite: THREE.Sprite; canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; life: number }[] = [];
  private next = 0;

  constructor(size = 4) {
    for (let i = 0; i < size; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
      sprite.scale.set(1.3, 0.65, 1);
      sprite.renderOrder = 11;
      sprite.visible = false;
      this.group.add(sprite);
      this.items.push({ sprite, canvas, tex, life: 0 });
    }
  }

  spawn(text: string, color: string, x: number, y: number, z: number): void {
    const it = this.items[this.next++ % this.items.length]!;
    const g = it.canvas.getContext('2d')!;
    g.clearRect(0, 0, 256, 128);
    drawNumber(g, text, 128, 68, 92);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = color;
    g.globalAlpha = 0.35;
    g.fillRect(0, 0, 256, 128);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    it.tex.needsUpdate = true;
    it.sprite.position.set(x, y, z);
    it.sprite.visible = true;
    it.life = 1;
  }

  update(dt: number): void {
    for (const it of this.items) {
      if (it.life <= 0) continue;
      it.life -= dt * 1.1;
      it.sprite.position.y += dt * 1.6;
      (it.sprite.material as THREE.SpriteMaterial).opacity = Math.min(1, it.life * 2);
      if (it.life <= 0) it.sprite.visible = false;
    }
  }
}

/** Gold sparks for fights and the boss falling. One Points object, recycled particles. */
export class Sparks {
  readonly points: THREE.Points;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly life: Float32Array;
  private cursor = 0;

  constructor(private readonly n = 160) {
    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const dot = canvasTexture(32, 32, (g) => {
      const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, '#fff6d0');
      grad.addColorStop(0.4, '#' + GOLD.toString(16));
      grad.addColorStop(1, 'rgba(226,176,74,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 32, 32);
    });
    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size: 0.35, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.points.frustumCulled = false;
    for (let i = 0; i < n; i++) this.pos[i * 3 + 1] = -100;
  }

  burst(x: number, y: number, z: number, count = 12, power = 3): void {
    for (let k = 0; k < count; k++) {
      const i = this.cursor++ % this.n;
      this.pos.set([x, y, z], i * 3);
      const a = Math.random() * Math.PI * 2;
      const up = 0.5 + Math.random();
      this.vel.set([Math.cos(a) * power * 0.6, up * power, Math.sin(a) * power * 0.6], i * 3);
      this.life[i] = 0.6 + Math.random() * 0.4;
    }
  }

  update(dt: number): void {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i]! <= 0) continue;
      this.life[i]! -= dt;
      const j = i * 3;
      this.vel[j + 1]! -= 9 * dt;
      this.pos[j]! += this.vel[j]! * dt;
      this.pos[j + 1]! += this.vel[j + 1]! * dt;
      this.pos[j + 2]! += this.vel[j + 2]! * dt;
      if (this.life[i]! <= 0) this.pos[j + 1] = -100;
    }
    this.points.geometry.attributes.position!.needsUpdate = true;
  }
}
