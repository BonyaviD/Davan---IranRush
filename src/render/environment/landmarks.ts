import * as THREE from 'three';
import { lambert } from './common';

/** برج میلاد: tapering shaft, layered pod, antenna. */
export function milad(): THREE.Group {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 3.2, 70, 8), lambert(0xd9d4cc));
  shaft.position.y = 35;
  g.add(shaft);
  for (const [r, h, y] of [
    [5.2, 2.2, 68],
    [6.2, 3, 71.5],
    [5.6, 2.4, 75],
    [3.6, 1.6, 77.5],
  ] as const) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, h, 16), lambert(0x8d9aa6));
    ring.position.y = y;
    g.add(ring);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.7, 34, 6), lambert(0xe8e3db));
  mast.position.y = 96;
  g.add(mast);
  return g;
}

/** البرز: a ridge of snow-capped peaks. */
export function alborz(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const h = 45 + ((i * 53) % 40);
    const r = 40 + ((i * 29) % 25);
    const x = -260 + i * 40;
    const z = -((i * 17) % 50);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), lambert(0x9b8670));
    peak.position.set(x, h / 2 - 2, z);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.32, h * 0.32, 5), lambert(0xf5f1ea));
    cap.position.set(x, h - 2 - h * 0.16, z);
    g.add(peak, cap);
  }
  return g;
}

/** سی‌وسه‌پل: two-tier arcade bridge seen side-on across the horizon. */
export function siosepol(): THREE.Group {
  const g = new THREE.Group();
  const brick = lambert(0xc99a62);
  const span = 120;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(span, 2.2, 8), brick);
  deck.position.y = 11;
  g.add(deck);
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(span, 1.6, 8), lambert(0xd8b07a));
  parapet.position.y = 16;
  g.add(parapet);
  const lower = new THREE.BoxGeometry(2.4, 10, 8);
  const upper = new THREE.BoxGeometry(1.2, 3.6, 8);
  for (let i = 0; i <= 33; i++) {
    const x = -span / 2 + (i * span) / 33;
    const p = new THREE.Mesh(lower, brick);
    p.position.set(x, 5, 0);
    const q = new THREE.Mesh(upper, brick);
    q.position.set(x, 13.9, 0);
    g.add(p, q);
  }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 40), lambert(0x6fa8b8));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.05;
  g.add(water);
  return g;
}

/** Turquoise tiled dome with two minarets (نقش جهان vibe). */
export function tiledDome(base = 0xd8c39b, dome = 0x1fa3b3): THREE.Group {
  const g = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 10, 16), lambert(base));
  drum.position.y = 5;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(9.5, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), lambert(dome));
  cap.position.y = 10;
  cap.scale.y = 1.25;
  g.add(drum, cap);
  for (const x of [-14, 14]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 32, 10), lambert(base));
    m.position.set(x, 16, 0);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3, 10), lambert(dome));
    top.position.set(x, 33.5, 0);
    g.add(m, top);
  }
  return g;
}
