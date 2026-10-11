import * as THREE from 'three';
import { GAME } from '../config/game.config';
import { WORLDS } from '../config/worlds';
import { battleOver, battleTick, lossPerTick, type BattleState } from '../core/BattleLogic';
import { CrowdModel } from '../core/CrowdModel';
import { getLevel, levelIndex, nextLevelId } from '../core/LevelLoader';
import { clamp, damp, laneIndex } from '../core/Steering';
import type { LevelData, RunResult, WorldConfig } from '../core/types';
import { Boss } from '../render/Boss';
import { CameraRig } from '../render/CameraRig';
import { characterTime } from '../render/characters/build';
import { BOSSES, DIV, PLAYER_CHARACTERS } from '../render/characters/defs';
import { CrowdMesh } from '../render/CrowdMesh';
import { GatePair } from '../render/GatePair';
import { CountLabel } from '../render/labels';
import { Stage } from '../render/Stage';
import { buildEnvironment } from '../render/environment';
import { disposeTree } from '../render/environment/kit';
import { CameraPanel } from '../ui/CameraPanel';
import { Hud } from '../ui/Hud';
import { ResultPanel } from '../ui/ResultPanel';
import { DragInput } from './Input';

type Phase = 'intro' | 'run' | 'fight' | 'pause' | 'done';

const HALF_ROAD = GAME.roadWidth / 2;
/** Longest frame step we simulate; avoids skipping gates after a hitch or tab switch. */
const MAX_DT = 0.05;
const LABEL_Y = 2.3;
const TEAM_MARKER = 0x2f6fd6;
const ENEMY_MARKER = 0xc0392b;

/** A group of divs waiting on the path. */
interface EnemyGroup {
  z: number;
  count: number;
  crowd: CrowdMesh;
  label: CountLabel;
  defeated: boolean;
}

/** What the crowd is fighting right now. */
type Opponent = { kind: 'enemy'; group: EnemyGroup } | { kind: 'boss' };

/**
 * Owns the run loop. `distance` is in level track units; world z = -distance * metersPerUnit.
 * The crowd runs, passes gates, fights each div group it meets and finally the boss.
 */
export class Game {
  private readonly stage: Stage;
  private readonly rig: CameraRig;
  private readonly input: DragInput;
  private readonly hud = new Hud();
  private readonly crowd = new CrowdMesh({
    defs: PLAYER_CHARACTERS,
    marker: TEAM_MARKER,
    spacing: GAME.crowdSpacing,
    facing: 0,
    runAmp: 1,
  });
  private readonly crowdLabel = new CountLabel();

  private level!: LevelData;
  private world!: WorldConfig;
  private model!: CrowdModel;
  private levelRoot: THREE.Group | null = null;
  private gates: GatePair[] = [];
  private enemies: EnemyGroup[] = [];
  private boss: Boss | null = null;
  private panel: ResultPanel | null = null;

  private phase: Phase = 'intro';
  private phaseTime = 0;
  private distance = 0;
  private nextSegment = 0;
  private nextEnemy = 0;
  private steerX = 0;
  private time = 0;
  private lastFrame = 0;

  private opponent: Opponent | null = null;
  private battle: BattleState = { player: 0, enemy: 0 };
  private battlePerTick = 1;
  private battleAcc = 0;
  private pendingResult: RunResult | null = null;

  constructor(host: HTMLElement) {
    this.stage = new Stage(host);
    this.rig = new CameraRig(this.stage.camera);
    this.input = new DragInput(this.stage.canvas);
    this.stage.scene.add(this.crowd.group, this.crowdLabel.sprite);
    new CameraPanel({
      onPose: (pose) => this.rig.setRunPose(pose),
      onAutoZoom: (on) => (this.rig.autoZoom = on),
    });
  }

  start(levelId: string): void {
    this.loadLevel(levelId);
    this.lastFrame = performance.now();
    requestAnimationFrame(this.frame);
  }

  loadLevel(id: string): void {
    const level = getLevel(id);
    if (!level) throw new Error(`Unknown level: ${id}`);
    this.level = level;
    this.world = WORLDS[level.world];
    this.model = new CrowdModel(level.startCount);
    this.panel?.destroy();
    this.panel = null;
    this.unloadLevel();

    const p = this.world.palette;
    this.stage.setAtmosphere(p.skyHorizon, this.world.fog[0], this.world.fog[1]);
    const root = buildEnvironment(this.world, level.length);
    this.gates = level.segments.map((s) => new GatePair(s, this.world));
    for (const g of this.gates) root.add(g.group);

    this.enemies = level.enemies.map((e) => {
      const crowd = new CrowdMesh({
        defs: [DIV],
        marker: ENEMY_MARKER,
        spacing: GAME.enemySpacing,
        facing: Math.PI,
        runAmp: 0.8,
      });
      crowd.centerZ = -e.z * GAME.metersPerUnit;
      crowd.setCount(e.count);
      crowd.snap();
      crowd.setRunning(false);
      const label = new CountLabel();
      label.set(e.count);
      label.sprite.position.set(0, LABEL_Y + 0.3, crowd.centerZ);
      this.stage.scene.add(crowd.group, label.sprite);
      return { z: e.z, count: e.count, crowd, label, defeated: false };
    });

    const b = level.boss;
    this.boss = new Boss(BOSSES[b.kind], ENEMY_MARKER, -b.z * GAME.metersPerUnit, b.hp);
    this.stage.scene.add(this.boss.group, this.boss.label.sprite);

    this.stage.scene.add(root);
    this.levelRoot = root;

    this.phase = 'intro';
    this.phaseTime = 0;
    this.distance = 0;
    this.nextSegment = 0;
    this.nextEnemy = 0;
    this.steerX = 0;
    this.opponent = null;
    this.pendingResult = null;
    this.input.reset();
    this.input.enabled = false;

    this.crowd.centerX = 0;
    this.crowd.centerZ = 0;
    this.crowd.setCount(0);
    this.crowd.setCount(this.model.count);
    this.crowd.snap();
    this.crowd.setRunning(false);

    this.hud.setLevel(levelIndex(level.id) + 1, this.world.name);
    this.syncCount(this.model.count);
    this.rig.setWorld(this.world);
    this.rig.setMode('intro', true);
  }

  private unloadLevel(): void {
    if (this.levelRoot) {
      this.stage.scene.remove(this.levelRoot);
      disposeTree(this.levelRoot);
      this.levelRoot = null;
    }
    for (const e of this.enemies) {
      this.stage.scene.remove(e.crowd.group, e.label.sprite);
      e.crowd.dispose();
      e.label.dispose();
    }
    this.enemies = [];
    if (this.boss) {
      this.stage.scene.remove(this.boss.group, this.boss.label.sprite);
      this.boss.dispose();
      this.boss = null;
    }
  }

  private readonly frame = (now: number): void => {
    const dt = Math.min((now - this.lastFrame) / 1000, MAX_DT);
    this.lastFrame = now;
    this.time += dt;
    this.phaseTime += dt;
    characterTime.value = this.time;

    switch (this.phase) {
      case 'intro':
        if (this.phaseTime >= GAME.introSec) this.setPhase('run');
        break;
      case 'run':
        this.updateRun(dt);
        break;
      case 'fight':
        this.updateFight(dt);
        break;
      case 'pause':
        if (this.phaseTime >= GAME.afterFightPause) this.setPhase('run');
        break;
      case 'done':
        if (this.pendingResult && this.phaseTime > (this.pendingResult === 'win' ? 1.1 : 0.5)) {
          this.showResult(this.pendingResult);
          this.pendingResult = null;
        }
        break;
    }

    this.layout(dt);
    this.stage.render();
    requestAnimationFrame(this.frame);
  };

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.phaseTime = 0;
    this.input.enabled = phase === 'run';
    this.crowd.setRunning(phase === 'run' || phase === 'fight');
    if (phase === 'run') this.rig.setMode('run');
    if (phase === 'fight') this.rig.setMode(this.opponent?.kind === 'boss' ? 'boss' : 'battle');
  }

  private updateRun(dt: number): void {
    const prev = this.distance;
    this.distance += GAME.runSpeed * dt;

    // Keep the whole cluster on the road.
    const limit = Math.max(0, 1 - this.crowd.radius / HALF_ROAD);
    this.input.target = clamp(this.input.target, -limit, limit);
    this.steerX = damp(this.steerX, this.input.target, GAME.steerLerp, dt);

    const segs = this.level.segments;
    while (this.nextSegment < segs.length && segs[this.nextSegment]!.z <= this.distance) {
      const seg = segs[this.nextSegment]!;
      if (seg.z > prev) {
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

    // Meet the next div group, or the boss once all groups are beaten.
    const group = this.enemies[this.nextEnemy];
    const foeZ = group ? group.z : this.level.boss.z;
    const foeRadius = group ? group.crowd.radius : GAME.bossRadius;
    const gap = (foeZ - this.distance) * GAME.metersPerUnit;
    if (gap <= this.crowd.radius + foeRadius) {
      this.opponent = group ? { kind: 'enemy', group } : { kind: 'boss' };
      this.battle = { player: this.model.count, enemy: group ? group.count : this.level.boss.hp };
      this.battlePerTick = lossPerTick(this.battle, GAME.battle);
      this.battleAcc = 0;
      this.input.target = 0;
      if (group) group.crowd.setRunning(true);
      else this.boss?.setFighting(true);
      this.setPhase('fight');
    }
  }

  private updateFight(dt: number): void {
    const op = this.opponent;
    if (!op) return;
    this.battleAcc += dt;
    while (this.battleAcc >= GAME.battle.tickSec && !battleOver(this.battle)) {
      this.battleAcc -= GAME.battle.tickSec;
      this.battle = battleTick(this.battle, this.battlePerTick);
    }
    this.model.damage(this.model.count - this.battle.player);
    this.syncCount(this.battle.player);

    let foeZ: number;
    let foeRadius: number;
    if (op.kind === 'enemy') {
      op.group.crowd.setCount(this.battle.enemy);
      op.group.label.set(this.battle.enemy);
      foeZ = op.group.z;
      foeRadius = op.group.crowd.radius;
    } else {
      this.boss?.setHp(this.battle.enemy);
      foeZ = this.level.boss.z;
      foeRadius = GAME.bossRadius;
    }

    // Slide to the foe's line and stay pressed against it as both sides shrink.
    this.steerX = damp(this.steerX, 0, 6, dt);
    const contact = (this.crowd.radius + foeRadius) / GAME.metersPerUnit;
    this.distance = damp(this.distance, foeZ - contact, 8, dt);

    if (!battleOver(this.battle)) return;
    if (this.battle.player <= 0) {
      this.finish('lose');
    } else if (op.kind === 'enemy') {
      op.group.defeated = true;
      op.group.crowd.group.visible = false;
      this.nextEnemy++;
      this.opponent = null;
      this.setPhase('pause');
    } else {
      this.boss?.defeat();
      this.finish('win');
    }
  }

  private finish(result: RunResult): void {
    this.setPhase('done');
    this.crowd.setRunning(false);
    this.pendingResult = result;
  }

  private showResult(result: RunResult): void {
    this.panel = new ResultPanel(result, this.model.count, {
      onNext: () => this.loadLevel(nextLevelId(this.level.id)),
      onRetry: () => this.loadLevel(this.level.id),
    });
  }

  private syncCount(n: number): void {
    this.crowd.setCount(n);
    this.crowdLabel.set(n);
    this.hud.setCount(n);
  }

  private layout(dt: number): void {
    const z = -this.distance * GAME.metersPerUnit;
    const x = this.steerX * HALF_ROAD;

    this.crowd.centerX = x;
    this.crowd.centerZ = z;
    this.crowd.update(dt, this.time);
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i]!;
      if (!e.defeated) e.crowd.update(dt, this.time);
    }
    this.boss?.update(dt);
    for (let i = 0; i < this.gates.length; i++) this.gates[i]!.update(dt);

    this.crowdLabel.sprite.position.set(x, LABEL_Y, z);
    this.rig.update(dt, x, z, this.crowd.radius);
    this.stage.followLight(x, z);
  }
}
