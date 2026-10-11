import { WORLDS } from '../config/worlds';
import type { Progress } from '../core/Economy';
import type { LevelData } from '../core/types';
import { el, uiRoot } from './dom';
import { toFaDigits } from './digits';

export interface MenuHandlers {
  onPlay: (levelIndex: number) => void;
  onShop: () => void;
  onCamera: () => void;
  onSound: (on: boolean) => void;
  onTap: () => void;
}

/** Main menu over the live 3D backdrop: play, city map, shop and settings. */
export class Menu {
  private readonly root = el('div', 'menu');
  private readonly coins = el('div', 'coin-pill');
  private readonly playBtn = el('button', 'btn btn-play');
  private readonly mapSheet = el('div', 'sheet interactive');
  private readonly settingsSheet = el('div', 'sheet interactive');
  private readonly soundBtn = el('button', 'btn btn-ghost');
  private progress: Progress | null = null;

  constructor(
    private readonly levels: LevelData[],
    private readonly h: MenuHandlers,
  ) {
    const top = el('div', 'menu-top');
    top.append(this.coins);
    const title = el('div', 'menu-title');
    title.append(el('h1', '', 'دوان'), el('p', '', 'سفر در ایران، با گروهی که هر لحظه بزرگ‌تر می‌شه'));
    const actions = el('div', 'menu-actions interactive');
    const map = el('button', 'btn btn-ghost-light', 'نقشه‌ی سفر');
    const shop = el('button', 'btn btn-ghost-light', 'فروشگاه');
    const settings = el('button', 'btn btn-ghost-light', 'تنظیمات');
    const row = el('div', 'menu-row');
    row.append(map, shop, settings);
    actions.append(this.playBtn, row);
    this.root.append(top, title, actions);

    this.playBtn.addEventListener('click', () => this.progress && this.tap(() => h.onPlay(this.progress!.current)));
    map.addEventListener('click', () => this.tap(() => this.openMap()));
    shop.addEventListener('click', () => this.tap(h.onShop));
    settings.addEventListener('click', () => this.tap(() => (this.settingsSheet.hidden = false)));

    this.buildSettings();
    this.mapSheet.hidden = true;
    uiRoot().append(this.root, this.mapSheet, this.settingsSheet);
  }

  private tap(fn: () => void): void {
    this.h.onTap();
    fn();
  }

  show(p: Progress): void {
    this.progress = p;
    this.root.hidden = false;
    this.coins.textContent = `${toFaDigits(p.coins)} سکه`;
    const lvl = this.levels[p.current]!;
    const world = WORLDS[lvl.world];
    const n = this.levels.filter((l, i) => l.world === lvl.world && i <= p.current).length;
    this.playBtn.textContent = `بازی · ${world.name} مرحله‌ی ${toFaDigits(n)}`;
    this.soundBtn.textContent = p.sound ? 'صدا: روشن' : 'صدا: خاموش';
  }

  hide(): void {
    this.root.hidden = true;
    this.mapSheet.hidden = true;
    this.settingsSheet.hidden = true;
  }

  private openMap(): void {
    const p = this.progress;
    if (!p) return;
    this.mapSheet.replaceChildren(el('h2', 'sheet-title', 'نقشه‌ی سفر'));
    const order: string[] = [];
    for (const l of this.levels) if (!order.includes(l.world)) order.push(l.world);
    for (const worldId of order) {
      const world = WORLDS[worldId as keyof typeof WORLDS];
      const city = el('div', 'city');
      city.append(el('h3', '', world.name));
      const dots = el('div', 'city-levels');
      let n = 0;
      this.levels.forEach((l, i) => {
        if (l.world !== worldId) return;
        n++;
        const locked = i > p.unlocked;
        const b = el('button', `level-dot${locked ? ' locked' : ''}${i === p.current ? ' current' : ''}${i < p.unlocked ? ' done' : ''}`, toFaDigits(n));
        b.disabled = locked;
        b.setAttribute('aria-label', `${world.name} مرحله‌ی ${toFaDigits(n)}${locked ? ' (قفل)' : ''}`);
        b.addEventListener('click', () => this.tap(() => this.h.onPlay(i)));
        dots.append(b);
      });
      city.append(dots);
      this.mapSheet.append(city);
    }
    const close = el('button', 'btn btn-ghost', 'بستن');
    close.addEventListener('click', () => (this.mapSheet.hidden = true));
    this.mapSheet.append(close);
    this.mapSheet.hidden = false;
  }

  private buildSettings(): void {
    const camera = el('button', 'btn btn-ghost', 'زاویه‌ی دوربین');
    camera.addEventListener('click', () => this.tap(() => {
      this.settingsSheet.hidden = true;
      this.h.onCamera();
    }));
    this.soundBtn.addEventListener('click', () => {
      if (!this.progress) return;
      const on = !this.progress.sound;
      this.soundBtn.textContent = on ? 'صدا: روشن' : 'صدا: خاموش';
      this.h.onSound(on);
      this.h.onTap();
    });
    const close = el('button', 'btn', 'بستن');
    close.addEventListener('click', () => (this.settingsSheet.hidden = true));
    this.settingsSheet.append(el('h2', 'sheet-title', 'تنظیمات'), this.soundBtn, camera, close);
    this.settingsSheet.hidden = true;
  }
}
