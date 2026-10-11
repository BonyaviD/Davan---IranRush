import Phaser from 'phaser';
import { GAME } from '../config/game.config';
import { WORLDS } from '../config/worlds';
import { battleOver, battleTick, lossPerTick, type BattleState } from '../core/BattleLogic';
import { CrowdModel } from '../core/CrowdModel';
import { getLevel, levelIndex } from '../core/LevelLoader';
import { clamp, damp, laneIndex } from '../core/Steering';
import type { LevelData, RunResult } from '../core/types';
import { CrowdRenderer } from '../entities/CrowdRenderer';
import { Enemy } from '../entities/Enemy';
import { GatePair } from '../entities/Gate';
import { LABEL_STYLE } from '../entities/labels';
import { Hud } from '../ui/Hud';
import { toFaDigits } from '../ui/digits';
import { SCENES, TEX } from './keys';
import type { ResultSceneData } from './ResultScene';

export interface GameSceneData {
  levelId: string;
}

type Phase = 'run' | 'battle' | 'done';

const HALF_TRACK = GAME.trackWidth / 2;
const STRIPE_GAP = 160;
const STRIPE_COUNT = Math.ceil(GAME.height / STRIPE_GAP) + 1;
/** Longest frame step we simulate; avoids teleporting through gates after a hitch/tab switch. */
const MAX_DT = 0.05;

/**
 * Run loop. World space: `distance` is how far the crowd has run (track units = px).
 * An object at track position z is drawn at screenY = crowdScreenY - (z - distance).
 * Crowd x is lane-relative in [-1, 1].
 */
export class GameScene extends Phaser.Scene {
  private level!: LevelData;
  private model!: CrowdModel;
  private phase: Phase = 'run';
  private distance = 0;
  private nextSegment = 0;

  private steerX = 0;
  private targetX = 0;
  private dragStartPx = 0;
  private dragStartTarget = 0;

  private crowd!: CrowdRenderer;
  private crowdLabel!: Phaser.GameObjects.Text;
  private shownCount = -1;
  private gates: GatePair[] = [];
  private enemy!: Enemy;
  private stripes: Phaser.GameObjects.Rectangle[] = [];
  private hud!: Hud;

  private battle: BattleState = { player: 0, enemy: 0 };
  private battlePerTick = 1;
  private battleAcc = 0;

  constructor() {
    super(SCENES.game);
  }

  init(data: GameSceneData): void {
    const level = getLevel(data.levelId);
    if (!level) throw new Error(`Unknown level: ${data.levelId}`);
    this.level = level;
    this.model = new CrowdModel(level.startCount);
    this.phase = 'run';
    this.distance = 0;
    this.nextSegment = 0;
    this.steerX = this.targetX = 0;
    this.shownCount = -1;
    this.gates = [];
    this.stripes = [];
    this.battleAcc = 0;
  }

  create(): void {
    const world = WORLDS[this.level.world];
    const cx = GAME.width / 2;
    this.cameras.main.setBackgroundColor(world.palette.background);

    this.add
      .rectangle(cx, GAME.height / 2, GAME.trackWidth, GAME.height + 20, world.palette.track)
      .setStrokeStyle(8, world.palette.trackEdge);
    for (let i = 0; i < STRIPE_COUNT; i++) {
      this.stripes.push(this.add.rectangle(cx, 0, 8, 60, 0xffffff, 0.25));
    }

    this.gates = this.level.segments.map((s) => new GatePair(this, s, world));
    this.enemy = new Enemy(this, this.level.enemy, world);

    this.crowd = new CrowdRenderer(
      this,
      TEX.person,
      world.palette.crowd,
      GAME.maxCrowdSprites,
      GAME.crowdSpacing,
      GAME.personRadius,
      10,
    );
    this.crowd.centerX = cx;
    this.crowd.centerY = GAME.crowdScreenY;
    this.crowdLabel = this.add.text(0, 0, '', LABEL_STYLE).setOrigin(0.5).setDepth(20);

    this.hud = new Hud(levelIndex(this.level.id) + 1);
    this.syncCount(this.model.count);
    this.crowd.snap();
    this.layoutWorld(0, true);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      this.dragStartPx = p.x;
      this.dragStartTarget = this.targetX;
    });
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (!p.isDown || this.phase !== 'run') return;
      this.targetX = clamp(this.dragStartTarget + (p.x - this.dragStartPx) / HALF_TRACK, -1, 1);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.hud.destroy();
      this.input.removeAllListeners();
    });
  }

  override update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, MAX_DT);
    if (this.phase === 'run') this.updateRun(dt);
    else if (this.phase === 'battle') this.updateBattle(dt);
    this.layoutWorld(dt, false);
  }

  private updateRun(dt: number): void {
    const prevDistance = this.distance;
    this.distance += GAME.runSpeed * dt;

    // Keep the whole cluster inside the track.
    const limit = Math.max(0, 1 - this.crowd.radius / HALF_TRACK);
    this.targetX = clamp(this.targetX, -limit, limit);
    this.steerX = damp(this.steerX, this.targetX, GAME.steerLerp, dt);

    const segments = this.level.segments;
    while (this.nextSegment < segments.length && segments[this.nextSegment]!.z <= this.distance) {
      const seg = segments[this.nextSegment]!;
      if (seg.z > prevDistance) {
        const lane = laneIndex(this.steerX);
        this.model.passGate(seg.gates[lane]);
        this.gates[this.nextSegment]!.markPassed(lane);
        this.syncCount(this.model.count);
        if (this.model.isDead) {
          this.finish('lose');
          return;
        }
      }
      this.nextSegment++;
    }

    // Battle starts when the two clusters touch.
    const gap = this.level.enemy.z - this.distance;
    if (gap <= this.crowd.radius + this.enemy.crowd.radius) this.startBattle();
  }

  private startBattle(): void {
    this.phase = 'battle';
    this.battle = { player: this.model.count, enemy: this.level.enemy.count };
    this.battlePerTick = lossPerTick(this.battle, GAME.battle);
    this.battleAcc = 0;
  }

  private updateBattle(dt: number): void {
    this.battleAcc += dt;
    while (this.battleAcc >= GAME.battle.tickSec && !battleOver(this.battle)) {
      this.battleAcc -= GAME.battle.tickSec;
      this.battle = battleTick(this.battle, this.battlePerTick);
    }
    this.model.damage(this.model.count - this.battle.player);
    this.syncCount(this.battle.player);
    this.enemy.setCount(this.battle.enemy);

    // Slide to the enemy's center and keep the groups pressed together as they shrink.
    this.steerX = damp(this.steerX, 0, 6, dt);
    const contact = this.crowd.radius + this.enemy.crowd.radius;
    const target = this.level.enemy.z - contact;
    this.distance = damp(this.distance, target, 8, dt);

    if (battleOver(this.battle)) this.finish(this.battle.player > 0 ? 'win' : 'lose');
  }

  private finish(result: RunResult): void {
    this.phase = 'done';
    const data: ResultSceneData = {
      levelId: this.level.id,
      result,
      remaining: this.model.count,
    };
    this.time.delayedCall(result === 'win' ? 500 : 350, () => this.scene.launch(SCENES.result, data));
  }

  private syncCount(n: number): void {
    if (n === this.shownCount) return;
    this.shownCount = n;
    this.crowd.setCount(n);
    this.crowdLabel.setText(toFaDigits(n)).setVisible(n > 0);
    this.hud.setCount(n);
  }

  private layoutWorld(dt: number, snap: boolean): void {
    const d = this.distance;
    // Screen y of track position z is: crowdScreenY - (z - d). Index loops: no per-frame allocation.

    for (let i = 0; i < this.stripes.length; i++) {
      const y = ((i * STRIPE_GAP + d) % (STRIPE_COUNT * STRIPE_GAP)) - STRIPE_GAP / 2;
      this.stripes[i]!.setY(y);
    }
    for (let i = 0; i < this.gates.length; i++) {
      const g = this.gates[i]!;
      g.layout(GAME.crowdScreenY - (g.segment.z - d));
    }
    this.enemy.layout(GAME.crowdScreenY - (this.level.enemy.z - d), dt, snap);

    this.crowd.centerX = GAME.width / 2 + this.steerX * HALF_TRACK;
    if (!snap) this.crowd.update(dt);
    this.crowdLabel.setPosition(this.crowd.centerX, GAME.crowdScreenY - this.crowd.radius - 34);
  }
}
