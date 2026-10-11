import type { RunResult } from '../core/types';
import { el, uiRoot } from './dom';
import { toFaDigits } from './digits';

export interface ResultActions {
  onNext: () => void;
  onRetry: () => void;
  onMenu: () => void;
  /** Watch a rewarded ad to double the coins; resolves to the new total shown. */
  onDouble?: () => Promise<number | null>;
}

/** Win/Lose card: survivors and coins on a win, retry on a loss, always a way back to the menu. */
export class ResultPanel {
  private readonly root = el('div', 'result-backdrop');

  constructor(result: RunResult, remaining: number, coins: number, isLast: boolean, actions: ResultActions) {
    const card = el('div', `result-card interactive ${result}`);
    const win = result === 'win';
    card.append(el('h1', 'result-title', win ? 'پیروزی!' : 'شکست'));
    card.append(el('p', 'result-sub', win ? `${toFaDigits(remaining)} نفر باقی ماندند` : 'یه مسیر دیگه رو امتحان کن'));
    if (win) {
      const coinEl = el('p', 'result-coins', `+${toFaDigits(coins)} سکه`);
      card.append(coinEl);
      const next = el('button', 'btn', isLast ? 'پایان سفر! برگشت به منو' : 'مرحله‌ی بعد');
      next.addEventListener('click', isLast ? actions.onMenu : actions.onNext, { once: true });
      card.append(next);
      if (actions.onDouble) {
        const dbl = el('button', 'btn btn-gold', 'دو برابر سکه با تماشای تبلیغ');
        dbl.addEventListener('click', async () => {
          dbl.disabled = true;
          const total = await actions.onDouble!();
          if (total == null) {
            dbl.disabled = false;
            return;
          }
          coinEl.textContent = `+${toFaDigits(total)} سکه`;
          dbl.remove();
        });
        card.append(dbl);
      }
    } else {
      const retry = el('button', 'btn', 'تلاش دوباره');
      retry.addEventListener('click', actions.onRetry, { once: true });
      card.append(retry);
    }
    const menu = el('button', 'btn btn-ghost', 'منو');
    menu.addEventListener('click', actions.onMenu, { once: true });
    card.append(menu);
    this.root.append(card);
    uiRoot().append(this.root);
  }

  destroy(): void {
    this.root.remove();
  }
}
