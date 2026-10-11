import type * as THREE from 'three';
import { GAME } from '../config/game.config';
import { damp } from '../core/Steering';
import type { CameraMode, CameraPose, WorldConfig } from '../core/types';

/**
 * Follows the crowd from behind and above. Each mode is a pose from config
 * (optionally overridden per world); switching modes blends smoothly.
 */
export class CameraRig {
  private readonly pose: CameraPose = { ...GAME.camera.run };
  private target: CameraPose = { ...GAME.camera.run };
  private poses: Record<CameraMode, CameraPose> = { ...GAME.camera };

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  setWorld(world: WorldConfig): void {
    const o = world.camera ?? {};
    this.poses = {
      intro: { ...GAME.camera.intro, ...o.intro },
      run: { ...GAME.camera.run, ...o.run },
      battle: { ...GAME.camera.battle, ...o.battle },
    };
  }

  setMode(mode: CameraMode, snap = false): void {
    this.target = this.poses[mode];
    if (snap) Object.assign(this.pose, this.target);
  }

  update(dt: number, crowdX: number, crowdZ: number): void {
    const p = this.pose;
    const t = this.target;
    const r = GAME.cameraLerp;
    p.height = damp(p.height, t.height, r, dt);
    p.distance = damp(p.distance, t.distance, r, dt);
    p.lookAhead = damp(p.lookAhead, t.lookAhead, r, dt);
    p.fov = damp(p.fov, t.fov, r, dt);

    const cx = crowdX * 0.6;
    this.camera.position.set(cx, p.height, crowdZ + p.distance);
    this.camera.lookAt(cx * 0.5, 0.8, crowdZ - p.lookAhead);
    if (Math.abs(this.camera.fov - p.fov) > 0.01) {
      this.camera.fov = p.fov;
      this.camera.updateProjectionMatrix();
    }
  }
}
