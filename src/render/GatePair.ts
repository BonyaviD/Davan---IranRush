import * as THREE from 'three';
import { GAME } from '../config/game.config';
import { isPositiveGate } from '../core/GateLogic';
import type { GateSegment, WorldConfig } from '../core/types';
import { formatGate } from '../ui/digits';
import { gateTexture } from './labels';

const PANEL_H = 2.4;

/** A left/right gate pair spanning the road at one z. */
export class GatePair {
  readonly group = new THREE.Group();
  passed = false;
  private readonly panels: THREE.MeshBasicMaterial[] = [];

  constructor(
    readonly segment: GateSegment,
    world: WorldConfig,
    postGeo: THREE.BufferGeometry,
    postMat: THREE.Material,
  ) {
    const w = GAME.roadWidth;
    segment.gates.forEach((gate, i) => {
      const color = isPositiveGate(gate) ? world.palette.gatePositive : world.palette.gateNegative;
      const mat = new THREE.MeshBasicMaterial({
        map: gateTexture(formatGate(gate), color),
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.panels.push(mat);
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(w / 2 - 0.2, PANEL_H), mat);
      panel.position.set((i === 0 ? -1 : 1) * (w / 4), 1.6, 0);
      this.group.add(panel);
    });
    for (const x of [-w / 2, 0, w / 2]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 1.6, 0);
      post.castShadow = true;
      this.group.add(post);
    }
    this.group.position.z = -segment.z * GAME.metersPerUnit;
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
