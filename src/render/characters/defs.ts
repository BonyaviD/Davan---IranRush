import * as THREE from 'three';
import { GOLD } from '../style/materials';

/**
 * Characters are data. Each part is [geometry, colorRole, limb?]:
 *  - colorRole: a hex color, 'cloth' (per-person outfit tint) or 'hair' (per-person hair color)
 *  - limb: 1/2 = left/right leg, 3/4 = left/right arm; the GPU swings these while running.
 * Adding a purchasable character = adding one CharacterDef. Characters face -z.
 */
export type ColorRole = number | 'cloth' | 'hair';
export type Part = [THREE.BufferGeometry, ColorRole, number?];

export interface CharacterDef {
  id: string;
  /** Persian display name (DOM only). */
  name: string;
  desc: string;
  /** Outfit tints; omitted for fixed-look characters (enemies). */
  cloth?: number[];
  hair?: number[];
  /** Builds fresh geometry; `marker` is the team color of the ring under the feet. */
  parts: (marker: number) => Part[];
}

export const HIP = 0.46;
export const SHOULDER = 0.8;

const cyl = (rt: number, rb: number, h: number, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
const sph = (r: number, ...a: number[]) => new THREE.SphereGeometry(r, 14, 10, ...a);
const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z);
const cone = (r: number, h: number, seg = 8) => new THREE.ConeGeometry(r, h, seg);
const at = <G extends THREE.BufferGeometry>(g: G, x: number, y: number, z: number): G => g.translate(x, y, z) as G;
const lathe = (pts: [number, number][], seg = 14) =>
  new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

const DARK = 0x221510;
const SKIN_A = 0xeab894;
const SKIN_B = 0xf2c6a2;

function face(y: number, skin: number, lips: number): Part[] {
  return [
    [at(sph(0.022), -0.055, y + 0.01, -0.15), DARK],
    [at(sph(0.022), 0.055, y + 0.01, -0.15), DARK],
    [at(sph(0.008), -0.048, y + 0.02, -0.168), 0xffffff],
    [at(sph(0.008), 0.062, y + 0.02, -0.168), 0xffffff],
    [at(box(0.05, 0.012, 0.012), -0.055, y + 0.055, -0.152), 'hair'],
    [at(box(0.05, 0.012, 0.012), 0.055, y + 0.055, -0.152), 'hair'],
    [at(box(0.045, 0.012, 0.01), 0, y - 0.065, -0.155), lips],
    [at(sph(0.03).scale(1, 0.6, 0.3), -0.09, y - 0.03, -0.135), 0xf3a3a3],
    [at(sph(0.03).scale(1, 0.6, 0.3), 0.09, y - 0.03, -0.135), 0xf3a3a3],
    [at(sph(0.03), -0.165, y, 0), skin],
    [at(sph(0.03), 0.165, y, 0), skin],
  ];
}

function legs(jeans: number, shoe: number, sole: number): Part[] {
  return ([[-0.075, 1], [0.075, 2]] as const).flatMap(([x, limb]): Part[] => [
    [at(cyl(0.062, 0.055, 0.4), x, 0.26, 0), jeans, limb],
    [at(box(0.1, 0.07, 0.19), x, 0.045, -0.025), shoe, limb],
    [at(box(0.104, 0.025, 0.194), x, 0.012, -0.025), sole, limb],
  ]);
}

function arms(sleeve: ColorRole, skin: number, sleeveLen: number): Part[] {
  const fore = 0.32 - sleeveLen;
  return ([[-0.19, 3], [0.19, 4]] as const).flatMap(([x, limb]): Part[] => [
    [at(cyl(0.045, 0.042, sleeveLen), x, SHOULDER - sleeveLen / 2, 0), sleeve, limb],
    [at(cyl(0.036, 0.034, fore), x, SHOULDER - sleeveLen - fore / 2, 0), skin, limb],
    [at(sph(0.042), x, SHOULDER - 0.34, 0), skin, limb],
  ]);
}

const ring = (color: number, r = 0.24): Part => [at(cyl(r, r, 0.02, 20), 0, 0.01, 0), color];

export const ARIAN: CharacterDef = {
  id: 'arian',
  name: 'آرین',
  desc: 'هودی، جین و کتونی',
  cloth: [0xf4f4f4, 0x2e2e2e, 0x9ec5e8, 0xf0c040, 0x9cc79c, 0xe07a5a],
  hair: [0x1a1410, 0x2e1f16, 0x4a3020, 0x0f0f0f],
  parts: (marker) => [
    ring(marker),
    ...legs(0x3b5a8a, 0xf4f4f4, 0xd94a3a),
    [at(cyl(0.15, 0.155, 0.36), 0, 0.64, 0), 'cloth'],
    [at(sph(0.11, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.2, 0.8, 0.9), 0, 0.8, 0.09), 'cloth'],
    [at(box(0.16, 0.08, 0.02), 0, 0.56, -0.15), 'cloth'],
    ...arms('cloth', SKIN_A, 0.26),
    [at(cyl(0.05, 0.055, 0.08), 0, 0.84, 0), SKIN_A],
    [at(sph(0.17), 0, 1.0, 0), SKIN_A],
    [at(sph(0.178, 0, Math.PI * 2, 0, Math.PI * 0.42), 0, 1.0, 0.01), 'hair'],
    [at(sph(0.1).scale(1.4, 0.55, 0.9), 0, 1.15, -0.07), 'hair'],
    ...face(1.0, SKIN_A, 0xb4685a),
  ],
};

export const TARA: CharacterDef = {
  id: 'tara',
  name: 'تارا',
  desc: 'تی‌شرت، جین و موی بلند',
  cloth: [0xf7c6d9, 0xffffff, 0xc9b6f0, 0xf6e27a, 0x9fe0d0, 0xe85d75],
  hair: [0x1a1410, 0x3b2418, 0x6b3e22, 0x8a5a2b, 0xc89b5a, 0x4a2c4f],
  parts: (marker) => [
    ring(marker),
    ...legs(0x6f8fc0, 0xffffff, 0xf08fb0),
    [at(cyl(0.13, 0.14, 0.34), 0, 0.64, 0), 'cloth'],
    [at(cyl(0.145, 0.15, 0.06), 0, 0.48, 0), 0x6f8fc0],
    ...arms('cloth', SKIN_B, 0.1),
    [at(cyl(0.045, 0.05, 0.08), 0, 0.84, 0), SKIN_B],
    [at(sph(0.165), 0, 0.99, 0), SKIN_B],
    [at(sph(0.178, 0, Math.PI * 2, 0, Math.PI * 0.5), 0, 0.995, 0.012), 'hair'],
    [at(cyl(0.15, 0.11, 0.42).scale(1, 1, 0.55), 0, 0.82, 0.07), 'hair'],
    [at(sph(0.11).scale(1.45, 0.45, 0.7), -0.02, 1.08, -0.11), 'hair'],
    ...face(0.99, SKIN_B, 0xd9606f),
  ],
};

/** Playable characters, mixed in the player's crowd. */
export const PLAYER_CHARACTERS: CharacterDef[] = [ARIAN, TARA];

function divParts(marker: number, body: number, belly: number, limbs: number, horn: number): Part[] {
  return [
    [at(cyl(0.07, 0.06, 0.3), -0.1, 0.15, 0), limbs, 1],
    [at(cyl(0.07, 0.06, 0.3), 0.1, 0.15, 0), limbs, 2],
    [at(sph(0.27).scale(1, 1.1, 0.95), 0, 0.58, 0), body],
    [at(sph(0.2).scale(1, 0.9, 0.5), 0, 0.55, -0.14), belly],
    [at(cyl(0.055, 0.05, 0.36), -0.3, 0.6, 0), body, 3],
    [at(cyl(0.055, 0.05, 0.36), 0.3, 0.6, 0), body, 4],
    [at(cone(0.05, 0.22).rotateZ(0.5), -0.15, 0.97, 0), horn],
    [at(cone(0.05, 0.22).rotateZ(-0.5), 0.15, 0.97, 0), horn],
    [at(sph(0.06), -0.09, 0.72, -0.22), 0xfff3b0],
    [at(sph(0.06), 0.09, 0.72, -0.22), 0xfff3b0],
    [at(sph(0.028), -0.09, 0.72, -0.27), DARK],
    [at(sph(0.028), 0.09, 0.72, -0.27), DARK],
    [at(box(0.16, 0.035, 0.03).rotateZ(0.25), -0.09, 0.81, -0.22), 0x3a1a40],
    [at(box(0.16, 0.035, 0.03).rotateZ(-0.25), 0.09, 0.81, -0.22), 0x3a1a40],
    [at(cone(0.025, 0.08, 6).rotateX(Math.PI), -0.07, 0.56, -0.25), 0xffffff],
    [at(cone(0.025, 0.08, 6).rotateX(Math.PI), 0.07, 0.56, -0.25), 0xffffff],
    ring(marker, 0.3),
  ];
}

/** Regular enemy: the little horned div of the Shahnameh. One fixed look for all. */
export const DIV: CharacterDef = {
  id: 'div',
  name: 'دیو',
  desc: 'دشمن: همه یک شکل',
  parts: (marker) => divParts(marker, 0x7d3b8f, 0xb27cc4, 0x5e2a6e, 0xf3e3c3),
};

/** Boss: Div-e Sepid (the White Div), a giant version of the div. */
export const DIV_SEPID: CharacterDef = {
  id: 'div-sepid',
  name: 'دیو سپید',
  desc: 'غول آخر بازار و اصفهان',
  parts: (marker) => divParts(marker, 0xf2efe6, 0xd8d2c4, 0xcfc8b8, GOLD),
};

function snake(side: number, limb: number): Part[] {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.2, 0.95, 0.04),
    new THREE.Vector3(side * 0.36, 1.12, 0.08),
    new THREE.Vector3(side * 0.46, 1.3, -0.02),
    new THREE.Vector3(side * 0.4, 1.45, -0.16),
  ]);
  const hx = side * 0.39;
  return [
    [new THREE.TubeGeometry(curve, 16, 0.045, 7, false), 0x3f8a3a, limb],
    [at(sph(0.075).scale(1, 0.75, 1.4), hx, 1.48, -0.22), 0x2f6e2c, limb],
    [at(sph(0.018), hx - 0.035, 1.52, -0.3), 0xffd23a, limb],
    [at(sph(0.018), hx + 0.035, 1.52, -0.3), 0xffd23a, limb],
    [at(box(0.012, 0.01, 0.08), hx, 1.46, -0.35), 0xd23a3a, limb],
  ];
}

/** Boss: Zahhak, the serpent-shouldered king. The snakes sway on the arm channels. */
export const ZAHHAK: CharacterDef = {
  id: 'zahhak',
  name: 'ضحاک',
  desc: 'غول آخر تهران: شاه ماردوش',
  parts: (marker) => [
    ring(marker, 0.42),
    [lathe([[0.34, 0], [0.3, 0.4], [0.24, 0.8], [0.2, 0.96], [0.001, 0.98]]), 0x6e1f2a],
    [at(new THREE.TorusGeometry(0.255, 0.035, 6, 18).rotateX(Math.PI / 2), 0, 0.56, 0), GOLD],
    [at(cyl(0.06, 0.055, 0.42), -0.26, 0.7, 0), 0x6e1f2a],
    [at(cyl(0.06, 0.055, 0.42), 0.26, 0.7, 0), 0x6e1f2a],
    [at(sph(0.05), -0.26, 0.47, 0), 0xd9a77c],
    [at(sph(0.05), 0.26, 0.47, 0), 0xd9a77c],
    [at(cyl(0.06, 0.06, 0.08), 0, 1.0, 0), 0xd9a77c],
    [at(sph(0.16), 0, 1.12, 0), 0xd9a77c],
    [at(cone(0.11, 0.3, 9).rotateX(Math.PI), 0, 0.96, -0.08), 0x16100c],
    [at(box(0.16, 0.035, 0.04), 0, 1.06, -0.15), 0x16100c],
    [at(sph(0.022), -0.055, 1.14, -0.145), 0x16100c],
    [at(sph(0.022), 0.055, 1.14, -0.145), 0x16100c],
    [at(box(0.06, 0.015, 0.015).rotateZ(-0.4), -0.055, 1.18, -0.15), 0x16100c],
    [at(box(0.06, 0.015, 0.015).rotateZ(0.4), 0.055, 1.18, -0.15), 0x16100c],
    [at(cyl(0.17, 0.16, 0.12, 16), 0, 1.3, 0), GOLD],
    ...[0, 1, 2, 3, 4, 5].map((k): Part => {
      const a = (k / 6) * Math.PI * 2;
      return [at(cone(0.035, 0.12, 6), Math.sin(a) * 0.155, 1.41, Math.cos(a) * 0.155), GOLD];
    }),
    [at(sph(0.03), 0, 1.3, -0.165), 0xd23a3a],
    ...snake(-1, 3),
    ...snake(1, 4),
  ],
};

export const BOSSES = { zahhak: ZAHHAK, 'div-sepid': DIV_SEPID } as const;
