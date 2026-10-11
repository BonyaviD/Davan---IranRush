import type { Progress } from '../core/Economy';
import type { CharacterDef } from '../render/characters/defs';
import { el, uiRoot } from './dom';
import { toFaDigits } from './digits';

export interface ShopHandlers {
  onShowCharacter: (def: CharacterDef) => void;
  onBuy: (def: CharacterDef) => void;
  onToggle: (def: CharacterDef) => void;
  onFreeCoins: () => void;
  onClose: () => void;
  onTap: () => void;
}

/** Character shop: the 3D turntable fills the screen; this card sits at the bottom. */
export class Shop {
  private readonly root = el('div', 'shop');
  private readonly coins = el('div', 'coin-pill');
  private readonly name = el('b', 'shop-name');
  private readonly desc = el('span', 'shop-desc');
  private readonly action = el('button', 'btn');
  private readonly status = el('p', 'shop-status');
  private index = 0;
  private progress: Progress | null = null;

  constructor(
    private readonly chars: CharacterDef[],
    private readonly h: ShopHandlers,
  ) {
    const top = el('div', 'menu-top interactive');
    const back = el('button', 'btn btn-ghost-light btn-small', 'برگشت');
    back.addEventListener('click', () => this.tapThen(h.onClose));
    const free = el('button', 'btn btn-gold btn-small', '+۵۰ سکه با تبلیغ');
    free.addEventListener('click', () => this.tapThen(h.onFreeCoins));
    top.append(back, this.coins, free);

    const card = el('div', 'shop-card interactive');
    const prev = el('button', 'shop-arrow', '‹');
    const next = el('button', 'shop-arrow', '›');
    prev.setAttribute('aria-label', 'شخصیت قبلی');
    next.setAttribute('aria-label', 'شخصیت بعدی');
    prev.addEventListener('click', () => this.tapThen(() => this.select(this.index - 1)));
    next.addEventListener('click', () => this.tapThen(() => this.select(this.index + 1)));
    const info = el('div', 'shop-info');
    info.append(this.name, this.desc);
    const nav = el('div', 'shop-nav');
    nav.append(next, info, prev);
    this.action.addEventListener('click', () => this.tapThen(() => this.act()));
    card.append(nav, this.action, this.status);

    this.root.append(top, card);
    this.root.hidden = true;
    uiRoot().append(this.root);
  }

  private tapThen(fn: () => void): void {
    this.h.onTap();
    fn();
  }

  open(p: Progress): void {
    this.root.hidden = false;
    this.update(p);
    this.select(this.index);
  }

  close(): void {
    this.root.hidden = true;
  }

  update(p: Progress, message = ''): void {
    this.progress = p;
    this.coins.textContent = `${toFaDigits(p.coins)} سکه`;
    this.status.textContent = message;
    this.render();
  }

  private select(i: number): void {
    this.index = (i + this.chars.length) % this.chars.length;
    this.status.textContent = '';
    this.h.onShowCharacter(this.chars[this.index]!);
    this.render();
  }

  private render(): void {
    const p = this.progress;
    const c = this.chars[this.index]!;
    if (!p) return;
    this.name.textContent = c.name;
    this.desc.textContent = c.desc;
    const owned = p.owned.includes(c.id);
    const inCrowd = p.equipped.includes(c.id);
    this.action.className = 'btn' + (owned && inCrowd ? ' btn-done' : '');
    this.action.textContent = !owned
      ? `خرید با ${toFaDigits(c.price ?? 0)} سکه`
      : inCrowd
        ? 'توی گروهه ✓ (برای برداشتن بزن)'
        : 'اضافه کن به گروه';
  }

  private act(): void {
    const p = this.progress;
    const c = this.chars[this.index]!;
    if (!p) return;
    if (!p.owned.includes(c.id)) this.h.onBuy(c);
    else this.h.onToggle(c);
  }
}
