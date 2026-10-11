import './ui/styles.css';
import { LEVELS } from './config/levels';
import { Game } from './game/Game';

function boot(): void {
  const host = document.getElementById('game');
  if (!host) throw new Error('#game host missing');
  // Dev convenience: index.html#tehran-01 starts at that level.
  const fromHash = window.location.hash.slice(1);
  const start = LEVELS.some((l) => l.id === fromHash) ? fromHash : LEVELS[0]!.id;
  new Game(host).start(start);
}

// In-world labels are drawn with Vazirmatn; load it before the first texture is painted.
document.fonts
  .load('900 80px Vazirmatn')
  .catch(() => undefined)
  .finally(boot);
