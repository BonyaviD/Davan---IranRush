/**
 * Global tuning constants. Gameplay code reads from here; no magic numbers in scenes.
 * Design resolution is 9:16 portrait; Phaser Scale.FIT letterboxes on other ratios.
 */
export const GAME = {
  width: 720,
  height: 1280,

  /** Track units per second (frame-rate independent). */
  runSpeed: 420,
  /** Track width in pixels at design resolution. */
  trackWidth: 520,
  /** Screen Y where the crowd's center sits. */
  crowdScreenY: 1000,

  /** Horizontal follow smoothing (per-second lerp rate). */
  steerLerp: 12,

  /** Max rendered crowd sprites, regardless of actual count. */
  maxCrowdSprites: 140,
  /** Spacing between people in the sunflower cluster (px). */
  crowdSpacing: 9,
  personRadius: 7,

  battle: {
    targetDurationSec: 2.5,
    tickSec: 0.05,
  },
} as const;

export type GameConfig = typeof GAME;
