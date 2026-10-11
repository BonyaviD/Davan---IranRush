import { clamp } from '../core/Steering';

/**
 * Horizontal drag steering with pointer events (touch + mouse).
 * `target` is lane-relative in [-1, 1]; a drag across half the screen (max 250px) spans
 * the full range.
 */
export class DragInput {
  target = 0;
  enabled = true;
  private startX: number | null = null;
  private startTarget = 0;

  constructor(private readonly el: HTMLElement) {
    el.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }

  reset(): void {
    this.target = 0;
    this.startX = null;
  }

  private readonly onDown = (e: PointerEvent): void => {
    this.startX = e.clientX;
    this.startTarget = this.target;
  };

  private readonly onMove = (e: PointerEvent): void => {
    if (this.startX === null || !this.enabled) return;
    const span = Math.min(this.el.clientWidth || window.innerWidth, 500) / 2;
    this.target = clamp(this.startTarget + (e.clientX - this.startX) / span, -1, 1);
  };

  private readonly onUp = (): void => {
    this.startX = null;
  };
}
