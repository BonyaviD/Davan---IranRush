import * as THREE from 'three';
import { GAME } from '../config/game.config';
import { characterGeometry, characterMaterials, type CharacterMaterials } from './characters/build';
import type { CharacterDef } from './characters/defs';
import { CountLabel } from './labels';

/** The giant at the end of the path: one big character with an hp label. */
export class Boss {
  readonly group = new THREE.Group();
  readonly label = new CountLabel(1.4);
  private readonly mats: CharacterMaterials;
  private readonly body: THREE.InstancedMesh;
  private readonly ink: THREE.InstancedMesh;
  private fall = 0;
  private defeated = false;

  constructor(def: CharacterDef, marker: number, z: number, hp: number) {
    this.mats = characterMaterials(0.3);
    const geo = characterGeometry(def, marker).clone();
    geo.setAttribute('hairColor', new THREE.InstancedBufferAttribute(new Float32Array(3), 3));
    this.body = new THREE.InstancedMesh(geo, this.mats.body, 1);
    this.ink = new THREE.InstancedMesh(geo, this.mats.ink, 1);
    this.body.castShadow = true;
    // Faces the player; instance matrix stays identity, the group carries the transform.
    this.body.setMatrixAt(0, new THREE.Matrix4());
    this.ink.setMatrixAt(0, new THREE.Matrix4());
    const pivot = new THREE.Group();
    pivot.add(this.body, this.ink);
    pivot.rotation.y = Math.PI;
    pivot.scale.setScalar(GAME.bossScale);
    this.group.add(pivot);
    this.group.position.z = z;
    this.label.set(hp);
  }

  get z(): number {
    return this.group.position.z;
  }

  setHp(n: number): void {
    this.label.set(n);
  }

  setFighting(on: boolean): void {
    this.mats.run.value = on ? 0.9 : 0.3;
  }

  defeat(): void {
    this.defeated = true;
    this.mats.run.value = 0;
  }

  update(dt: number): void {
    if (this.defeated && this.fall < 1) {
      this.fall = Math.min(1, this.fall + dt * 1.6);
      const e = this.fall * this.fall;
      this.group.rotation.x = -e * (Math.PI / 2) * 0.95;
      this.group.position.y = -e * 0.2;
    }
    this.label.sprite.position.set(0, GAME.bossScale * 1.75, this.z);
    this.label.sprite.visible = !this.defeated;
  }

  dispose(): void {
    this.body.geometry.dispose();
    this.body.dispose();
    this.ink.dispose();
    this.mats.body.dispose();
    this.mats.ink.dispose();
    this.label.dispose();
  }
}
