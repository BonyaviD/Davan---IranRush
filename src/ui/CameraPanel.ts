import { GAME } from '../config/game.config';
import type { CameraPose } from '../core/types';
import { loadCameraSettings, saveCameraSettings, type CameraSettings } from '../services/Settings';
import { el, uiRoot } from './dom';
import { toFaDigits } from './digits';

type PresetKey = keyof typeof GAME.cameraPresets;

const PRESET_LABELS: Record<PresetKey, [string, string]> = {
  a: ['الف', 'نزدیک و پایین'],
  b: ['ب', 'کلاسیک'],
  c: ['ج', 'بالا و باز'],
  d: ['د', 'سینمایی'],
  e: ['هـ', 'الف + برج'],
};

const SLIDERS: { key: keyof CameraPose; label: string; min: number; max: number; step: number }[] = [
  { key: 'height', label: 'ارتفاع', min: 1.5, max: 25, step: 0.1 },
  { key: 'distance', label: 'فاصله', min: 3, max: 25, step: 0.1 },
  { key: 'lookAhead', label: 'نگاه جلو', min: 0, max: 40, step: 0.5 },
  { key: 'fov', label: 'میدان دید', min: 30, max: 80, step: 1 },
];

export interface CameraPanelHandlers {
  onPose: (pose: CameraPose) => void;
  onAutoZoom: (on: boolean) => void;
}

/** Camera picker: a toggle button plus a bottom sheet with presets, sliders and auto-zoom. */
export class CameraPanel {
  private readonly sheet = el('div', 'cam-sheet interactive');
  private readonly buttons = new Map<PresetKey, HTMLButtonElement>();
  private readonly inputs = new Map<keyof CameraPose, [HTMLInputElement, HTMLOutputElement]>();
  private readonly readout = el('div', 'cam-readout');
  private readonly zoomBox = document.createElement('input');
  private settings: CameraSettings;

  constructor(private readonly handlers: CameraPanelHandlers) {
    this.settings = loadCameraSettings() ?? { preset: 'a', pose: { ...GAME.cameraPresets.a }, autoZoom: true };

    const toggle = el('button', 'cam-toggle interactive', 'دوربین');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
      this.sheet.hidden = !this.sheet.hidden;
      toggle.setAttribute('aria-expanded', String(!this.sheet.hidden));
    });

    const presets = el('div', 'cam-presets');
    (Object.keys(GAME.cameraPresets) as PresetKey[]).forEach((k) => {
      const [letter, hint] = PRESET_LABELS[k];
      const b = el('button', 'cam-preset');
      b.append(el('b', '', letter), el('span', '', hint));
      b.addEventListener('click', () => this.apply({ ...GAME.cameraPresets[k] }, k));
      this.buttons.set(k, b);
      presets.append(b);
    });

    const sliders = el('div', 'cam-sliders');
    for (const s of SLIDERS) {
      const row = el('label', 'cam-row');
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', min: String(s.min), max: String(s.max), step: String(s.step) });
      input.id = `cam-${s.key}`;
      const out = document.createElement('output');
      input.addEventListener('input', () => this.apply({ ...this.settings.pose, [s.key]: Number(input.value) }, null));
      row.append(el('span', '', s.label), input, out);
      sliders.append(row);
      this.inputs.set(s.key, [input, out]);
    }

    const zoomRow = el('label', 'cam-zoom');
    this.zoomBox.type = 'checkbox';
    this.zoomBox.id = 'cam-autozoom';
    this.zoomBox.addEventListener('change', () => {
      this.settings.autoZoom = this.zoomBox.checked;
      this.handlers.onAutoZoom(this.zoomBox.checked);
      this.persist();
    });
    zoomRow.append(this.zoomBox, el('span', '', 'زوم خودکار با بزرگ شدن گروه'));

    this.sheet.hidden = true;
    this.sheet.append(presets, sliders, zoomRow, this.readout);
    uiRoot().append(toggle, this.sheet);

    this.zoomBox.checked = this.settings.autoZoom;
    handlers.onAutoZoom(this.settings.autoZoom);
    this.apply(this.settings.pose, this.settings.preset);
  }

  private apply(pose: CameraPose, preset: string | null): void {
    this.settings = { ...this.settings, pose, preset };
    this.handlers.onPose(pose);
    this.buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === preset)));
    for (const [key, [input, out]] of this.inputs) {
      input.value = String(pose[key]);
      out.textContent = toFaDigits(pose[key].toFixed(key === 'fov' ? 0 : 1));
    }
    const pitch = Math.round((Math.atan2(pose.height, pose.distance + pose.lookAhead) * 180) / Math.PI);
    this.readout.textContent = toFaDigits(
      `ارتفاع ${pose.height.toFixed(1)} · فاصله ${pose.distance.toFixed(1)} · نگاه جلو ${pose.lookAhead.toFixed(1)} · میدان دید ${pose.fov.toFixed(0)}° · شیب ${pitch}°`,
    );
    this.persist();
  }

  private persist(): void {
    saveCameraSettings(this.settings);
  }
}
