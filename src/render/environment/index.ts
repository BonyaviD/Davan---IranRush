import * as THREE from 'three';
import { GAME } from '../../config/game.config';
import type { WorldConfig } from '../../core/types';
import { GOLD, toon } from '../style/materials';
import { STREET, buildFacades, buildSky, buildStreet, buildTrees, inkedInstances, instanced, type Span } from './kit';
import { milad, siosepol, tiledDome } from './landmarks';

/**
 * Builds the static scenery for one level in the miniature-painting style. Scenery sits in
 * world space along -z; the crowd runs through it and the camera follows. Real models can
 * replace these builders later without touching game logic.
 */
export function buildEnvironment(world: WorldConfig, lengthUnits: number): THREE.Group {
  const root = new THREE.Group();
  const end = -lengthUnits * GAME.metersPerUnit;
  const span: Span = { from: 25, to: end - 40 };

  buildSky(world, span, end, root);
  buildStreet(world, span, root);
  buildTrees(world, span, root);

  switch (world.id) {
    case 'tehran': {
      buildFacades(world, span, root);
      const tower = milad();
      tower.position.set(9, 0, end - 110);
      root.add(tower);
      break;
    }
    case 'isfahan': {
      buildFacades(world, span, root, [6, 6.5, 6, 7]);
      const bridge = siosepol();
      bridge.position.z = end - 80;
      const dome = tiledDome();
      dome.position.set(-24, 0, end - 160);
      root.add(bridge, dome);
      break;
    }
    case 'bazaar': {
      buildFacades(world, span, root, [5, 5.5, 5, 6]);
      buildBazaarArches(span, root);
      const dome = tiledDome(0xc98f5e);
      dome.position.set(0, 0, end - 70);
      root.add(dome);
      break;
    }
  }
  return root;
}

/** Brick arches spanning the bazaar street every 6 m, each with a hanging lantern (instanced). */
function buildBazaarArches(span: Span, root: THREE.Group): void {
  const r = STREET.build;
  const arches: THREE.Matrix4[] = [];
  const lamps: THREE.Matrix4[] = [];
  const cords: THREE.Matrix4[] = [];
  for (let z = span.from - 3; z > span.to; z -= 6) {
    arches.push(new THREE.Matrix4().makeTranslation(0, 4.6, z));
    lamps.push(new THREE.Matrix4().makeTranslation(0, 4.6 + r - 1.9, z));
    cords.push(new THREE.Matrix4().makeTranslation(0, 4.6 + r - 1.0, z));
  }
  root.add(inkedInstances(new THREE.TorusGeometry(r, 0.4, 6, 24, Math.PI), toon(0xa0603a), arches, 0.03));
  root.add(instanced(new THREE.OctahedronGeometry(0.32, 0), new THREE.MeshBasicMaterial({ color: 0xffc865 }), lamps));
  root.add(instanced(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 4), toon(0x3a2a20), cords));
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, span.from - span.to), toon(GOLD));
  lintel.position.set(0, 4.6 + r + 0.35, (span.from + span.to) / 2);
  root.add(lintel);
}
