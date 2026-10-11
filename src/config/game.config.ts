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
  crowdSpacing: 0.42,
  enemySpacing: 0.5,
  personRadius: 0.24,
  /** Boss size multiplier and contact radius (m). */
  bossScale: 2.6,
  bossRadius: 1.1,
  /** Seconds the crowd pauses after beating a regular enemy group. */
  afterFightPause: 0.35,

  battle: {
    targetDurationSec: 2.5,
    tickSec: 0.05,
  },

  /**
   * Camera rig. 'intro' shows the world's landmark, 'run' is the gameplay view and
   * 'battle' is derived from 'run'. The player can pick any preset in the camera panel.
   */
  camera: {
    intro: { height: 2.6, distance: 7.5, lookAhead: 30, fov: 62 },
    run: { height: 4, distance: 8, lookAhead: 8, fov: 60 },
    battle: { height: 4.6, distance: 9, lookAhead: 4, fov: 58 },
    boss: { height: 5.2, distance: 10.5, lookAhead: 10, fov: 60 },
  } satisfies Record<CameraMode, CameraPose>,
  /** Selectable run-camera presets (keys are shown as Persian letters in the UI). */
  cameraPresets: {
    a: { height: 4, distance: 8, lookAhead: 8, fov: 60 },
    b: { height: 10, distance: 13, lookAhead: 4, fov: 55 },
    c: { height: 19, distance: 11, lookAhead: 2, fov: 50 },
    d: { height: 2.6, distance: 7.5, lookAhead: 30, fov: 62 },
    e: { height: 3, distance: 7.5, lookAhead: 16, fov: 62 },
  } satisfies Record<string, CameraPose>,
  /** Auto-zoom: extra meters of height/distance per meter of crowd radius beyond the base size. */
  cameraCrowdZoom: { baseRadius: 1.5, height: 0.9, distance: 1.3 },
  /** How fast the camera blends between modes (per-second rate). */
  cameraLerp: 2.5,

  maxPixelRatio: 2,
  shadowMapSize: 1024,
} as const;

export type GameConfig = typeof GAME;
