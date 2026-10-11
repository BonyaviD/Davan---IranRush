import * as THREE from 'three';
import { GAME } from '../../config/game.config';
import type { WorldConfig } from '../../core/types';

/** Shared materials are cached per color so worlds reuse them across levels. */
const matCache = new Map<number, THREE.MeshLambertMaterial>();
export function lambert(color: number): THREE.MeshLambertMaterial {
  let m = matCache.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color });
    m.userData.shared = true;
    matCache.set(color, m);
  }
  return m;
}

export interface Span {
  /** World z where scenery starts (behind the camera) and ends (past the finish). */
  from: number;
  to: number;
}

/** Ground, road, sidewalks and lane dashes. */
export function buildRoad(world: WorldConfig, span: Span, root: THREE.Group): void {
  const p = world.palette;
  const len = span.from - span.to;
  const mid = (span.from + span.to) / 2;
  const half = GAME.roadWidth / 2;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), lambert(p.ground));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.02, mid);
  root.add(ground);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(GAME.roadWidth, len), lambert(p.road));
  road.rotation.x = -Math.PI / 2;
  road.position.z = mid;
  road.receiveShadow = true;
  root.add(road);

  for (const side of [-1, 1]) {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, len), lambert(p.sidewalk));
    walk.position.set(side * (half + 1.2), 0.09, mid);
    walk.receiveShadow = true;
    root.add(walk);
  }

  const dashes = Math.floor(len / 6);
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 0.02, 2.2), lambert(p.roadLine), dashes);
  const m = new THREE.Matrix4();
  for (let i = 0; i < dashes; i++) dash.setMatrixAt(i, m.makeTranslation(0, 0.01, span.from - i * 6));
  root.add(dash);
}

/** Rows of low-poly trees on both sidewalks (2 draw calls total). */
export function buildTrees(world: WorldConfig, span: Span, root: THREE.Group, every = 7): void {
  const count = Math.floor((span.from - span.to) / every) * 2;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 6), lambert(0x6e4a2f), count);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.2, 0), lambert(0xffffff), count);
  trunks.castShadow = crowns.castShadow = true;
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  const x = GAME.roadWidth / 2 + 0.9;
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    const z = span.from - Math.floor(i / 2) * every - (side > 0 ? every / 2 : 0);
    trunks.setMatrixAt(i, m.makeTranslation(side * x, 0.8, z));
    crowns.setMatrixAt(i, m.makeScale(1, 1.15, 1).setPosition(side * x, 2.3, z));
    crowns.setColorAt(i, c.setHex(world.palette.foliage[i % world.palette.foliage.length]!));
  }
  root.add(trunks, crowns);
}

/** Facade blocks lining the street with window bands facing the road. */
export function buildBlocks(
  world: WorldConfig,
  span: Span,
  root: THREE.Group,
  opts: { every: number; depth: number; minH: number; varH: number; offset: number; windows: boolean },
): void {
  const n = Math.floor((span.from - span.to) / opts.every) * 2;
  const box = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lambert(0xffffff), n);
  box.castShadow = true;
  box.receiveShadow = true;
  const bands = opts.windows
    ? new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.9, opts.every - 1.6), lambert(0x5a6f80), n * 4)
    : null;
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  let b = 0;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const z = span.from - Math.floor(i / 2) * opts.every;
    const h = opts.minH + ((i * 37) % 9) * (opts.varH / 9);
    const x = side * (GAME.roadWidth / 2 + opts.offset + opts.depth / 2);
    box.setMatrixAt(i, m.makeScale(opts.depth, h, opts.every - 0.4).setPosition(x, h / 2, z));
    box.setColorAt(i, c.setHex(world.palette.facades[i % world.palette.facades.length]!));
    if (bands) {
      for (let y = 2; y < h - 0.5 && b < bands.count; y += 2.2) {
        bands.setMatrixAt(b++, m.makeTranslation(x - side * (opts.depth / 2 + 0.01), y, z));
      }
    }
  }
  root.add(box);
  if (bands) {
    bands.count = b;
    root.add(bands);
  }
}

/** Frees per-level GPU resources; shared cached materials survive. */
export function disposeTree(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const mat of mats) {
      if (mat.userData.shared) continue;
      (mat as THREE.MeshBasicMaterial).map?.dispose();
      mat.dispose();
    }
  });
}
