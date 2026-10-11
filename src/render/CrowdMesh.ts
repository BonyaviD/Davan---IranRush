import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GAME } from '../config/game.config';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Low-poly person (body + head) merged into one geometry so a whole crowd is one draw call. */
function personGeometry(): THREE.BufferGeometry {
  const body = new THREE.CylinderGeometry(0.17, 0.22, 0.75, 7).translate(0, 0.38, 0);
  const head = new THREE.SphereGeometry(0.19, 8, 6).translate(0, 0.95, 0);
  const merged = mergeGeometries([body, head]);
  body.dispose();
  head.dispose();
  if (!merged) throw new Error('person geometry merge failed');
  return merged;
}

/**
 * A crowd rendered as one InstancedMesh with a fixed capacity.
 * People sit in a sunflower (Vogel) cluster and ease toward their slot every frame.
 * Rendered amount is min(count, max): cosmetic only. update() allocates nothing.
 */
export class CrowdMesh {
  readonly mesh: THREE.InstancedMesh;
  centerX = 0;
  centerZ = 0;

  private readonly material: THREE.MeshLambertMaterial;
  private readonly slotX: Float32Array;
  private readonly slotZ: Float32Array;
  private readonly posX: Float32Array;
  private readonly posZ: Float32Array;
  private readonly phase: Float32Array;
  private readonly dummy = new THREE.Object3D();
  private shown = 0;

  constructor(private readonly max = GAME.maxCrowdSprites) {
    this.material = new THREE.MeshLambertMaterial();
    this.mesh = new THREE.InstancedMesh(personGeometry(), this.material, max);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;

    this.slotX = new Float32Array(max);
    this.slotZ = new Float32Array(max);
    this.posX = new Float32Array(max);
    this.posZ = new Float32Array(max);
    this.phase = new Float32Array(max);
    for (let i = 0; i < max; i++) {
      const r = GAME.crowdSpacing * Math.sqrt(i);
      const a = i * GOLDEN_ANGLE;
      this.slotX[i] = Math.cos(a) * r;
      this.slotZ[i] = Math.sin(a) * r;
      this.phase[i] = (i * 1.7) % (Math.PI * 2);
    }
  }

  setColor(color: number): void {
    this.material.color.setHex(color);
  }

  /** Cluster radius in meters for the currently shown people. */
  get radius(): number {
    return GAME.crowdSpacing * Math.sqrt(Math.max(0, this.shown - 1)) + GAME.personRadius;
  }

  setCount(count: number): void {
    const n = Math.min(this.max, Math.max(0, Math.floor(count)));
    for (let i = this.shown; i < n; i++) {
      // New people appear at the center and spread outward.
      this.posX[i] = this.centerX;
      this.posZ[i] = this.centerZ;
    }
    this.shown = n;
    this.mesh.count = n;
  }

  snap(): void {
    for (let i = 0; i < this.shown; i++) {
      this.posX[i] = this.centerX + this.slotX[i]!;
      this.posZ[i] = this.centerZ + this.slotZ[i]!;
    }
  }

  update(dt: number, time: number, running: boolean): void {
    const k = 1 - Math.exp(-14 * dt);
    const d = this.dummy;
    for (let i = 0; i < this.shown; i++) {
      const x = (this.posX[i]! += (this.centerX + this.slotX[i]! - this.posX[i]!) * k);
      const z = (this.posZ[i]! += (this.centerZ + this.slotZ[i]! - this.posZ[i]!) * k);
      const s = running ? Math.sin(time * 11 + this.phase[i]!) : 0;
      d.position.set(x, running ? Math.abs(s) * 0.12 : 0, z);
      d.rotation.set(s * 0.08, 0, 0);
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
