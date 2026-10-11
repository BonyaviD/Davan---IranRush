/** Frame-rate independent smoothing: moves `current` toward `target` at `rate` per second. */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Crowd x is lane-relative in [-1, 1]; negative = left gate (index 0). */
export function laneIndex(x: number): 0 | 1 {
  return x < 0 ? 0 : 1;
}
