/**
 * Shared data contracts. Pure types only: no Phaser, no DOM.
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

export interface EnemyDef {
  z: number;
  count: number;
}

export interface LevelData {
  id: string;
  world: WorldId;
  startCount: number;
  /** Total track length; the run ends (battle) at enemy.z, length is the visual end. */
  length: number;
  segments: GateSegment[];
  obstacles?: ObstacleDef[];
  enemy: EnemyDef;
}

export type WorldId = 'bazaar' | 'isfahan' | 'tehran';

export interface ParallaxLayerDef {
  /** Asset key; placeholder textures are generated at boot under the same key. */
  key: string;
  /** 0 = static, 1 = moves with the track. */
  speed: number;
  /** Placeholder tint until real art exists. */
  color: number;
}

export interface WorldPalette {
  background: number;
  track: number;
  trackEdge: number;
  gatePositive: number;
  gateNegative: number;
  crowd: number;
  enemy: number;
}

export interface WorldConfig {
  id: WorldId;
  /** Persian display name (rendered by DOM UI only). */
  name: string;
  palette: WorldPalette;
  parallax: ParallaxLayerDef[];
  /** Obstacle kinds this world may use; used by level validation. */
  obstacleKinds: ObstacleKind[];
  night?: boolean;
}

export type RunResult = 'win' | 'lose';
