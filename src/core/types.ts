/**
 * Shared data contracts. Pure types only: no engine, no DOM.
 * Distances are in "track units" (z), measured from the start line upward.
 */

export type GateOp = 'add' | 'sub' | 'mul' | 'div';

export interface GateDef {
  op: GateOp;
  value: number;
}

/** A pair of gates side by side at the same z. Index 0 = left lane, 1 = right lane. */
export interface GateSegment {
  z: number;
  gates: [GateDef, GateDef];
}

export type ObstacleKind = 'static' | 'crossing';

export interface ObstacleDef {
  z: number;
  kind: ObstacleKind;
  /** Lane-relative x in [-1, 1] (0 = center). For 'crossing' this is the start x. */
  x: number;
  /** Width as a fraction of track width. */
  width: number;
  /** People lost on contact. */
  damage: number;
  /** Lateral speed (track widths / sec) for 'crossing' obstacles. */
  speed?: number;
}

/** A group of regular enemies (divs) standing on the path. */
export interface EnemyDef {
  z: number;
  count: number;
}

export type BossKind = 'zahhak' | 'div-sepid';

/** The giant at the end of every path. hp works like an enemy count. */
export interface BossDef {
  z: number;
  hp: number;
  kind: BossKind;
}

export interface LevelData {
  id: string;
  world: WorldId;
  startCount: number;
  /** Total track length (scenery extends a bit beyond it). */
  length: number;
  segments: GateSegment[];
  obstacles?: ObstacleDef[];
  /** Enemy groups along the path, ascending z, all before the boss. */
  enemies: EnemyDef[];
  boss: BossDef;
}

export type WorldId = 'bazaar' | 'isfahan' | 'tehran';

export type LandmarkId = 'bazaar-dome' | 'siosepol' | 'milad';

/** Miniature-painting palette for one world. */
export interface WorldPalette {
  skyTop: number;
  skyHorizon: number;
  ground: number;
  road: number;
  roadLine: number;
  gatePositive: number;
  gateNegative: number;
  /** Facade wall colors, used in a repeating rhythm. */
  walls: number[];
  /** Three mountain ridges, back to front. */
  ridges: [number, number, number];
  /** Tree crowns: [cypress, blossom]. */
  trees: [number, number];
}

/** Camera placement relative to the crowd (meters / degrees). */
export interface CameraPose {
  height: number;
  distance: number;
  lookAhead: number;
  fov: number;
}

export interface WorldConfig {
  id: WorldId;
  /** Persian display name (rendered by DOM UI only). */
  name: string;
  palette: WorldPalette;
  landmark: LandmarkId;
  /** Fog distances in meters (near, far). */
  fog: [number, number];
  /** Obstacle kinds this world may use; used by level validation. */
  obstacleKinds: ObstacleKind[];
  /** Optional per-world camera overrides. */
  camera?: Partial<Record<CameraMode, Partial<CameraPose>>>;
  night?: boolean;
}

export type CameraMode = 'intro' | 'run' | 'battle' | 'boss';

export type RunResult = 'win' | 'lose';
