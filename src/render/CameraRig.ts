import type * as THREE from 'three';
import { GAME } from '../config/game.config';
import { damp } from '../core/Steering';
import type { CameraMode, CameraPose, WorldConfig } from '../core/types';

/**
 * Follows the crowd from behind and above. Each mode is a pose from config (optionally
 * overridden per world); switching modes blends smoothly. The camera always pulls back as
 * the crowd grows so the whole group stays in view.
 */
export class CameraRig {
  private readonly pose: CameraPose = { ...GAME.camera.run };
  private target: CameraPose = { ...GAME.camera.run };
  private mode: CameraMode = 'run';
  private poses: Record<CameraMode, CameraPose> = { ...GAME.camera };
  private shake = 0;

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  setWorld(world: WorldConfig): void {
    const o = world.camera ?? {};
    this.poses = {
      intro: { ...GAME.camera.intro, ...o.intro },
      run: { ...GAME.camera.run, ...o.run },
      battle: { ...GAME.camera.battle, ...o.battle },
      boss: { ...GAME.camera.boss, ...o.boss },
    };
    this.target = this.poses[this.mode];
  }

  setMode(mode: CameraMode, snap = false): void {
    this.mode = mode;
    this.target = this.poses[mode];
    if (snap) Object.assign(this.pose, this.target);
  }

  /** Adds screen shake (meters of jitter), decaying quickly. */
  addShake(amount: number): void {
    this.shake = Math.min(0.5, this.shake + amount);
  }

  update(dt: number, crowdX: number, crowdZ: number, crowdRadius: number): void {
    const p = this.pose;
    const t = this.target;
    const z = GAME.cameraCrowdZoom;
    const extra = this.mode !== 'intro' ? Math.max(0, crowdRadius - z.baseRadius) : 0;
    const r = GAME.cameraLerp;
    p.height = damp(p.height, t.height + extra * z.height, r, dt);
    p.distance = damp(p.distance, t.distance + extra * z.distance, r, dt);
    p.lookAhead = damp(p.lookAhead, t.lookAhead, r, dt);
    p.fov = damp(p.fov, t.fov, r, dt);

    const cx = crowdX * 0.6;
    this.shake *= Math.exp(-6 * dt);
    const jx = (Math.random() - 0.5) * this.shake;
    const jy = (Math.random() - 0.5) * this.shake;
    this.camera.position.set(cx + jx, p.height + jy, crowdZ + p.distance);
    this.camera.lookAt(cx * 0.5, 0.8, crowdZ - p.lookAhead);
    if (Math.abs(this.camera.fov - p.fov) > 0.01) {
      this.camera.fov = p.fov;
      this.camera.updateProjectionMatrix();
    }
  }
}
