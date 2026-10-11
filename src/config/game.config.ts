import type { CameraMode, CameraPose } from '../core/types';

/**
 * Global tuning constants. Gameplay code reads from here; no magic numbers elsewhere.
 * Level data is authored in "track units"; the 3D world is in meters.
 */
export const GAME = {
  /** Meters per level track unit (3000 units = 75 m). */
  metersPerUnit: 0.025,
  /** Track units per second (frame-rate independent). */
  runSpeed: 420,
  roadWidth: 9,

  /** Horizontal follow smoothing (per-second rate). */
  steerLerp: 12,
  /** Seconds of cinematic intro before the run starts. */
  introSec: 2,

  /** Max rendered people per crowd, regardless of actual count. */
  maxCrowdSprites: 140,
  /** Spacing between people in the sunflower cluster (m). */
  crowdSpacing: 0.36,
  personRadius: 0.22,

  battle: {
    targetDurationSec: 2.5,
    tickSec: 0.05,
  },

  /** Camera rig. 'intro' shows the world's landmark, 'run' is the main gameplay view. */
  camera: {
    intro: { height: 2.6, distance: 7.5, lookAhead: 30, fov: 62 },
    run: { height: 3, distance: 7.5, lookAhead: 16, fov: 62 },
    battle: { height: 3.6, distance: 8.5, lookAhead: 6, fov: 58 },
  } satisfies Record<CameraMode, CameraPose>,
  /** How fast the camera blends between modes (per-second rate). */
  cameraLerp: 2.5,

  maxPixelRatio: 2,
  shadowMapSize: 1024,
} as const;

export type GameConfig = typeof GAME;
