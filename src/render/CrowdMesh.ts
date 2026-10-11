import * as THREE from 'three';
import { GAME } from '../config/game.config';
import { characterGeometry, characterMaterials, type CharacterMaterials } from './characters/build';
import type { CharacterDef } from './characters/defs';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

interface TypeMeshes {
  body: THREE.InstancedMesh;
  ink: THREE.InstancedMesh;
}

export interface CrowdOptions {
  defs: CharacterDef[];
  /** Color of the ring under each person's feet (team marker). */
  marker: number;
  spacing: number;
  /** Y rotation: 0 faces down the road (-z), PI faces the player. */
  facing: number;
  /** Limb swing amplitude while running. */
  runAmp: number;
  max?: number;
}

/**
 * A crowd of mixed characters in a sunflower (Vogel) cluster. Person i uses character
 * type i % types and slot floor(i / types) of that type's InstancedMesh, so the whole crowd
 * costs two draw calls per character type at any size. Rendered amount is
 * min(count, max): cosmetic only. update() allocates nothing.
 */
export class CrowdMesh {
  readonly group = new THREE.Group();
  centerX = 0;
  centerZ = 0;

  private readonly types: TypeMeshes[];
  private readonly mats: CharacterMaterials;
  private readonly max: number;
  private readonly slotX: Float32Array;
  private readonly slotZ: Float32Array;
  private readonly posX: Float32Array;
  private readonly posZ: Float32Array;
  private readonly scale: Float32Array;
  private readonly dummy = new THREE.Object3D();
  private shown = 0;
  private running = false;

  constructor(private readonly opts: CrowdOptions) {
    this.max = opts.max ?? GAME.maxCrowdSprites;
    this.mats = characterMaterials(opts.runAmp);
    const T = opts.defs.length;
    const perType = Math.ceil(this.max / T);
    const color = new THREE.Color();
    this.types = opts.defs.map((def, t) => {
      const geo = characterGeometry(def, opts.marker).clone();
      const hair = new THREE.InstancedBufferAttribute(new Float32Array(perType * 3), 3);
      geo.setAttribute('hairColor', hair);
      const body = new THREE.InstancedMesh(geo, this.mats.body, perType);
      const ink = new THREE.InstancedMesh(geo, this.mats.ink, perType);
      body.castShadow = true;
      body.frustumCulled = ink.frustumCulled = false;
      body.count = ink.count = 0;
      for (let s = 0; s < perType; s++) {
        const i = s * T + t; // person index → varied but stable colors
        body.setColorAt(s, color.setHex(def.cloth ? def.cloth[(i * 7) % def.cloth.length]! : 0xffffff));
        color.setHex(def.hair ? def.hair[(i * 5) % def.hair.length]! : 0);
        hair.setXYZ(s, color.r, color.g, color.b);
      }
      this.group.add(body, ink);
      return { body, ink };
    });

    this.slotX = new Float32Array(this.max);
    this.slotZ = new Float32Array(this.max);
    this.posX = new Float32Array(this.max);
    this.posZ = new Float32Array(this.max);
    this.scale = new Float32Array(this.max);
    for (let i = 0; i < this.max; i++) {
      const r = opts.spacing * Math.sqrt(i);
      const a = i * GOLDEN_ANGLE;
      this.slotX[i] = Math.cos(a) * r;
      this.slotZ[i] = Math.sin(a) * r;
      this.scale[i] = 0.94 + ((i * 37) % 11) / 100;
    }
  }

  /** Cluster radius in meters for the currently shown people. */
  get radius(): number {
    return this.opts.spacing * Math.sqrt(Math.max(0, this.shown - 1)) + GAME.personRadius;
  }

  setCount(count: number): void {
    const n = Math.min(this.max, Math.max(0, Math.floor(count)));
    for (let i = this.shown; i < n; i++) {
      this.posX[i] = this.centerX;
      this.posZ[i] = this.centerZ;
    }
    this.shown = n;
    const T = this.types.length;
    this.types.forEach((ty, t) => (ty.body.count = ty.ink.count = n > t ? Math.ceil((n - t) / T) : 0));
  }

  setRunning(running: boolean): void {
    this.running = running;
    this.mats.run.value = running ? this.opts.runAmp : 0.15;
  }

  setInkVisible(on: boolean): void {
    for (const ty of this.types) ty.ink.visible = on;
  }

  snap(): void {
    for (let i = 0; i < this.shown; i++) {
      this.posX[i] = this.centerX + this.slotX[i]!;
      this.posZ[i] = this.centerZ + this.slotZ[i]!;
    }
  }

  update(dt: number, time: number): void {
    const k = 1 - Math.exp(-14 * dt);
    const d = this.dummy;
    const T = this.types.length;
    const run = this.running;
    for (let i = 0; i < this.shown; i++) {
      const x = (this.posX[i]! += (this.centerX + this.slotX[i]! - this.posX[i]!) * k);
      const z = (this.posZ[i]! += (this.centerZ + this.slotZ[i]! - this.posZ[i]!) * k);
      const s = run ? Math.sin(time * 11 + i * 1.7) : Math.sin(time * 2 + i * 1.7) * 0.2;
      d.position.set(x, run ? Math.abs(s) * 0.07 : 0, z);
      d.rotation.set(run ? 0.12 : 0, this.opts.facing + (run ? 0 : s * 0.2), 0);
      d.scale.setScalar(this.scale[i]!);
      d.updateMatrix();
      const ty = this.types[i % T]!;
      const slot = (i / T) | 0;
      ty.body.setMatrixAt(slot, d.matrix);
      ty.ink.setMatrixAt(slot, d.matrix);
    }
    for (const ty of this.types) {
      ty.body.instanceMatrix.needsUpdate = true;
      ty.ink.instanceMatrix.needsUpdate = true;
    }
  }

  dispose(): void {
    for (const ty of this.types) {
      ty.body.geometry.dispose();
      ty.body.dispose();
      ty.ink.dispose();
    }
    this.mats.body.dispose();
    this.mats.ink.dispose();
  }
}
