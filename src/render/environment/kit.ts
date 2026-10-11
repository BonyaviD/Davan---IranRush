import * as THREE from 'three';
import { GAME } from '../../config/game.config';
import type { WorldConfig } from '../../core/types';
import { GOLD, TURQUOISE, inkMaterial, toon, toonMapped } from '../style/materials';
import { cloudTexture, facadeTexture, tileTexture } from '../style/textures';

/** World-space z range the scenery covers: from behind the camera to past the boss. */
export interface Span {
  from: number;
  to: number;
}

const HALF = GAME.roadWidth / 2;
/** Street cross-section, mirrored on both sides: road | curb | jube | trees | sidewalk | facades. */
export const STREET = { curb: HALF, jube: HALF + 0.25, strip: HALF + 0.7, walk: HALF + 2.1, build: HALF + 4.5 };
const BUILD_D = 6;
const BUILD_L = 10;

/** Gold-to-lapis sky dome, curling clouds and three painted mountain ridges. */
export function buildSky(world: WorldConfig, span: Span, end: number, root: THREE.Group): void {
  const p = world.palette;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(900, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { top: { value: new THREE.Color(p.skyTop) }, bottom: { value: new THREE.Color(p.skyHorizon) } },
      vertexShader:
        'varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:
        'uniform vec3 top;\nuniform vec3 bottom;\nvarying float vY;\nvoid main() {\n  gl_FragColor = vec4(mix(bottom, top, smoothstep(0.0, 0.45, vY)), 1.0);\n  #include <colorspace_fragment>\n}',
    }),
  );
  sky.position.z = (span.from + span.to) / 2;
  sky.renderOrder = -1;
  root.add(sky);

  const cloudMat = new THREE.SpriteMaterial({ map: cloudTexture(), fog: false, transparent: true });
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Sprite(cloudMat);
    s.scale.set(70, 35, 1);
    s.position.set(-180 + i * 62, 95 + ((i * 37) % 50), end - 330 - ((i * 53) % 120));
    root.add(s);
  }

  // Continuous ridges with rounded lobes; a darker copy just above draws the ink crest line.
  const ridge = (seed: number, baseH: number, amp: number, color: number, z: number) => {
    const W = 1100;
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, -30);
    for (let x = -W / 2; x <= W / 2; x += 3) {
      const y =
        baseH +
        amp *
          (0.5 * Math.sin(x * 0.016 + seed) +
            0.3 * Math.sin(x * 0.037 + seed * 2.1) +
            0.2 * Math.abs(Math.sin(x * 0.085 + seed * 3.7)));
      shape.lineTo(x, y);
    }
    shape.lineTo(W / 2, -30);
    const geo = new THREE.ShapeGeometry(shape);
    const body = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
    body.position.z = z;
    const line = new THREE.Mesh(geo, inkMaterial);
    line.position.set(0, 1.6, z - 0.5);
    line.userData.sharedGeometry = true;
    root.add(body, line);
  };
  ridge(1.3, 78, 38, p.ridges[0], end - 330);
  ridge(4.1, 50, 30, p.ridges[1], end - 270);
  ridge(7.7, 24, 16, p.ridges[2], end - 210);
}

/** Ground, road, the mirrored street edge, sidewalks and lane dashes. */
export function buildStreet(world: WorldConfig, span: Span, root: THREE.Group): void {
  const p = world.palette;
  const len = span.from - span.to;
  const mid = (span.from + span.to) / 2;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), toon(p.ground));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.03, mid - 300);
  root.add(ground);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(GAME.roadWidth, len), toon(p.road));
  road.rotation.x = -Math.PI / 2;
  road.position.z = mid;
  road.receiveShadow = true;
  root.add(road);

  const S = STREET;
  const tiles = toonMapped(tileTexture([2, len / 1.25]));
  const strips: [number, number, number, THREE.Material][] = [
    [S.curb, S.jube, 0.24, toon(GOLD)],
    [S.jube, S.strip, 0.06, toon(TURQUOISE)],
    [S.strip, S.walk, 0.22, toon(0x86b25c)],
    [S.walk, S.build, 0.2, tiles],
  ];
  for (const side of [-1, 1]) {
    for (const [x0, x1, h, mat] of strips) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, len), mat);
      m.position.set((side * (x0 + x1)) / 2, h / 2, mid);
      m.receiveShadow = true;
      root.add(m);
    }
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, len), toon(GOLD));
    edge.position.set(side * (S.walk + 0.06), 0.13, mid);
    root.add(edge);
  }

  const n = Math.floor(len / 5);
  const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.02, 1.6), toon(p.roadLine), n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) dashes.setMatrixAt(i, m.makeTranslation(0, 0.01, span.from - i * 5));
  root.add(dashes);
}

/** Inked instanced mesh: the body plus an ink shell instance per placement. */
export function inkedInstances(geo: THREE.BufferGeometry, mat: THREE.Material, mats: THREE.Matrix4[], shell = 0.06): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.InstancedMesh(geo, mat, mats.length);
  const ink = new THREE.InstancedMesh(geo.clone().scale(1 + shell, 1 + shell, 1 + shell), inkMaterial, mats.length);
  mats.forEach((mx, i) => {
    body.setMatrixAt(i, mx);
    ink.setMatrixAt(i, mx);
  });
  body.castShadow = true;
  g.add(body, ink);
  return g;
}

/** Cypress (sarv) alternating with blossom trees, mirrored on both sides of the street. */
export function buildTrees(world: WorldConfig, span: Span, root: THREE.Group): void {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    pts.push(new THREE.Vector2(Math.sin(Math.PI * Math.pow(t, 0.7)) * 0.7 * (1 - t * 0.35), t * 5.2));
  }
  const x = (STREET.strip + STREET.walk) / 2;
  const cypress: THREE.Matrix4[] = [];
  const blossom: THREE.Matrix4[] = [];
  const trunks: THREE.Matrix4[] = [];
  let i = 0;
  for (let z = span.from - 2.5; z > span.to; z -= 5, i++) {
    for (const side of [-1, 1]) {
      if (i % 2 === 0) cypress.push(new THREE.Matrix4().makeTranslation(side * x, 0.2, z));
      else {
        blossom.push(new THREE.Matrix4().makeScale(1, 0.9, 1).setPosition(side * x, 2.4, z));
        trunks.push(new THREE.Matrix4().makeTranslation(side * x, 0.95, z));
      }
    }
  }
  root.add(inkedInstances(new THREE.LatheGeometry(pts, 10), toon(world.palette.trees[0]), cypress));
  root.add(inkedInstances(new THREE.IcosahedronGeometry(1.15, 1), toon(world.palette.trees[1]), blossom));
  const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 1.5, 6), toon(0x7a4a2c), trunks.length);
  trunks.forEach((mx, k) => trunkMesh.setMatrixAt(k, mx));
  root.add(trunkMesh);
}

/**
 * Continuous facades in a 4-building rhythm, each with a gold cornice and turquoise plinth.
 * Instanced per rhythm variant, so a 400 m street costs about a dozen draw calls.
 */
export function buildFacades(world: WorldConfig, span: Span, root: THREE.Group, heights = [7, 9.5, 7, 11.5]): void {
  const walls = world.palette.walls;
  const V = heights.length;
  const bodies: THREE.Matrix4[][] = heights.map(() => []);
  const cornices: THREE.Matrix4[] = [];
  const plinths: THREE.Matrix4[] = [];
  let k = 0;
  for (let z = span.from - BUILD_L / 2; z > span.to; z -= BUILD_L, k++) {
    const h = heights[k % V]!;
    for (const side of [-1, 1]) {
      const x = side * (STREET.build + BUILD_D / 2);
      bodies[k % V]!.push(new THREE.Matrix4().makeScale(BUILD_D, h, BUILD_L).setPosition(x, h / 2, z));
      cornices.push(new THREE.Matrix4().makeTranslation(x - side * 0.15, h + 0.17, z));
      plinths.push(new THREE.Matrix4().makeTranslation(x - side * 0.08, 0.35, z));
    }
  }
  const unit = new THREE.BoxGeometry(1, 1, 1);
  heights.forEach((h, v) => {
    const mat = toonMapped(facadeTexture(walls[v % walls.length]!, Math.max(1, Math.round(h / 4.5))));
    const g = inkedInstances(v === 0 ? unit : unit.clone(), mat, bodies[v]!, 0.012);
    g.children.forEach((c) => ((c as THREE.Mesh).receiveShadow = true));
    root.add(g);
  });
  root.add(instanced(new THREE.BoxGeometry(BUILD_D + 0.3, 0.35, BUILD_L), toon(GOLD), cornices));
  root.add(instanced(new THREE.BoxGeometry(BUILD_D + 0.16, 0.7, BUILD_L), toon(TURQUOISE), plinths));
}

/** Plain instanced mesh from a list of placements. */
export function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, mats: THREE.Matrix4[]): THREE.InstancedMesh {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, mats.length));
  mats.forEach((mx, i) => m.setMatrixAt(i, mx));
  m.count = mats.length;
  return m;
}

/** Frees per-level GPU resources; cached shared materials and geometries survive. */
export function disposeTree(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry && !mesh.userData.sharedGeometry) mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const mat of mats) {
      if (mat.userData.shared) continue;
      (mat as THREE.MeshBasicMaterial).map?.dispose();
      mat.dispose();
    }
  });
}
