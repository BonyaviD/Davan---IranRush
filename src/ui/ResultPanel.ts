import type { RunResult } from '../core/types';
import { el, uiRoot } from './dom';
import { toFaDigits } from './digits';

export interface ResultActions {
  onNext: () => void;
  onRetry: () => void;
}

/** Win/Lose modal with a single primary action (next level or retry). */
export class ResultPanel {
  private readonly root = el('div', 'result-backdrop');

  constructor(result: RunResult, remaining: number, actions: ResultActions) {
    const card = el('div', `result-card interactive ${result}`);
    const title = el('h1', 'result-title', result === 'win' ? 'پیروزی!' : 'شکست');
    const sub = el(
      'p',
      'result-sub',
      result === 'win' ? `${toFaDigits(remaining)} نفر باقی ماندند` : 'یه مسیر دیگه رو امتحان کن',
    );
    const btn = el('button', 'btn', result === 'win' ? 'مرحله‌ی بعد' : 'تلاش دوباره');
    btn.addEventListener('click', result === 'win' ? actions.onNext : actions.onRetry, { once: true });
    card.append(title, sub, btn);
    if (result === 'win') {
      const retry = el('button', 'btn btn-ghost', 'دوباره همین مرحله');
      retry.addEventListener('click', actions.onRetry, { once: true });
      card.append(retry);
    }
    this.root.append(card);
    uiRoot().append(this.root);
  }

  destroy(): void {
    this.root.remove();
  }
}
