import { el, uiRoot } from './dom';
import { toFaDigits } from './digits';

/** Top bar: level number and current count. */
export class Hud {
  private readonly root = el('div', 'hud');
  private readonly levelEl = el('div', 'hud-pill');
  private readonly countEl = el('div', 'hud-pill');

  constructor(levelNumber: number) {
    this.levelEl.textContent = `مرحله‌ی ${toFaDigits(levelNumber)}`;
    this.root.append(this.levelEl, this.countEl);
    uiRoot().append(this.root);
  }

  setCount(n: number): void {
    this.countEl.textContent = `تعداد: ${toFaDigits(n)}`;
  }

  destroy(): void {
    this.root.remove();
  }
}
