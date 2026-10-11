import type { CameraPose } from '../core/types';

/** Per-device preferences (camera choice). Non-critical: failures fall back to defaults. */
export interface CameraSettings {
  preset: string | null;
  pose: CameraPose;
  autoZoom: boolean;
}

const KEY = 'davan.camera';

export function loadCameraSettings(): CameraSettings | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CameraSettings) : null;
  } catch {
    return null;
  }
}

export function saveCameraSettings(s: CameraSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable; the choice just won't persist */
  }
}
