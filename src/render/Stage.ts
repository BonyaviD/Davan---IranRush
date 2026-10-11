import * as THREE from 'three';
import { GAME } from '../config/game.config';

/** Owns the WebGL renderer, scene, lights and resize handling. */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(60, 1, 0.1, 900);
  private readonly sun = new THREE.DirectionalLight(0xffe2b8, 0.95);
  private readonly hemi = new THREE.HemisphereLight(0xfff1dc, 0x6b5440, 0.8);

  constructor(private readonly host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GAME.maxPixelRatio));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    host.appendChild(this.renderer.domElement);

    const s = this.sun.shadow;
    s.mapSize.set(GAME.shadowMapSize, GAME.shadowMapSize);
    Object.assign(s.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 70 });
    this.sun.castShadow = true;
    this.scene.add(this.hemi, this.sun, this.sun.target);

    window.addEventListener('resize', this.resize);
    this.resize();
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  setAtmosphere(sky: number, fogNear: number, fogFar: number): void {
    this.scene.background = new THREE.Color(sky);
    this.scene.fog = new THREE.Fog(sky, fogNear, fogFar);
  }

  /** Keeps the shadow-casting light centered on the action. */
  followLight(x: number, z: number): void {
    this.sun.position.set(x - 12, 25, z + 10);
    this.sun.target.position.set(x, 0, z - 4);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private readonly resize = (): void => {
    const w = this.host.clientWidth || window.innerWidth;
    const h = this.host.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };
}
