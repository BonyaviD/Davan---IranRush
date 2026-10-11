import { LEVELS } from '../config/levels';
import { buyCharacter, completeLevel, toggleEquipped, winReward, type Progress } from '../core/Economy';
import type { RunResult } from '../core/types';
import { PLAYER_CHARACTERS, characterById, type CharacterDef } from '../render/characters/defs';
import { ShopPreview } from '../render/ShopPreview';
import { ads } from '../services/Ads';
import { track } from '../services/Analytics';
import { audio } from '../services/Audio';
import { loadProgress, saveProgress } from '../services/Storage';
import { CameraPanel } from '../ui/CameraPanel';
import { toFaDigits } from '../ui/digits';
import { Menu } from '../ui/Menu';
import { ResultPanel } from '../ui/ResultPanel';
import { Shop } from '../ui/Shop';
import { Game } from './Game';

const TEAM_MARKER = 0x2f6fd6;

/** Top-level flow: menu ⇄ run ⇄ result, shop, settings and saved progress. */
export class App {
  private readonly game: Game;
  private readonly menu: Menu;
  private readonly shop: Shop;
  private readonly preview = new ShopPreview();
  private readonly camera: CameraPanel;
  private result: ResultPanel | null = null;

  private constructor(
    host: HTMLElement,
    private progress: Progress,
  ) {
    audio.setEnabled(progress.sound);
    window.addEventListener('pointerdown', () => audio.unlock(), { once: false, passive: true });

    this.game = new Game(host, {
      onFinish: (r, i, s) => this.onFinish(r, i, s),
      onMenu: () => this.toMenu(),
    });
    this.camera = new CameraPanel({
      onPose: (pose) => this.game.setCameraPose(pose),
      onAutoZoom: (on) => this.game.setAutoZoom(on),
    });
    this.applyCrowd();

    this.menu = new Menu(LEVELS, {
      onPlay: (i) => this.play(i),
      onShop: () => this.openShop(),
      onCamera: () => this.camera.open(),
      onSound: (on) => this.update({ ...this.progress, sound: on }),
      onTap: () => audio.play('tap'),
    });
    this.shop = new Shop(PLAYER_CHARACTERS, {
      onShowCharacter: (def) => this.preview.show(def, TEAM_MARKER),
      onBuy: (def) => this.buy(def),
      onToggle: (def) => {
        this.update(toggleEquipped(this.progress, def.id));
        this.shop.update(this.progress);
      },
      onFreeCoins: () => void this.freeCoins(),
      onClose: () => this.closeShop(),
      onTap: () => audio.play('tap'),
    });
    this.toMenu();
  }

  static async start(host: HTMLElement): Promise<App> {
    return new App(host, await loadProgress(LEVELS.length));
  }

  private update(p: Progress): void {
    this.progress = p;
    audio.setEnabled(p.sound);
    this.applyCrowd();
    void saveProgress(p);
  }

  private applyCrowd(): void {
    const defs = this.progress.equipped.map(characterById).filter((d): d is CharacterDef => !!d);
    this.game.setCrowdCharacters(defs.length ? defs : PLAYER_CHARACTERS.slice(0, 2));
  }

  private toMenu(): void {
    this.result?.destroy();
    this.result = null;
    this.game.showBackdrop(this.progress.current);
    this.menu.show(this.progress);
  }

  play(index: number): void {
    this.result?.destroy();
    this.result = null;
    this.menu.hide();
    if (index !== this.progress.current) this.update({ ...this.progress, current: index });
    track('level_start', { level: LEVELS[index]!.id });
    this.game.play(index);
  }

  private onFinish(result: RunResult, index: number, survivors: number): void {
    const level = LEVELS[index]!;
    const isLast = index === LEVELS.length - 1;
    let coins = 0;
    if (result === 'win') {
      coins = winReward(survivors, index);
      this.update(completeLevel(this.progress, index, coins, LEVELS.length));
      track('level_win', { level: level.id, survivors, coins });
    } else {
      track('level_lose', { level: level.id });
    }
    this.result = new ResultPanel(result, survivors, coins, isLast, {
      onNext: () => this.play(Math.min(index + 1, LEVELS.length - 1)),
      onRetry: () => this.play(index),
      onMenu: () => this.toMenu(),
      onDouble:
        result === 'win'
          ? async () => {
              if (!(await ads.showRewarded('double_coins'))) return null;
              this.update({ ...this.progress, coins: this.progress.coins + coins });
              audio.play('coin');
              return coins * 2;
            }
          : undefined,
    });
  }

  private openShop(): void {
    this.menu.hide();
    this.shop.open(this.progress);
    this.game.setOverlay((dt) => {
      const r = this.game.stage.renderer;
      const aspect = r.domElement.clientWidth / Math.max(1, r.domElement.clientHeight);
      this.preview.update(dt, aspect);
      r.render(this.preview.scene, this.preview.camera);
    });
  }

  private closeShop(): void {
    this.shop.close();
    this.game.setOverlay(null);
    this.toMenu();
  }

  private buy(def: CharacterDef): void {
    const r = buyCharacter(this.progress, def.id, def.price ?? 0);
    if (!r.ok) {
      const need = (def.price ?? 0) - this.progress.coins;
      this.shop.update(this.progress, r.reason === 'coins' ? `${toFaDigits(need)} سکه‌ی دیگه لازمه` : '');
      return;
    }
    this.update(r.progress);
    audio.play('coin');
    track('buy_character', { id: def.id, price: def.price ?? 0 });
    this.shop.update(this.progress, `${def.name} به گروهت اضافه شد!`);
  }

  private async freeCoins(): Promise<void> {
    if (!(await ads.showRewarded('shop_coins'))) return;
    this.update({ ...this.progress, coins: this.progress.coins + 50 });
    audio.play('coin');
    this.shop.update(this.progress, '۵۰ سکه گرفتی!');
  }
}
