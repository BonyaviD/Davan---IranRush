import * as THREE from 'three';
import { GAME } from '../../config/game.config';
import type { WorldConfig } from '../../core/types';
import { buildBlocks, buildRoad, buildTrees, lambert, type Span } from './common';
import { alborz, milad, siosepol, tiledDome } from './landmarks';

/**
 * Builds the static scenery for one level. Scenery is placed in world space along -z;
 * the crowd runs through it and the camera follows. Replace these placeholder builders
 * with loaded models later without touching game logic.
 */
export function buildEnvironment(world: WorldConfig, lengthUnits: number): THREE.Group {
  const root = new THREE.Group();
  const end = -lengthUnits * GAME.metersPerUnit;
  const span: Span = { from: 20, to: end - 60 };

  buildRoad(world, span, root);
  switch (world.id) {
    case 'tehran':
      buildTehran(world, span, end, root);
      break;
    case 'isfahan':
      buildIsfahan(world, span, end, root);
      break;
    case 'bazaar':
      buildBazaar(world, span, end, root);
      break;
  }
  return root;
}

function buildTehran(world: WorldConfig, span: Span, end: number, root: THREE.Group): void {
  // Jube (street water channel) between road and trees
  for (const side of [-1, 1]) {
    const jube = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, span.from - span.to), lambert(0x5d7f8a));
    jube.position.set(side * (GAME.roadWidth / 2 + 0.25), 0.02, (span.from + span.to) / 2);
    root.add(jube);
  }
  buildTrees(world, span, root, 7);
  buildBlocks(world, span, root, { every: 11, depth: 6, minH: 5, varH: 9, offset: 2.4, windows: true });
  const tower = milad();
  tower.position.set(9, 0, end - 110);
  const range = alborz();
  range.position.z = end - 270;
  root.add(tower, range);
}

function buildIsfahan(world: WorldConfig, span: Span, end: number, root: THREE.Group): void {
  buildTrees(world, span, root, 9);
  // Low arcade walls (like Chaharbagh / Naqsh-e Jahan edges)
  buildBlocks(world, span, root, { every: 6, depth: 3, minH: 4.5, varH: 0.5, offset: 2.6, windows: false });
  const arch = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.08, 2.6, 2.6),
    lambert(0x1a8f9e),
    Math.floor((span.from - span.to) / 6) * 2,
  );
  const m = new THREE.Matrix4();
  for (let i = 0; i < arch.count; i++) {
    const side = i % 2 ? 1 : -1;
    const z = span.from - Math.floor(i / 2) * 6;
    arch.setMatrixAt(i, m.makeTranslation(side * (GAME.roadWidth / 2 + 2.58), 1.6, z));
  }
  root.add(arch);
  const bridge = siosepol();
  bridge.position.z = end - 70;
  const dome = tiledDome();
  dome.position.set(-22, 0, end - 160);
  root.add(bridge, dome);
}

function buildBazaar(world: WorldConfig, span: Span, end: number, root: THREE.Group): void {
  // Shop fronts (hojreh) on both sides
  buildBlocks(world, span, root, { every: 4, depth: 3, minH: 3.6, varH: 0.6, offset: 2.4, windows: false });
  // Brick arches spanning the street, with hanging lanterns
  const every = 6;
  const n = Math.floor((span.from - span.to) / every);
  const archR = GAME.roadWidth / 2 + 2.6;
  const arches = new THREE.InstancedMesh(new THREE.TorusGeometry(archR, 0.45, 6, 18, Math.PI), lambert(0xa0603a), n);
  const lamps = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.32, 0),
    new THREE.MeshBasicMaterial({ color: 0xffc865 }),
    n,
  );
  const cords = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 4), lambert(0x3a2a20), n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const z = span.from - i * every;
    arches.setMatrixAt(i, m.makeTranslation(0, 1.2, z));
    lamps.setMatrixAt(i, m.makeTranslation(0, archR - 0.4, z));
    cords.setMatrixAt(i, m.makeTranslation(0, archR + 0.8, z));
  }
  arches.castShadow = true;
  root.add(arches, lamps, cords);
  const dome = tiledDome(0xb5774b, 0x2a9fb0);
  dome.position.set(0, 0, end - 55);
  root.add(dome);
}
