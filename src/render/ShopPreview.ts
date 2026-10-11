import * as THREE from 'three';
import { characterGeometry, characterMaterials } from './characters/build';
import type { CharacterDef } from './characters/defs';
import { toonMapped } from './style/materials';
import { tileTexture } from './style/textures';

/** A small turntable scene that shows one character for the shop. */
export class ShopPreview {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  private readonly mats = characterMaterials(0.8);
  private holder = new THREE.Group();
  private colorIndex = 0;
  private timer = 0;
  private def: CharacterDef | null = null;
  private body: THREE.InstancedMesh | null = null;
  private hair: THREE.InstancedBufferAttribute | null = null;

  constructor() {
    this.scene.background = new THREE.Color(0x24376e);
    this.scene.add(new THREE.HemisphereLight(0xfff4dc, 0x6b5a8a, 0.9));
    const sun = new THREE.DirectionalLight(0xfff0d0, 0.8);
    sun.position.set(-3, 6, -6);
    this.scene.add(sun);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.25, 40), toonMapped(tileTexture([2, 2])));
    stand.position.y = -0.13;
    this.scene.add(stand, this.holder);
    this.camera.position.set(0, 2.3, 5.4);
    this.camera.lookAt(0, 1.05, 0);
  }

  show(def: CharacterDef, marker: number): void {
    this.def = def;
    this.holder.clear();
    const geo = characterGeometry(def, marker).clone();
    this.hair = new THREE.InstancedBufferAttribute(new Float32Array(3), 3);
    geo.setAttribute('hairColor', this.hair);
    this.body = new THREE.InstancedMesh(geo, this.mats.body, 1);
    const ink = new THREE.InstancedMesh(geo, this.mats.ink, 1);
    this.body.setMatrixAt(0, new THREE.Matrix4());
    ink.setMatrixAt(0, new THREE.Matrix4());
    this.holder.add(this.body, ink);
    this.holder.scale.setScalar(1.5);
    this.colorIndex = -1;
    this.timer = 0;
  }

  update(dt: number, aspect: number): void {
    this.timer += dt;
    this.holder.rotation.y = Math.PI + this.timer * 0.8;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1 ? 42 : 30;
    this.camera.updateProjectionMatrix();
    const d = this.def;
    if (!d || !this.body || !this.hair) return;
    const k = Math.floor(this.timer / 1.4);
    if (k === this.colorIndex) return;
    this.colorIndex = k;
    const c = new THREE.Color(d.cloth ? d.cloth[k % d.cloth.length]! : 0xffffff);
    this.body.setColorAt(0, c);
    this.body.instanceColor!.needsUpdate = true;
    c.setHex(d.hair ? d.hair[k % d.hair.length]! : 0);
    this.hair.setXYZ(0, c.r, c.g, c.b);
    this.hair.needsUpdate = true;
  }
}
