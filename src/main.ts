import './ui/styles.css';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { LEVELS } from './config/levels';
import { App } from './game/App';

async function boot(): Promise<void> {
  const host = document.getElementById('game');
  if (!host) throw new Error('#game host missing');
  if (Capacitor.isNativePlatform()) await StatusBar.hide().catch(() => undefined);

  // Dev convenience: index.html#tehran-03 skips the menu and starts that level.
  const fromHash = LEVELS.findIndex((l) => l.id === window.location.hash.slice(1));
  const app = await App.start(host);
  if (fromHash >= 0) app.play(fromHash);
}

// In-world labels are drawn with Vazirmatn; load it before the first texture is painted.
document.fonts
  .load('900 80px Vazirmatn')
  .catch(() => undefined)
  .finally(() => void boot());

