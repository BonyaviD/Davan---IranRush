import Phaser from 'phaser';
import './ui/styles.css';
import { GAME } from './config/game.config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';

function startGame(): void {
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME.width,
    height: GAME.height,
    backgroundColor: '#1b1410',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: { antialias: true, powerPreference: 'high-performance' },
    // No physics: collisions are manual checks in GameScene.
    scene: [BootScene, MenuScene, GameScene, ResultScene],
  });
}

// Canvas labels use Vazirmatn; make sure it is loaded before the first text is drawn.
document.fonts
  .load('800 40px Vazirmatn')
  .catch(() => undefined)
  .finally(startGame);
