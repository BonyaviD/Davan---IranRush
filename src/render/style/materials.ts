import * as THREE from 'three';

/** Fixed colors of the miniature-painting look, shared by every world. */
export const INK = 0x3b2416;
export const GOLD = 0xe2b04a;
export const TURQUOISE = 0x1fa3a8;
export const LAPIS = 0x2a5aa8;
export const CREAM = 0xf3e3c3;

let ramp: THREE.DataTexture | null = null;
/** Three-step light ramp: the flat, painted shading of a miniature. */
export function toonRamp(): THREE.DataTexture {
  if (!ramp) {
    ramp = new THREE.DataTexture(new Uint8Array([120, 190, 255]), 3, 1, THREE.RedFormat);
    ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
    ramp.needsUpdate = true;
  }
  return ramp;
}

const cache = new Map<number, THREE.MeshToonMaterial>();
/** Cached toon material per color (never disposed with a level). */
export function toon(color: number): THREE.MeshToonMaterial {
  let m = cache.get(color);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: toonRamp() });
    m.userData.shared = true;
    cache.set(color, m);
  }
  return m;
}

/** Toon material with a painted texture (owned by the level, disposed with it). */
export function toonMapped(map: THREE.Texture, color = 0xffffff): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, map, gradientMap: toonRamp() });
}

export const inkMaterial = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
inkMaterial.userData.shared = true;

/** Adds an ink outline (qalam-giri): an inflated back-face shell sharing the mesh's geometry. */
export function inked<T extends THREE.Mesh>(mesh: T, thickness = 0.05): T {
  const shell = new THREE.Mesh(mesh.geometry, inkMaterial);
  shell.scale.setScalar(1 + thickness);
  shell.userData.sharedGeometry = true;
  mesh.add(shell);
  return mesh;
}
