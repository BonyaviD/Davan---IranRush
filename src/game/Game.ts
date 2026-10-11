import * as THREE from 'three';
import { GAME } from '../config/game.config';
import { WORLDS } from '../config/worlds';
import { battleOver, battleTick, lossPerTick, type BattleState } from '../core/BattleLogic';
import { CrowdModel } from '../core/CrowdModel';
import { getLevel, levelIndex, nextLevelId } from '../core/LevelLoader';
import { clamp, damp, laneIndex } from '../core/Steering';
import type { LevelData, RunResult, WorldConfig } from '../core/types';
import { CameraRig } from '../render/CameraRig';
import { CrowdMesh } from '../render/CrowdMesh';
import { GatePair } from '../render/GatePair';
import { CountLabel } from '../render/labels';
import { Stage } from '../render/Stage';
import { buildEnvironment } from '../render/environment';
import { disposeTree, lambert } from '../render/environment/common';
import { CameraPanel } from '../ui/CameraPanel';
import { Hud } from '../ui/Hud';
import { ResultPanel } from '../ui/ResultPanel';
import { DragInput } from './Input';

type Phase = 'intro' | 'run' | 'battle' | 'done';

const HALF_ROAD = GAME.roadWidth / 2;
/** Longest frame step we simulate; avoids skipping gates after a hitch or tab switch. */
const MAX_DT = 0.05;
const LABEL_Y = 2.2;

/**
 * Owns the run loop. `distance` is in level track units; world z = -distance * metersPerUnit.
 * Crowd x is lane-relative in [-1, 1] (negative = left gate).
 */
export class Game {
  private readonly stage: Stage;
  private readonly rig: CameraRig;
  private readonly input: DragInput;
  private readonly hud = new Hud();
  private readonly crowd = new CrowdMesh();
  private readonly enemy = new CrowdMesh();
  private readonly crowdLabel = new CountLabel();
  private readonly enemyLabel = new CountLabel();
  private readonly postGeo = new THREE.BoxGeometry(0.25, 3.2, 0.25);

  private level!: LevelData;
  private world!: WorldConfig;
  private model!: CrowdModel;
  private levelRoot: THREE.Group | null = null;
  private gates: GatePair[] = [];
  private panel: ResultPanel | null = null;

  private phase: Phase = 'intro';
  private phaseTime = 0;
  private distance = 0;
  private nextSegment = 0;
  private steerX = 0;
  private time = 0;
  private lastFrame = 0;

  private battle: BattleState = { player: 0, enemy: 0 };
  private battlePerTick = 1;
  private battleAcc = 0;
  private pendingResult: RunResult | null = null;

  constructor(host: HTMLElement) {
    this.stage = new Stage(host);
    this.rig = new CameraRig(this.stage.camera);
    this.input = new DragInput(this.stage.canvas);
    this.stage.scene.add(this.crowd.mesh, this.enemy.mesh, this.crowdLabel.sprite, this.enemyLabel.sprite);
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
    if (this.levelRoot) {
      this.stage.scene.remove(this.levelRoot);
      disposeTree(this.levelRoot);
    }

    const p = this.world.palette;
    this.stage.setAtmosphere(p.sky, this.world.fog[0], this.world.fog[1]);
    const root = buildEnvironment(this.world, level.length);
    this.gates = level.segments.map((s) => new GatePair(s, this.world, this.postGeo, lambert(0xf4efe6)));
    for (const g of this.gates) root.add(g.group);
    this.stage.scene.add(root);
    this.levelRoot = root;

    this.phase = 'intro';
    this.phaseTime = 0;
    this.distance = 0;
    this.nextSegment = 0;
    this.steerX = 0;
    this.pendingResult = null;
    this.input.reset();
    this.input.enabled = false;

    this.crowd.setColor(p.crowd);
    this.crowd.centerX = 0;
    this.crowd.centerZ = 0;
    this.crowd.setCount(0);
    this.crowd.setCount(this.model.count);
    this.crowd.snap();

    this.enemy.setColor(p.enemy);
    this.enemy.centerX = 0;
    this.enemy.centerZ = -level.enemy.z * GAME.metersPerUnit;
    this.enemy.setCount(0);
    this.enemy.setCount(level.enemy.count);
    this.enemy.snap();
    this.enemyLabel.set(level.enemy.count);

    this.hud.setLevel(levelIndex(level.id) + 1, this.world.name);
    this.syncCount(this.model.count);

    this.rig.setWorld(this.world);
    this.rig.setMode('intro', true);
  }

  private readonly frame = (now: number): void => {
    const dt = Math.min((now - this.lastFrame) / 1000, MAX_DT);
    this.lastFrame = now;
    this.time += dt;
    this.phaseTime += dt;

    switch (this.phase) {
      case 'intro':
        if (this.phaseTime >= GAME.introSec) this.setPhase('run');
        break;
      case 'run':
        this.updateRun(dt);
        break;
      case 'battle':
        this.updateBattle(dt);
        break;
      case 'done':
        if (this.pendingResult && this.phaseTime > (this.pendingResult === 'win' ? 0.6 : 0.4)) {
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
    if (phase === 'run') this.rig.setMode('run');
    if (phase === 'battle') this.rig.setMode('battle');
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

    const gap = (this.level.enemy.z - this.distance) * GAME.metersPerUnit;
    if (gap <= this.crowd.radius + this.enemy.radius) {
      this.battle = { player: this.model.count, enemy: this.level.enemy.count };
      this.battlePerTick = lossPerTick(this.battle, GAME.battle);
      this.battleAcc = 0;
      this.setPhase('battle');
    }
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
    this.enemyLabel.set(this.battle.enemy);

    // Slide to the enemy's line and stay pressed together as both sides shrink.
    this.steerX = damp(this.steerX, 0, 6, dt);
    const contact = (this.crowd.radius + this.enemy.radius) / GAME.metersPerUnit;
    this.distance = damp(this.distance, this.level.enemy.z - contact, 8, dt);

    if (battleOver(this.battle)) this.finish(this.battle.player > 0 ? 'win' : 'lose');
  }

  private finish(result: RunResult): void {
    this.setPhase('done');
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
    const running = this.phase === 'run';

    this.crowd.centerX = x;
    this.crowd.centerZ = z;
    this.crowd.update(dt, this.time, running);
    for (let i = 0; i < this.gates.length; i++) this.gates[i]!.update(dt);
    this.enemy.update(dt, this.time, false);

    this.crowdLabel.sprite.position.set(x, LABEL_Y, z);
    this.enemyLabel.sprite.position.set(0, LABEL_Y, this.enemy.centerZ);

    this.rig.update(dt, x, z, this.crowd.radius);
    this.stage.followLight(x, z);
  }
}
