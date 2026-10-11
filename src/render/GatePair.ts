import * as THREE from 'three';
import { GAME } from '../config/game.config';
import { isPositiveGate } from '../core/GateLogic';
import type { GateSegment, WorldConfig } from '../core/types';
import { formatGate } from '../ui/digits';
import { GOLD, TURQUOISE, inked, toon } from './style/materials';
import { gateTexture } from './style/textures';

const PANEL_H = 3.1;
const postGeo = new THREE.CylinderGeometry(0.16, 0.2, 3.6, 8);
const capGeo = new THREE.SphereGeometry(0.28, 10, 8);

/** A left/right pair of iwan-arch gates with gold posts spanning the road at one z. */
export class GatePair {
  readonly group = new THREE.Group();
  passed = false;
  private readonly panels: THREE.MeshBasicMaterial[] = [];
  /** Real textures for mystery gates, swapped in by reveal(). */
  private readonly hiddenMaps: (THREE.Texture | null)[] = [];
  revealed = true;

  constructor(
    readonly segment: GateSegment,
    world: WorldConfig,
  ) {
    const w = GAME.roadWidth;
    const p = world.palette;
    segment.gates.forEach((gate, i) => {
      const color = isPositiveGate(gate) ? p.gatePositive : p.gateNegative;
      const real = gateTexture(formatGate(gate), color);
      if (gate.hidden) this.revealed = false;
      this.hiddenMaps.push(gate.hidden ? real : null);
      const mat = new THREE.MeshBasicMaterial({
        map: gate.hidden ? gateTexture('؟', 0x5b4a8a) : real,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.panels.push(mat);
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(w / 2 - 0.3, PANEL_H), mat);
      panel.position.set((i === 0 ? -1 : 1) * (w / 4), 1.8, 0);
      this.group.add(panel);
    });
    for (const x of [-w / 2, 0, w / 2]) {
      const post = inked(new THREE.Mesh(postGeo, toon(GOLD)), 0.08);
      post.position.set(x, 1.8, 0);
      post.castShadow = true;
      const cap = inked(new THREE.Mesh(capGeo, toon(TURQUOISE)), 0.1);
      cap.position.set(x, 3.75, 0);
      this.group.add(post, cap);
    }
    this.group.userData.keepGeometry = true;
    this.group.position.z = -segment.z * GAME.metersPerUnit;
  }

  /** Shows the real values of mystery gates. */
  reveal(): void {
    if (this.revealed) return;
    this.revealed = true;
    this.panels.forEach((m, i) => {
      const real = this.hiddenMaps[i];
      if (!real) return;
      m.map?.dispose();
      m.map = real;
      m.needsUpdate = true;
    });
  }

  markPassed(chosen: 0 | 1): void {
    this.passed = true;
    this.panels.forEach((m, i) => (m.opacity = i === chosen ? 0.15 : 0.45));
  }

  /** Passed gates fade out so they never block the camera's view of the crowd. */
  update(dt: number): void {
    if (!this.passed || !this.group.visible) return;
    const k = Math.exp(-4 * dt);
    let visible = false;
    for (const m of this.panels) {
      m.opacity *= k;
      if (m.opacity > 0.02) visible = true;
    }
    this.group.visible = visible;
  }
}
