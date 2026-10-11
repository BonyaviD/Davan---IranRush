import type { ObstacleDef } from './types';

/** Ping-pong between -1 and 1 so crossing traffic keeps sweeping the road. */
function pingPong(v: number): number {
  const t = (((v + 1) % 4) + 4) % 4; // 0..4
  return t < 2 ? t - 1 : 3 - t;
}

/** Obstacle center x (lane units) at a given time in seconds. */
export function obstacleX(o: ObstacleDef, time: number): number {
  if (o.kind !== 'crossing') return o.x;
  return pingPong(o.x + (o.speed ?? 0.5) * time);
}

/**
 * True if a crowd centered at crowdX with the given radius (both lane units) touches the
 * obstacle. Only the crowd's core counts, so brushing an edge is forgiven.
 */
export function obstacleHits(obsX: number, halfWidth: number, crowdX: number, crowdRadius: number): boolean {
  return Math.abs(crowdX - obsX) < halfWidth + crowdRadius * 0.6;
}
