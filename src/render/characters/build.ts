import * as THREE from 'three';
import { INK, toonRamp } from '../style/materials';
import { HIP, SHOULDER, type CharacterDef } from './defs';

/** Merges a character's tagged parts into one geometry (color, cloth/hair masks, limb ids). */
function buildGeometry(def: CharacterDef, marker: number): THREE.BufferGeometry {
  const parts = def.parts(marker).map(([g, role, limb = 0]) => {
    const ig = g.index ? g : g.setIndex([...Array(g.attributes.position!.count).keys()]);
    return { g: ig, role, limb };
  });
  let vCount = 0;
  let iCount = 0;
  for (const { g } of parts) {
    vCount += g.attributes.position!.count;
    iCount += g.index!.count;
  }
  const pos = new Float32Array(vCount * 3);
  const nrm = new Float32Array(vCount * 3);
  const col = new Float32Array(vCount * 3);
  const cloth = new Float32Array(vCount);
  const hair = new Float32Array(vCount);
  const limbs = new Float32Array(vCount);
  const index = new Uint32Array(iCount);
  const c = new THREE.Color();
  let vo = 0;
  let io = 0;
  for (const { g, role, limb } of parts) {
    const n = g.attributes.position!.count;
    pos.set(g.attributes.position!.array as Float32Array, vo * 3);
    nrm.set(g.attributes.normal!.array as Float32Array, vo * 3);
    c.setHex(typeof role === 'number' ? role : 0xffffff);
    for (let i = 0; i < n; i++) {
      col[(vo + i) * 3] = c.r;
      col[(vo + i) * 3 + 1] = c.g;
      col[(vo + i) * 3 + 2] = c.b;
      cloth[vo + i] = role === 'cloth' ? 1 : 0;
      hair[vo + i] = role === 'hair' ? 1 : 0;
      limbs[vo + i] = limb;
    }
    const idx = g.index!.array;
    for (let i = 0; i < idx.length; i++) index[io + i] = idx[i]! + vo;
    vo += n;
    io += idx.length;
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('clothMask', new THREE.BufferAttribute(cloth, 1));
  geo.setAttribute('hairMask', new THREE.BufferAttribute(hair, 1));
  geo.setAttribute('limb', new THREE.BufferAttribute(limbs, 1));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeBoundingSphere();
  return geo;
}

const geoCache = new Map<string, THREE.BufferGeometry>();
/** Base geometry per (character, marker color); clone it before adding instanced attributes. */
export function characterGeometry(def: CharacterDef, marker: number): THREE.BufferGeometry {
  const key = `${def.id}:${marker}`;
  let g = geoCache.get(key);
  if (!g) {
    g = buildGeometry(def, marker);
    geoCache.set(key, g);
  }
  return g;
}

/** Shared clock for every character shader. */
export const characterTime = { value: 0 };

const LIMB_GLSL = `
  float ph = instanceMatrix[3].x * 2.7 + instanceMatrix[3].z * 1.9;
  float sw = sin(uTime * 11.0 + ph) * uRun;
  if (limb > 0.5) {
    float side = (limb < 1.5 || (limb > 2.5 && limb < 3.5)) ? 1.0 : -1.0;
    float isArm = step(2.5, limb);
    float ang = sw * mix(0.75, -0.9, isArm) * side;
    float py = mix(${HIP.toFixed(2)}, ${SHOULDER.toFixed(2)}, isArm);
    float cs = cos(ang);
    float sn = sin(ang);
    vec2 yz = transformed.yz - vec2(py, 0.0);
    transformed.yz = vec2(cs * yz.x - sn * yz.y, sn * yz.x + cs * yz.y) + vec2(py, 0.0);
  }`;

export interface CharacterMaterials {
  body: THREE.MeshToonMaterial;
  ink: THREE.MeshBasicMaterial;
  /** Limb swing amplitude: ~1 running, small for idle sway. */
  run: { value: number };
}

/** Toon body + ink shell. Per-instance color tints only cloth parts; hairColor tints hair. */
export function characterMaterials(run: number): CharacterMaterials {
  const uRun = { value: run };
  const body = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp() });
  body.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = characterTime;
    sh.uniforms.uRun = uRun;
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uTime;\nuniform float uRun;\nattribute float clothMask;\nattribute float hairMask;\nattribute float limb;\nattribute vec3 hairColor;',
      )
      // Keep three's own color setup (vColor may be vec3 or vec4), then override the rgb.
      .replace(
        '#include <color_vertex>',
        `#include <color_vertex>
        vColor.xyz = color.xyz;
        #ifdef USE_INSTANCING_COLOR
          vColor.xyz = mix(vColor.xyz, vColor.xyz * instanceColor.xyz, clothMask);
        #endif
        vColor.xyz = mix(vColor.xyz, hairColor, hairMask);`,
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + LIMB_GLSL);
  };
  const ink = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  ink.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = characterTime;
    sh.uniforms.uRun = uRun;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uRun;\nattribute float limb;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normal * 0.018;\n' + LIMB_GLSL);
  };
  return { body, ink, run: uRun };
}
