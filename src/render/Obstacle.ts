import * as THREE from 'three';
import { GAME } from '../config/game.config';
import { obstacleX } from '../core/ObstacleLogic';
import type { ObstacleDef, ObstacleLook } from '../core/types';
import { GOLD, LAPIS, TURQUOISE, inked, toon } from './style/materials';

const HALF = GAME.roadWidth / 2;
const m = (geo: THREE.BufferGeometry, color: number, ink = 0.04) => {
  const mesh = inked(new THREE.Mesh(geo, toon(color)), ink);
  mesh.castShadow = true;
  return mesh;
};

function wheel(x: number, z: number, r = 0.32): THREE.Mesh {
  const w = m(new THREE.CylinderGeometry(r, r, 0.22, 12).rotateX(Math.PI / 2), 0x222222, 0.06);
  w.position.set(x, r, z);
  return w;
}

/** Placeholder low-poly models in the painted style; swap for real models per look. */
const BUILDERS: Record<ObstacleLook, (len: number) => THREE.Group> = {
  taxi: (len) => {
    const g = new THREE.Group();
    const body = m(new THREE.BoxGeometry(len, 0.6, 1.4), 0xf2c12e, 0.02);
    body.position.y = 0.6;
    const cabin = m(new THREE.BoxGeometry(len * 0.5, 0.5, 1.25), 0xf2c12e, 0.03);
    cabin.position.set(-len * 0.05, 1.15, 0);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(len * 0.46, 0.32, 1.27), toon(LAPIS));
    glass.position.set(-len * 0.05, 1.18, 0);
    const sign = m(new THREE.BoxGeometry(0.5, 0.18, 0.3), 0x2e8b57, 0.06);
    sign.position.set(-len * 0.05, 1.5, 0);
    g.add(body, cabin, glass, sign);
    for (const x of [-len * 0.32, len * 0.32]) for (const z of [-0.62, 0.62]) g.add(wheel(x, z));
    return g;
  },
  motor: (len) => {
    const g = new THREE.Group();
    for (const x of [-len * 0.35, len * 0.35]) {
      const w = m(new THREE.TorusGeometry(0.3, 0.08, 6, 14), 0x222222, 0.08);
      w.position.set(x, 0.38, 0);
      g.add(w);
    }
    const body = m(new THREE.BoxGeometry(len * 0.6, 0.3, 0.32), 0xc0392b, 0.05);
    body.position.y = 0.72;
    const rider = m(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8), 0x3b5a8a, 0.05);
    rider.position.set(-0.1, 1.15, 0);
    const helmet = m(new THREE.SphereGeometry(0.2, 10, 8), 0xf4f4f4, 0.06);
    helmet.position.set(-0.05, 1.58, 0);
    g.add(body, rider, helmet);
    return g;
  },
  cart: (len) => {
    const g = new THREE.Group();
    const bed = m(new THREE.BoxGeometry(len, 0.5, 1.5), 0x8a5a2b, 0.03);
    bed.position.y = 0.75;
    g.add(bed, wheel(-len * 0.25, -0.8, 0.45), wheel(-len * 0.25, 0.8, 0.45));
    const fruit = new THREE.SphereGeometry(0.18, 8, 6);
    for (let i = 0; i < 10; i++) {
      const f = m(fruit, i % 2 ? 0xb8282e : 0xf08a24, 0.08);
      f.position.set(-len / 2 + 0.3 + (i % 5) * (len - 0.6) / 4, 1.12 + Math.floor(i / 5) * 0.2, i < 5 ? -0.3 : 0.3);
      g.add(f);
    }
    return g;
  },
  urn: () => {
    const g = new THREE.Group();
    const pts = [[0.35, 0], [0.62, 0.45], [0.7, 0.85], [0.48, 1.3], [0.32, 1.55], [0.42, 1.7], [0.001, 1.71]].map(
      ([x, y]) => new THREE.Vector2(x!, y!),
    );
    g.add(m(new THREE.LatheGeometry(pts, 16), TURQUOISE, 0.03));
    const band = m(new THREE.TorusGeometry(0.71, 0.05, 6, 20).rotateX(Math.PI / 2), GOLD, 0.05);
    band.position.y = 0.85;
    g.add(band);
    return g;
  },
};

/** An obstacle on the road; crossing ones sweep side to side. */
export class Obstacle {
  readonly group: THREE.Group;
  /** Current center in lane units. */
  laneX: number;
  hit = false;
  private bump = 0;

  constructor(readonly def: ObstacleDef) {
    this.group = BUILDERS[def.look](def.halfWidth * HALF * 2);
    this.group.position.z = -def.z * GAME.metersPerUnit;
    this.laneX = def.x;
    this.update(0, 0);
  }

  get z(): number {
    return this.group.position.z;
  }

  knock(): void {
    this.hit = true;
    this.bump = 1;
  }

  update(dt: number, time: number): void {
    this.laneX = obstacleX(this.def, time);
    this.group.position.x = this.laneX * HALF;
    if (this.bump > 0) {
      this.bump = Math.max(0, this.bump - dt * 3);
      this.group.position.y = Math.sin(this.bump * Math.PI) * 0.3;
      this.group.rotation.z = Math.sin(this.bump * Math.PI * 3) * 0.08 * this.bump;
    }
  }
}
