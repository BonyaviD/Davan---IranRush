import * as THREE from 'three';
import { CREAM, GOLD, TURQUOISE, inked, toon } from '../style/materials';

const mesh = (geo: THREE.BufferGeometry, color: number, ink = 0.03) => inked(new THREE.Mesh(geo, toon(color)), ink);

/** برج میلاد in painted turquoise and gold. */
export function milad(): THREE.Group {
  const g = new THREE.Group();
  const shaft = mesh(new THREE.CylinderGeometry(1.1, 3.2, 70, 10), CREAM, 0.02);
  shaft.position.y = 35;
  g.add(shaft);
  for (const [r, h, y, col] of [
    [5.2, 2.2, 68, TURQUOISE],
    [6.2, 3, 71.5, GOLD],
    [5.6, 2.4, 75, TURQUOISE],
    [3.6, 1.6, 77.5, GOLD],
  ] as const) {
    const ring = mesh(new THREE.CylinderGeometry(r, r * 0.92, h, 18), col, 0.04);
    ring.position.y = y;
    g.add(ring);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.7, 34, 6), toon(CREAM));
  mast.position.y = 96;
  g.add(mast);
  return g;
}

/** سی‌وسه‌پل: two-tier arcade bridge seen side-on, over the Zayandeh-rud. */
export function siosepol(): THREE.Group {
  const g = new THREE.Group();
  const span = 120;
  const deck = mesh(new THREE.BoxGeometry(span, 2.2, 8), 0xc99a62, 0.01);
  deck.position.y = 11;
  const parapet = mesh(new THREE.BoxGeometry(span, 1.6, 8), 0xd8b07a, 0.01);
  parapet.position.y = 16;
  g.add(deck, parapet);
  const lower = new THREE.BoxGeometry(2.4, 10, 8);
  const upper = new THREE.BoxGeometry(1.2, 3.6, 8);
  for (let i = 0; i <= 33; i++) {
    const x = -span / 2 + (i * span) / 33;
    const p = new THREE.Mesh(lower, toon(0xc99a62));
    p.position.set(x, 5, 0);
    const q = new THREE.Mesh(upper, toon(0xc99a62));
    q.position.set(x, 13.9, 0);
    g.add(p, q);
  }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 40), toon(0x5fb4c4));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.05;
  g.add(water);
  return g;
}

/** Turquoise tiled dome with two minarets. */
export function tiledDome(base = 0xe6d2a6, dome = TURQUOISE): THREE.Group {
  const g = new THREE.Group();
  const drum = mesh(new THREE.CylinderGeometry(9, 9, 10, 16), base, 0.015);
  drum.position.y = 5;
  const cap = mesh(new THREE.SphereGeometry(9.5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), dome, 0.02);
  cap.position.y = 10;
  cap.scale.y = 1.25;
  g.add(drum, cap);
  for (const x of [-14, 14]) {
    const m = mesh(new THREE.CylinderGeometry(0.9, 1.1, 32, 10), base, 0.04);
    m.position.set(x, 16, 0);
    const top = mesh(new THREE.ConeGeometry(1.4, 3, 10), GOLD, 0.06);
    top.position.set(x, 33.5, 0);
    g.add(m, top);
  }
  return g;
}
