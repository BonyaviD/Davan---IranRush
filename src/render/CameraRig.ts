import type * as THREE from 'three';
import { GAME } from '../config/game.config';
import { damp } from '../core/Steering';
import type { CameraMode, CameraPose, WorldConfig } from '../core/types';

/**
 * Follows the crowd from behind and above. Each mode is a pose from config (optionally
 * overridden per world); switching modes blends smoothly. With auto-zoom on, the camera
 * pulls back as the crowd grows so the whole group stays in view.
 */
export class CameraRig {
  autoZoom = true;
  private readonly pose: CameraPose = { ...GAME.camera.run };
  private target: CameraPose = { ...GAME.camera.run };
  private mode: CameraMode = 'run';
  private poses: Record<CameraMode, CameraPose> = { ...GAME.camera };
  private runOverride: CameraPose | null = null;

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  setWorld(world: WorldConfig): void {
    const o = world.camera ?? {};
    this.poses = {
      intro: { ...GAME.camera.intro, ...o.intro },
      run: { ...GAME.camera.run, ...o.run },
      battle: { ...GAME.camera.battle, ...o.battle },
      boss: { ...GAME.camera.boss, ...o.boss },
    };
    this.applyOverride();
  }

  /** Player-chosen run pose; battle is derived from it. */
  setRunPose(pose: CameraPose): void {
    this.runOverride = { ...pose };
    this.applyOverride();
  }

  setMode(mode: CameraMode, snap = false): void {
    this.mode = mode;
    this.target = this.poses[mode];
    if (snap) Object.assign(this.pose, this.target);
  }

  update(dt: number, crowdX: number, crowdZ: number, crowdRadius: number): void {
    const p = this.pose;
    const t = this.target;
    const z = GAME.cameraCrowdZoom;
    const extra = this.autoZoom && this.mode !== 'intro' ? Math.max(0, crowdRadius - z.baseRadius) : 0;
    const r = GAME.cameraLerp;
    p.height = damp(p.height, t.height + extra * z.height, r, dt);
    p.distance = damp(p.distance, t.distance + extra * z.distance, r, dt);
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

  private applyOverride(): void {
    const run = this.runOverride;
    if (run) {
      this.poses.run = { ...run };
      this.poses.battle = { ...run, height: run.height + 0.6, distance: run.distance + 1, lookAhead: Math.min(run.lookAhead, 4) };
      this.poses.boss = { ...run, height: run.height + 1.2, distance: run.distance + 2.5, lookAhead: Math.max(run.lookAhead, 10) };
    }
    this.target = this.poses[this.mode];
  }
}
