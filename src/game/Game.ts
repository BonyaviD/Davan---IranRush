import * as THREE from 'three';
import { GAME } from '../config/game.config';
import { LEVELS } from '../config/levels';
import { WORLDS } from '../config/worlds';
import { battleOver, battleTick, lossPerTick, type BattleState } from '../core/BattleLogic';
import { CrowdModel } from '../core/CrowdModel';
import { isPositiveGate } from '../core/GateLogic';
import { obstacleHits } from '../core/ObstacleLogic';
import { clamp, damp, laneIndex } from '../core/Steering';
import type { CameraPose, LevelData, RunResult, WorldConfig } from '../core/types';
import { Boss } from '../render/Boss';
import { CameraRig } from '../render/CameraRig';
import { characterTime } from '../render/characters/build';
import { BOSSES, DIV, type CharacterDef } from '../render/characters/defs';
import { CrowdMesh } from '../render/CrowdMesh';
import { Popups, Sparks } from '../render/Fx';
import { GatePair } from '../render/GatePair';
import { CountLabel } from '../render/labels';
import { Obstacle } from '../render/Obstacle';
import { Stage } from '../render/Stage';
import { buildEnvironment } from '../render/environment';
import { disposeTree } from '../render/environment/kit';
import { audio } from '../services/Audio';
import { buzz } from '../services/Haptics';
import { formatGate, toFaDigits } from '../ui/digits';
import { Hud } from '../ui/Hud';
import { DragInput } from './Input';

type Phase = 'menu' | 'intro' | 'run' | 'fight' | 'pause' | 'done';

const HALF_ROAD = GAME.roadWidth / 2;
/** Longest frame step we simulate; avoids skipping gates after a hitch or tab switch. */
const MAX_DT = 0.05;
const LABEL_Y = 2.3;
const TEAM_MARKER = 0x2f6fd6;
const ENEMY_MARKER = 0xc0392b;
/** Draw distance for gates, obstacles and enemy groups (m behind / ahead of the crowd). */
const CULL_BEHIND = 25;
const CULL_AHEAD = 170;

export interface GameEvents {
  /** A run ended; the app shows the result and pays rewards. */
  onFinish: (result: RunResult, levelIndex: number, survivors: number) => void;
  /** The in-run menu button was pressed. */
  onMenu: () => void;
}

interface EnemyGroup {
  z: number;
  count: number;
  crowd: CrowdMesh;
  label: CountLabel;
  defeated: boolean;
}

type Opponent = { kind: 'enemy'; group: EnemyGroup } | { kind: 'boss' };

/**
 * Owns the 3D run. `distance` is in level track units; world z = -distance * metersPerUnit.
 * The crowd runs, passes gates and obstacles, fights each div group and finally the boss.
 * Menus, progress and rewards live in App; this class only plays levels.
 */
export class Game {
  readonly stage: Stage;
  private readonly rig: CameraRig;
  private readonly input: DragInput;
  private readonly hud: Hud;
  private readonly crowdLabel = new CountLabel();
  private readonly popups = new Popups();
  private readonly sparks = new Sparks();
  private crowd: CrowdMesh | null = null;
  private crowdKey = '';

  private level!: LevelData;
  private levelIndex = 0;
  private world!: WorldConfig;
  private model!: CrowdModel;
  private levelRoot: THREE.Group | null = null;
  private gates: GatePair[] = [];
  private obstacles: Obstacle[] = [];
  private enemies: EnemyGroup[] = [];
  private boss: Boss | null = null;

  private phase: Phase = 'menu';
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
  /** Optional replacement frame (e.g. the shop turntable). */
  private overlay: ((dt: number) => void) | null = null;

  constructor(host: HTMLElement, private readonly events: GameEvents) {
    this.stage = new Stage(host);
    this.rig = new CameraRig(this.stage.camera);
    this.input = new DragInput(this.stage.canvas);
    this.hud = new Hud(() => events.onMenu());
    this.stage.scene.add(this.crowdLabel.sprite, this.popups.group, this.sparks.points);
    this.lastFrame = performance.now();
    requestAnimationFrame(this.frame);
  }

  setCameraPose(pose: CameraPose): void {
    this.rig.setRunPose(pose);
  }

  setAutoZoom(on: boolean): void {
    this.rig.autoZoom = on;
  }

  /** Characters mixed into the player's crowd (rebuilt only when the set changes). */
  setCrowdCharacters(defs: CharacterDef[]): void {
    const key = defs.map((d) => d.id).join(',');
    if (key === this.crowdKey) return;
    this.crowdKey = key;
    if (this.crowd) {
      this.stage.scene.remove(this.crowd.group);
      this.crowd.dispose();
    }
    this.crowd = new CrowdMesh({ defs, marker: TEAM_MARKER, spacing: GAME.crowdSpacing, facing: 0, runAmp: 1 });
    this.stage.scene.add(this.crowd.group);
    if (this.level) {
      this.crowd.setCount(this.model.count);
      this.crowd.snap();
    }
  }

  setOverlay(fn: ((dt: number) => void) | null): void {
    this.overlay = fn;
  }

  /** Loads a level as an idle backdrop behind the menu. */
  showBackdrop(levelIndex: number): void {
    this.loadLevel(levelIndex);
    this.hud.show(false);
    this.setPhase('menu');
  }

  /** Loads a level and starts it (intro shot, then the run). */
  play(levelIndex: number): void {
    this.loadLevel(levelIndex);
    this.hud.show(true);
    this.setPhase('intro');
  }

  private loadLevel(index: number): void {
    const level = LEVELS[index];
    if (!level) throw new Error(`Unknown level index: ${index}`);
    this.level = level;
    this.levelIndex = index;
    this.world = WORLDS[level.world];
    this.model = new CrowdModel(level.startCount);
    this.unloadLevel();

    const p = this.world.palette;
    this.stage.setAtmosphere(p.skyHorizon, this.world.fog[0], this.world.fog[1]);
    const root = buildEnvironment(this.world, level.length);
    this.gates = level.segments.map((s) => new GatePair(s, this.world));
    for (const g of this.gates) root.add(g.group);
    this.obstacles = (level.obstacles ?? []).map((o) => new Obstacle(o));
    for (const o of this.obstacles) root.add(o.group);

    this.enemies = level.enemies.map((e) => {
      const crowd = new CrowdMesh({ defs: [DIV], marker: ENEMY_MARKER, spacing: GAME.enemySpacing, facing: Math.PI, runAmp: 0.8 });
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

    this.distance = 0;
    this.nextSegment = 0;
    this.nextEnemy = 0;
    this.steerX = 0;
    this.opponent = null;
    this.pendingResult = null;
    this.input.reset();

    const crowd = this.crowd!;
    crowd.centerX = 0;
    crowd.centerZ = 0;
    crowd.setCount(0);
    crowd.setCount(this.model.count);
    crowd.snap();

    const n = LEVELS.filter((l, i) => l.world === level.world && i <= index).length;
    this.hud.setLevel(n, this.world.name);
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

    if (this.overlay) {
      this.overlay(dt);
      requestAnimationFrame(this.frame);
      return;
    }

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
        if (this.pendingResult && this.phaseTime > (this.pendingResult === 'win' ? 1.3 : 0.6)) {
          this.events.onFinish(this.pendingResult, this.levelIndex, this.model.count);
          this.pendingResult = null;
        }
        break;
      case 'menu':
        break;
    }

    if (this.level) this.layout(dt);
    this.stage.render();
    requestAnimationFrame(this.frame);
  };

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.phaseTime = 0;
    // Steering is live from the intro on (and through fights) so players can aim early.
    this.input.enabled = phase === 'intro' || phase === 'run' || phase === 'fight' || phase === 'pause';
    this.crowd?.setRunning(phase === 'run' || phase === 'fight');
    if (phase === 'run') this.rig.setMode('run');
    if (phase === 'menu' || phase === 'intro') this.rig.setMode('intro');
    if (phase === 'fight') this.rig.setMode(this.opponent?.kind === 'boss' ? 'boss' : 'battle');
  }

  private updateRun(dt: number): void {
    const crowd = this.crowd!;
    const prev = this.distance;
    this.distance += GAME.runSpeed * dt;

    const limit = Math.max(0, 1 - crowd.radius / HALF_ROAD);
    this.input.target = clamp(this.input.target, -limit, limit);
    this.steerX = damp(this.steerX, this.input.target, GAME.steerLerp, dt);

    const segs = this.level.segments;
    while (this.nextSegment < segs.length && segs[this.nextSegment]!.z <= this.distance) {
      const seg = segs[this.nextSegment]!;
      if (seg.z > prev) this.passGate(this.nextSegment, laneIndex(this.steerX));
      this.nextSegment++;
      if (this.model.isDead) return this.finish('lose');
    }

    // Obstacles knock people out of the crowd once each.
    const crowdLane = crowd.radius / HALF_ROAD;
    const zNow = -this.distance * GAME.metersPerUnit;
    for (const o of this.obstacles) {
      if (o.hit || Math.abs(o.z - zNow) > crowd.radius * 0.6 + 0.7) continue;
      if (!obstacleHits(o.laneX, o.def.halfWidth, this.steerX, crowdLane)) continue;
      o.knock();
      this.model.damage(o.def.damage);
      this.syncCount(this.model.count);
      this.popups.spawn('−' + toFaDigits(o.def.damage), '#ff5a4a', this.steerX * HALF_ROAD, 2.6, zNow);
      this.rig.addShake(0.35);
      audio.play('bump');
      buzz('medium');
      if (this.model.isDead) return this.finish('lose');
    }

    // Meet the next div group, or the boss once all groups are beaten.
    const group = this.enemies[this.nextEnemy];
    const foeZ = group ? group.z : this.level.boss.z;
    const foeRadius = group ? group.crowd.radius : GAME.bossRadius;
    if ((foeZ - this.distance) * GAME.metersPerUnit <= crowd.radius + foeRadius) {
      this.opponent = group ? { kind: 'enemy', group } : { kind: 'boss' };
      this.battle = { player: this.model.count, enemy: group ? group.count : this.level.boss.hp };
      this.battlePerTick = lossPerTick(this.battle, GAME.battle);
      this.battleAcc = 0;
      if (group) group.crowd.setRunning(true);
      else {
        this.boss?.setFighting(true);
        audio.play('roar');
        this.rig.addShake(0.4);
      }
      this.setPhase('fight');
    }
  }

  private passGate(index: number, lane: 0 | 1): void {
    const gate = this.level.segments[index]!.gates[lane];
    // Mystery gates show what was behind them only after the crowd has gone through.
    this.gates[index]!.reveal();
    this.model.passGate(gate);
    this.gates[index]!.markPassed(lane);
    this.syncCount(this.model.count);
    const good = isPositiveGate(gate);
    this.popups.spawn(formatGate(gate), good ? '#3ad08a' : '#ff5a4a', this.steerX * HALF_ROAD, 2.8, -this.distance * GAME.metersPerUnit);
    audio.play(good ? 'gateGood' : 'gateBad');
    buzz(good ? 'light' : 'medium');
  }

  private updateFight(dt: number): void {
    const op = this.opponent;
    const crowd = this.crowd!;
    if (!op) return;
    this.battleAcc += dt;
    let ticked = false;
    while (this.battleAcc >= GAME.battle.tickSec && !battleOver(this.battle)) {
      this.battleAcc -= GAME.battle.tickSec;
      this.battle = battleTick(this.battle, this.battlePerTick);
      ticked = true;
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
    const contactZ = -(foeZ * GAME.metersPerUnit) + foeRadius * 0.6;
    if (ticked) {
      audio.play('hit');
      this.sparks.burst((Math.random() - 0.5) * 2, 0.8, contactZ, 3, 2.5);
      this.rig.addShake(op.kind === 'boss' ? 0.06 : 0.03);
    }

    this.steerX = damp(this.steerX, 0, 6, dt);
    const contact = (crowd.radius + foeRadius) / GAME.metersPerUnit;
    this.distance = damp(this.distance, foeZ - contact, 8, dt);

    if (!battleOver(this.battle)) return;
    if (this.battle.player <= 0) {
      this.finish('lose');
    } else if (op.kind === 'enemy') {
      op.group.defeated = true;
      op.group.crowd.group.visible = false;
      this.sparks.burst(0, 1, -op.group.z * GAME.metersPerUnit, 30, 4);
      buzz('light');
      this.nextEnemy++;
      this.opponent = null;
      this.setPhase('pause');
    } else {
      this.boss?.defeat();
      this.sparks.burst(0, 3, this.boss!.z, 60, 6);
      this.rig.addShake(0.5);
      buzz('heavy');
      this.finish('win');
    }
  }

  private finish(result: RunResult): void {
    this.setPhase('done');
    this.crowd?.setRunning(false);
    this.pendingResult = result;
    audio.play(result === 'win' ? 'win' : 'lose');
  }

  private syncCount(n: number): void {
    this.crowd?.setCount(n);
    this.crowdLabel.set(n);
    this.hud.setCount(n);
  }

  private layout(dt: number): void {
    const crowd = this.crowd!;
    const z = -this.distance * GAME.metersPerUnit;
    const x = this.steerX * HALF_ROAD;

    crowd.centerX = x;
    crowd.centerZ = z;
    crowd.update(dt, this.time);
    // Only things near the crowd are drawn and animated: long levels stay cheap on phones.
    const near = (oz: number) => z - oz > -CULL_BEHIND && z - oz < CULL_AHEAD;
    for (const e of this.enemies) {
      const vis = !e.defeated && near(e.crowd.centerZ);
      e.crowd.group.visible = vis;
      e.label.sprite.visible = vis;
      if (vis) e.crowd.update(dt, this.time);
    }
    for (const o of this.obstacles) {
      o.group.visible = near(o.z);
      if (o.group.visible) o.update(dt, this.time);
    }
    this.boss?.update(dt);
    for (const g of this.gates) {
      if (g.passed && !g.group.visible) continue;
      const vis = near(g.group.position.z);
      if (!g.passed) g.group.visible = vis;
      g.update(dt);
    }
    this.popups.update(dt);
    this.sparks.update(dt);

    this.crowdLabel.sprite.position.set(x, LABEL_Y, z);
    this.rig.update(dt, x, z, crowd.radius);
    this.stage.followLight(x, z);
  }
}
