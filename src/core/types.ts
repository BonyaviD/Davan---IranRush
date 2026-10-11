/**
 * Shared data contracts. Pure types only: no engine, no DOM.
 * Distances are in "track units" (z), measured from the start line upward.
 */

export type GateOp = 'add' | 'sub' | 'mul' | 'div';

export interface GateDef {
  op: GateOp;
  value: number;
  /** Mystery gate: shows "؟" until the crowd is close. */
  hidden?: boolean;
}

/** A pair of gates side by side at the same z. Index 0 = left lane, 1 = right lane. */
export interface GateSegment {
  z: number;
  gates: [GateDef, GateDef];
}

export type ObstacleKind = 'static' | 'crossing';

/** Something on the road that knocks people out of the crowd on contact. */
export interface ObstacleDef {
  z: number;
  kind: ObstacleKind;
  /** Lane-relative x in [-1, 1] (0 = center). For 'crossing' this is the start x. */
  x: number;
  /** Half-width in lane units (1 = half the road). */
  halfWidth: number;
  /** People lost on contact. */
  damage: number;
  /** Lateral speed in lane units per second, for 'crossing' obstacles. */
  speed?: number;
  /** Visual: taxi, motorbike, cart, fountain... */
  look: ObstacleLook;
}

export type ObstacleLook = 'taxi' | 'motor' | 'cart' | 'urn';

/** A group of regular enemies (divs) standing on the path. */
export interface EnemyDef {
  z: number;
  count: number;
}

export type BossKind = 'zahhak' | 'div-sepid' | 'akvan';

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
