import { el, uiRoot } from './dom';
import { toFaDigits } from './digits';

/** In-run top bar: menu button, level name and current count. */
export class Hud {
  private readonly root = el('div', 'hud');
  private readonly levelEl = el('div', 'hud-pill');
  private readonly countEl = el('div', 'hud-pill');
  private readonly menuBtn = el('button', 'hud-pill hud-btn interactive', 'منو');

  constructor(onMenu: () => void) {
    this.menuBtn.addEventListener('click', onMenu);
    const right = el('div', 'hud-group');
    right.append(this.menuBtn, this.levelEl);
    this.root.append(right, this.countEl);
    this.root.hidden = true;
    uiRoot().append(this.root);
  }

  show(on: boolean): void {
    this.root.hidden = !on;
  }

  setLevel(levelNumber: number, worldName: string): void {
    this.levelEl.textContent = `${worldName} · مرحله‌ی ${toFaDigits(levelNumber)}`;
  }

  setCount(n: number): void {
    this.countEl.textContent = `تعداد: ${toFaDigits(n)}`;
  }
}
