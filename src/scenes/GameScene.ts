import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { DEBUG_MODE } from '../config/releaseConfig';
import { THEME } from '../config/visualTheme';
import { Goal } from '../entities/Goal';
import { Player } from '../entities/Player';
import { Student } from '../entities/Student';
import { Teacher } from '../entities/Teacher';
import type { LevelConfig, MapPropConfig, RectConfig, RoomConfig, StairTransitionConfig } from '../types/LevelTypes';
import type { SideScrollConfig, SideScrollDirection, SideScrollTeacherConfig, SideScrollTeacherState } from '../types/SideScrollTypes';
import { Hud } from '../ui/Hud';
import { InputManager } from '../systems/InputManager';
import { LevelManager } from '../systems/LevelManager';
import { ProgressManager } from '../systems/ProgressManager';
import { VisionSystem } from '../systems/VisionSystem';

interface SideTeacherRuntime {
  config: SideScrollTeacherConfig;
  x: number;
  direction: SideScrollDirection;
  state: SideScrollTeacherState;
  elapsed: number;
  body: Phaser.GameObjects.Container;
  vision: Phaser.GameObjects.Graphics;
  activeVision?: Phaser.Geom.Rectangle;
  warningVision?: Phaser.Geom.Rectangle;
}

export class GameScene extends Phaser.Scene {
  private static readonly LEVEL1_TUTORIAL_KEY = 'chime-made-ni-kaere-level1-tutorial-seen-v1';
  private level!: LevelConfig;
  private player!: Player;
  private goal!: Goal;
  private teachers: Teacher[] = [];
  private inputManager!: InputManager;
  private hud!: Hud;
  private remainingMs = 0;
  private dashCount = 0;
  private wasDashing = false;
  private finished = false;
  private paused = false;
  private soundEnabled = true;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private dangerFrame?: Phaser.GameObjects.Graphics;
  private debugEnabled = false;
  private debugText?: Phaser.GameObjects.Text;
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private tutorialOverlay?: Phaser.GameObjects.Container;
  private stairNoticeShown = false;
  private currentFloor = 1;
  private isFloorTransitioning = false;
  private sideScroll?: SideScrollConfig;
  private sideTeachers: SideTeacherRuntime[] = [];
  private sideGoalX = 0;

  constructor() {
    super('GameScene');
  }

  init(data: { levelId?: number }): void {
    this.level = LevelManager.getLevel(data.levelId ?? 1);
    this.sideScroll = this.level.sideScroll;
    this.remainingMs = this.level.timeLimit * 1000;
    this.dashCount = 0;
    this.wasDashing = false;
    this.finished = false;
    this.paused = false;
    this.teachers = [];
    this.stairNoticeShown = false;
    this.sideTeachers = [];
    this.currentFloor = this.sideScroll?.initialFloor ?? this.level.map.initialFloor ?? 1;
    this.isFloorTransitioning = false;
  }

  create(): void {
    if (this.sideScroll) {
      this.createSideScrollMode(this.sideScroll);
      return;
    }

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.debugEnabled = this.shouldEnableDebug();
    this.drawSchoolFloor();
    this.drawCollisionDebug();
    this.goal = new Goal(this, this.level.goal.x, this.level.goal.y, this.level.goal.width, this.level.goal.height, this.level.goalLabel);
    this.player = new Player(this, this.level.playerStart.x, this.level.playerStart.y);
    this.teachers = this.level.teachers.map((teacher) => new Teacher(this, teacher));
    this.inputManager = new InputManager(this);
    this.hud = new Hud(this, this.level.name, this.getFloorLabel(this.currentFloor), () => this.togglePause());
    this.hud.setTime(this.level.timeLimit);
    this.dangerFrame = this.add.graphics().setDepth(830).setScrollFactor(0).setAlpha(0);
    this.drawDangerFrame();
    this.createDebugOverlay();
    this.showLevelIntroIfNeeded();
  }

  update(_time: number, delta: number): void {
    if (this.sideScroll) {
      this.updateSideScrollMode(delta, this.sideScroll);
      return;
    }

    if (this.finished || this.paused || this.tutorialOverlay || this.isFloorTransitioning) {
      return;
    }

    const input = this.inputManager.update(delta);
    const preMovePosition = this.player.getPositionVector();
    const inDashDisabledZone = this.isInDashDisabledZone(preMovePosition.x, preMovePosition.y);
    if (inDashDisabledZone) {
      input.isDashing = false;
      this.showStairNotice();
    }

    if (input.isDashing && !this.wasDashing) {
      this.dashCount += 1;
    }
    this.wasDashing = input.isDashing;

    this.remainingMs -= delta;
    this.hud.setTime(this.remainingMs / 1000);

    for (const teacher of this.teachers) {
      teacher.updateTeacher(delta);
    }

    this.player.updateFromInput(input, delta, (x, y, radius) => this.canPlayerMoveTo(x, y, radius), inDashDisabledZone ? 0.78 : 1);
    const position = this.player.getPositionVector();
    const stairTransition = this.findStairTransition(position.x, position.y);
    if (stairTransition) {
      this.startFloorTransition(stairTransition);
      return;
    }

    const isInTeacherVision = VisionSystem.isPointInVision(position, this.teachers);
    this.hud.setGoalDirection(position, this.goal.getCenterVector());
    this.updateDangerFrame(input.isDashing && VisionSystem.isNearVision(position, this.teachers, 42));
    this.updateDebugOverlay(input.isDashing, isInTeacherVision, input.inputSource);

    if (this.canClearOnCurrentFloor() && this.goal.contains(position.x, position.y)) {
      this.finish(true);
      return;
    }

    if (input.isDashing && isInTeacherVision) {
      this.finish(false, '先生の前で走ってしまった！');
      return;
    }

    if (this.remainingMs <= 0) {
      this.finish(false, 'チャイムに間に合わなかった！');
      return;
    }

  }

  private createSideScrollMode(side: SideScrollConfig): void {
    this.cameras.main.setBackgroundColor(0x25364a);
    this.cameras.main.setBounds(0, 0, side.worldWidth, GAME_HEIGHT);
    this.debugEnabled = this.shouldEnableDebug();
    this.sideGoalX = side.goalX;

    this.drawSideScrollWorld(side);
    this.goal = new Goal(this, side.goalX - 26, side.floorY - 86, 64, 82, this.level.goalLabel);
    this.player = new Player(this, side.startX, side.floorY);
    this.player.setDepth(50);
    this.sideTeachers = side.teachers.map((teacher) => this.createSideTeacher(teacher, side));
    side.students.forEach((student) => {
      const y = student.layer === 'classroom' ? side.floorY - 206 : side.floorY - 24;
      new Student(this, student.x, y, student.color);
    });

    this.inputManager = new InputManager(this);
    this.hud = new Hud(this, this.level.name, this.getFloorLabel(this.currentFloor), () => this.togglePause());
    this.hud.setTime(this.level.timeLimit);
    this.dangerFrame = this.add.graphics().setDepth(830).setScrollFactor(0).setAlpha(0);
    this.drawDangerFrame();
    this.createDebugOverlay();
    this.cameras.main.startFollow(this.player, false, 0.14, 0.08, -30, 150);
    this.showLevelIntroIfNeeded();
  }

  private updateSideScrollMode(delta: number, side: SideScrollConfig): void {
    if (this.finished || this.paused || this.tutorialOverlay || this.isFloorTransitioning) {
      return;
    }

    const input = this.inputManager.update(delta);
    const horizontal = Math.abs(input.direction.x) > 0.05 ? input.direction.x : 0;
    input.direction.set(horizontal, 0);
    input.isDashing = input.isDashing && horizontal !== 0;

    if (input.isDashing && !this.wasDashing) {
      this.dashCount += 1;
    }
    this.wasDashing = input.isDashing;

    this.remainingMs -= delta;
    this.hud.setTime(this.remainingMs / 1000);

    this.player.updateSideScroll(input, delta, side.floorY, 40, side.worldWidth - 40);
    const position = this.player.getPositionVector();

    const stairTransition = this.findSideStairTransition(side, position.x, position.y);
    if (stairTransition) {
      this.startFloorTransition(stairTransition);
      return;
    }

    this.updateSideTeachers(delta, side);
    const isInTeacherVision = this.isPointInSideTeacherVision(position);
    this.hud.setGoalDirection(position, new Phaser.Math.Vector2(this.sideGoalX, side.floorY - 56));
    this.updateDangerFrame(input.isDashing && this.isNearSideTeacherVision(position, 44));
    this.updateDebugOverlay(input.isDashing, isInTeacherVision, input.inputSource);

    if (this.currentFloor === side.goalFloor && position.x >= side.goalX) {
      this.finish(true);
      return;
    }

    if (input.isDashing && isInTeacherVision) {
      this.finish(false, '先生の前で走ってしまった！');
      return;
    }

    if (this.remainingMs <= 0) {
      this.finish(false, 'チャイムに間に合わなかった！');
    }
  }

  private drawSideScrollWorld(side: SideScrollConfig): void {
    const g = this.add.graphics();
    g.fillStyle(0xf7f0dc, 1);
    g.fillRect(0, 112, side.worldWidth, 360);
    g.fillStyle(0xd8c8a8, 1);
    g.fillRect(0, 452, side.worldWidth, 40);
    g.fillStyle(THEME.colors.hallA, 1);
    g.fillRect(0, 492, side.worldWidth, 192);
    g.fillStyle(THEME.colors.hallB, 1);
    for (let x = 0; x < side.worldWidth; x += 32) {
      g.fillRect(x, 492, 16, 192);
    }
    g.lineStyle(2, THEME.colors.hallLine, 0.45);
    for (let x = 0; x < side.worldWidth; x += 32) g.lineBetween(x, 492, x, 684);
    for (let y = 492; y <= 684; y += 32) g.lineBetween(0, y, side.worldWidth, y);

    for (let x = 120; x < side.worldWidth; x += 260) {
      this.drawSidePoster(g, x, 424);
      this.drawSideExtinguisher(g, x + 92, 438);
    }

    for (const room of side.backgroundRooms) {
      this.drawSideRoom(g, room.x, 168, room.width, 246, room.label, room.kind, room.floor);
    }

    for (const transition of side.stairTransitions ?? []) {
      this.drawSideStairs(g, transition.trigger, transition.toFloor);
    }

    this.add
      .text(52, 124, `${side.initialFloor}F 廊下`, {
        fontFamily: THEME.font,
        fontSize: '20px',
        color: '#2f2418',
        backgroundColor: '#fff7d6',
        padding: { x: 7, y: 3 }
      })
      .setDepth(5);
  }

  private drawSideRoom(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, label: string, kind: RoomConfig['kind'], floor: number): void {
    const color = this.getRoomColor({ kind, label, x, y, width, height, door: { x, y } });
    g.fillStyle(color.base, 1);
    g.fillRect(x, y, width, height);
    g.lineStyle(4, THEME.colors.mapBorder, 1);
    g.strokeRect(x, y, width, height);

    g.fillStyle(color.dark, 1);
    g.fillRect(x + 18, y + 26, width - 36, 34);
    g.fillStyle(THEME.colors.window, 1);
    for (let wx = x + 26; wx < x + width - 34; wx += 48) {
      g.fillRect(wx, y + 78, 32, 34);
      g.fillStyle(THEME.colors.windowLight, 0.8);
      g.fillRect(wx + 6, y + 84, 12, 6);
      g.fillStyle(THEME.colors.window, 1);
    }

    g.fillStyle(THEME.colors.door, 1);
    g.fillRect(x + width - 42, y + height - 86, 30, 86);
    g.fillStyle(0x3b2314, 1);
    g.fillRect(x + width - 18, y + height - 44, 4, 4);

    const deskColor = kind === 'science' ? 0x1f9e95 : kind === 'library' ? 0x8b5a2b : 0x9b6b35;
    g.fillStyle(deskColor, 0.9);
    for (let dx = x + 24; dx < x + width - 70; dx += 44) {
      g.fillRect(dx, y + 150, 28, 18);
      g.fillRect(dx, y + 188, 28, 18);
    }

    this.add
      .text(x + 16, y + 12, `${floor}F ${label}`, {
        fontFamily: THEME.font,
        fontSize: '16px',
        color: THEME.colors.plateText,
        backgroundColor: '#fff7d6',
        padding: { x: 5, y: 2 }
      })
      .setDepth(8);
  }

  private drawSidePoster(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(THEME.colors.board, 1);
    g.fillRect(x, y, 72, 38);
    g.lineStyle(3, THEME.colors.boardTrim, 1);
    g.strokeRect(x, y, 72, 38);
    g.fillStyle(0xfef3c7, 1);
    g.fillRect(x + 8, y + 10, 44, 4);
    g.fillRect(x + 8, y + 22, 56, 4);
  }

  private drawSideExtinguisher(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(THEME.colors.fireRed, 1);
    g.fillRect(x, y, 12, 32);
    g.fillStyle(0xfef2f2, 1);
    g.fillRect(x + 3, y + 9, 6, 5);
  }

  private drawSideStairs(g: Phaser.GameObjects.Graphics, trigger: RectConfig, toFloor: number): void {
    g.fillStyle(THEME.colors.stairsA, 1);
    g.fillRect(trigger.x, 500, trigger.width, 150);
    g.lineStyle(4, THEME.colors.goalFrame, 1);
    g.strokeRect(trigger.x + 2, 500, trigger.width - 4, 150);
    g.lineStyle(3, 0x4b5563, 0.9);
    for (let y = 518; y < 640; y += 18) {
      g.lineBetween(trigger.x + 10, y, trigger.x + trigger.width - 10, y);
    }
    this.add
      .text(trigger.x + trigger.width / 2, 522, `階段\n${toFloor}Fへ`, {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: '#111827',
        align: 'center',
        backgroundColor: '#fff7d6',
        padding: { x: 5, y: 3 }
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private createSideTeacher(config: SideScrollTeacherConfig, side: SideScrollConfig): SideTeacherRuntime {
    const y = config.type === 'classroom_watch' ? side.floorY - 214 : side.floorY - 22;
    const body = this.add.container(config.x, y).setDepth(config.type === 'classroom_watch' ? 28 : 45);
    const shadow = this.add.ellipse(0, 18, 28, 9, 0x000000, 0.18);
    const suit = this.add.rectangle(0, 2, 25, 34, THEME.colors.teacherSuit, 1).setStrokeStyle(3, 0xffffff, 0.75);
    const face = this.add.rectangle(0, -20, 18, 15, THEME.colors.teacherFace, 1).setStrokeStyle(2, 0x5c321d, 0.8);
    const hair = this.add.rectangle(0, -27, 18, 5, 0x292524, 1);
    const label = this.add
      .text(0, 2, '先生', {
        fontFamily: THEME.font,
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    body.add([shadow, suit, face, hair, label]);

    return {
      config,
      x: config.x,
      direction: config.direction,
      state: config.type === 'classroom_watch' ? 'hidden' : 'active',
      elapsed: 0,
      body,
      vision: this.add.graphics().setDepth(24)
    };
  }

  private updateSideTeachers(delta: number, side: SideScrollConfig): void {
    for (const teacher of this.sideTeachers) {
      teacher.vision.clear();
      teacher.activeVision = undefined;
      teacher.warningVision = undefined;

      if (teacher.config.type === 'hallway_patrol') {
        this.updateSidePatrolTeacher(teacher, delta);
        teacher.activeVision = this.createSideVisionRect(teacher.x, side.floorY, teacher.direction, teacher.config.visionWidth, teacher.config.visionHeight);
      } else if (teacher.config.type === 'hallway_static') {
        teacher.activeVision = this.createSideVisionRect(teacher.x, side.floorY, teacher.direction, teacher.config.visionWidth, teacher.config.visionHeight);
      } else {
        this.updateSideClassroomWatchTeacher(teacher, delta, side);
      }

      teacher.body.setX(teacher.x);
      teacher.body.setScale(teacher.direction === 'left' ? -1 : 1, 1);
      if (teacher.config.floor !== this.currentFloor) {
        teacher.body.setAlpha(0.35);
        continue;
      }
      teacher.body.setAlpha(1);
      if (teacher.warningVision) this.drawSideVision(teacher.vision, teacher.warningVision, THEME.colors.warningVision, 0.34);
      if (teacher.activeVision) this.drawSideVision(teacher.vision, teacher.activeVision, THEME.colors.dangerVision, 0.38);
    }
  }

  private updateSidePatrolTeacher(teacher: SideTeacherRuntime, delta: number): void {
    const minX = teacher.config.patrolMinX ?? teacher.config.x - 120;
    const maxX = teacher.config.patrolMaxX ?? teacher.config.x + 120;
    const speed = teacher.config.speed ?? 48;
    teacher.x += (teacher.direction === 'right' ? 1 : -1) * speed * (delta / 1000);
    if (teacher.x >= maxX) {
      teacher.x = maxX;
      teacher.direction = 'left';
    } else if (teacher.x <= minX) {
      teacher.x = minX;
      teacher.direction = 'right';
    }
  }

  private updateSideClassroomWatchTeacher(teacher: SideTeacherRuntime, delta: number, side: SideScrollConfig): void {
    teacher.elapsed += delta;
    const hiddenMs = teacher.config.hiddenMs ?? 2200;
    const warningMs = teacher.config.warningMs ?? 900;
    const watchingMs = teacher.config.watchingMs ?? 1500;
    const duration = teacher.state === 'hidden' ? hiddenMs : teacher.state === 'warning' ? warningMs : watchingMs;
    if (teacher.elapsed >= duration) {
      teacher.elapsed = 0;
      teacher.state = teacher.state === 'hidden' ? 'warning' : teacher.state === 'warning' ? 'watching' : 'hidden';
    }

    const rect = this.createSideVisionRect(teacher.x, side.floorY, teacher.direction, teacher.config.visionWidth, teacher.config.visionHeight);
    if (teacher.state === 'warning') teacher.warningVision = rect;
    if (teacher.state === 'watching') teacher.activeVision = rect;
  }

  private createSideVisionRect(x: number, floorY: number, direction: SideScrollDirection, width: number, height: number): Phaser.Geom.Rectangle {
    const rectX = direction === 'right' ? x + 20 : x - width - 20;
    return new Phaser.Geom.Rectangle(rectX, floorY - height, width, height);
  }

  private drawSideVision(g: Phaser.GameObjects.Graphics, rect: Phaser.Geom.Rectangle, color: number, alpha: number): void {
    g.fillStyle(color, alpha);
    g.fillRectShape(rect);
    g.lineStyle(3, 0xffedd5, 0.68);
    g.strokeRectShape(rect);
  }

  private isPointInSideTeacherVision(point: Phaser.Math.Vector2): boolean {
    return this.sideTeachers.some((teacher) => teacher.config.floor === this.currentFloor && teacher.activeVision && Phaser.Geom.Rectangle.Contains(teacher.activeVision, point.x, point.y - 12));
  }

  private isNearSideTeacherVision(point: Phaser.Math.Vector2, padding: number): boolean {
    return this.sideTeachers.some((teacher) => {
      if (teacher.config.floor !== this.currentFloor || !teacher.activeVision) return false;
      const rect = Phaser.Geom.Rectangle.Clone(teacher.activeVision);
      rect.x -= padding;
      rect.y -= padding;
      rect.width += padding * 2;
      rect.height += padding * 2;
      return Phaser.Geom.Rectangle.Contains(rect, point.x, point.y - 12);
    });
  }

  private findSideStairTransition(side: SideScrollConfig, x: number, y: number): StairTransitionConfig | undefined {
    return side.stairTransitions?.find(
      (transition) => transition.fromFloor === this.currentFloor && x >= transition.trigger.x - 90 && x <= transition.trigger.x + transition.trigger.width + 40 && y >= 0
    );
  }

  private finish(cleared: boolean, reason?: string): void {
    this.finished = true;
    if (cleared) {
      ProgressManager.clearLevel(this.level.id);
    }

    this.scene.start('ResultScene', {
      levelId: this.level.id,
      cleared,
      clearTime: this.level.timeLimit - Math.max(0, this.remainingMs / 1000),
      dashCount: this.dashCount,
      reason
    });
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.hud.setPaused(this.paused);

    if (this.paused) {
      const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);
      const panel = this.add.rectangle(GAME_WIDTH / 2, 406, 306, 360, 0x111827, 0.94).setStrokeStyle(2, 0xffffff, 0.22);
      const label = this.add
        .text(GAME_WIDTH / 2, 266, '一時停止', {
          fontFamily: THEME.font,
          fontSize: '28px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#15101d',
          strokeThickness: 5
        })
        .setOrigin(0.5);
      const retry = this.createPauseButton(314, 'リトライ', () => this.scene.start('GameScene', { levelId: this.level.id }));
      const map = this.createPauseButton(374, '校舎図へ戻る', () => this.scene.start('SchoolMapScene'));
      const title = this.createPauseButton(434, 'タイトルへ戻る', () => this.scene.start('TitleScene'));
      const volume = this.createPauseButton(494, `音量 ${this.soundEnabled ? 'ON' : 'OFF'}`, () => {
        this.soundEnabled = !this.soundEnabled;
        this.sound.mute = !this.soundEnabled;
        volume.text.setText(`音量 ${this.soundEnabled ? 'ON' : 'OFF'}`);
      });
      const resume = this.createPauseButton(558, 'ゲームに戻る', () => this.togglePause(), 0xfde68a);
      this.pauseOverlay = this.add
        .container(0, 0, [dim, panel, label, retry.rect, retry.text, map.rect, map.text, title.rect, title.text, volume.rect, volume.text, resume.rect, resume.text])
        .setDepth(1200)
        .setScrollFactor(0);
    } else {
      this.pauseOverlay?.destroy(true);
      this.pauseOverlay = undefined;
    }
  }

  private createPauseButton(y: number, label: string, onClick: () => void, color = 0xffffff): { rect: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const rect = this.add.rectangle(GAME_WIDTH / 2, y, 244, 48, color, 0.94).setStrokeStyle(3, THEME.colors.uiBorder, 0.9).setInteractive({ useHandCursor: true });
    const text = this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: THEME.font,
        fontSize: '19px',
        color: '#111827',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    rect.on('pointerdown', () => rect.setScale(0.98));
    rect.on('pointerup', () => {
      rect.setScale(1);
      onClick();
    });
    rect.on('pointerout', () => rect.setScale(1));
    return { rect, text };
  }

  private showLevelIntroIfNeeded(): void {
    if (this.level.id === 1 && this.hasSeenLevel1Tutorial()) {
      return;
    }

    const lines = this.getIntroLines();
    if (lines.length === 0) {
      return;
    }

    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.48);
    const panelHeight = this.level.id === 1 ? 334 : 214;
    const panel = this.add.rectangle(GAME_WIDTH / 2, 360, 324, panelHeight, THEME.colors.uiPanel, 0.96).setStrokeStyle(4, THEME.colors.uiBorder, 0.95);
    const title = this.add
      .text(GAME_WIDTH / 2, this.level.id === 1 ? 232 : 304, `Level ${this.level.id}`, {
        fontFamily: THEME.font,
        fontSize: '27px',
        color: THEME.colors.uiText,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const body = this.add
      .text(GAME_WIDTH / 2, this.level.id === 1 ? 338 : 365, lines.join('\n'), {
        fontFamily: THEME.font,
        fontSize: '18px',
        color: '#fff5d6',
        align: 'left',
        lineSpacing: 9,
        stroke: '#15101d',
        strokeThickness: 3
      })
      .setOrigin(0.5);

    const buttonY = this.level.id === 1 ? 500 : 446;
    const button = this.add.rectangle(GAME_WIDTH / 2, buttonY, 220, 50, THEME.colors.goalFrame, 0.96).setStrokeStyle(3, 0xffffff, 0.35).setInteractive({ useHandCursor: true });
    const buttonText = this.add
      .text(GAME_WIDTH / 2, buttonY, 'はじめる', {
        fontFamily: THEME.font,
        fontSize: '20px',
        color: '#2f2418',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const close = () => {
      if (this.level.id === 1) {
        window.localStorage.setItem(GameScene.LEVEL1_TUTORIAL_KEY, '1');
      }
      this.tutorialOverlay?.destroy(true);
      this.tutorialOverlay = undefined;
    };
    button.on('pointerup', close);
    dim.setInteractive();
    dim.on('pointerup', close);
    this.input.once('pointerdown', close);
    this.tutorialOverlay = this.add.container(0, 0, [dim, panel, title, body, button, buttonText]).setDepth(1400).setScrollFactor(0);
  }

  private getIntroLines(): string[] {
    if (this.level.id === 1) {
      return ['左のスティックで移動', '右のDASH長押しで走る', '先生の視界で走るとアウト', '歩くだけなら見られてもセーフ', '玄関ホールまで行こう'];
    }
    return this.level.introText ? [this.level.introText] : [];
  }

  private hasSeenLevel1Tutorial(): boolean {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(GameScene.LEVEL1_TUTORIAL_KEY) === '1';
  }

  private drawDangerFrame(): void {
    if (!this.dangerFrame) return;
    this.dangerFrame.clear();
    this.dangerFrame.fillStyle(0xef4444, 1);
    this.dangerFrame.fillRect(0, 0, GAME_WIDTH, 12);
    this.dangerFrame.fillRect(0, GAME_HEIGHT - 12, GAME_WIDTH, 12);
    this.dangerFrame.fillRect(0, 0, 12, GAME_HEIGHT);
    this.dangerFrame.fillRect(GAME_WIDTH - 12, 0, 12, GAME_HEIGHT);
  }

  private updateDangerFrame(active: boolean): void {
    if (!this.dangerFrame) return;
    this.dangerFrame.setAlpha(active ? 0.2 + Math.sin(this.time.now * 0.022) * 0.16 : 0);
  }

  private drawSchoolFloor(): void {
    const g = this.add.graphics();
    g.fillStyle(THEME.colors.mapBg, 1);
    g.fillRect(32, 104, 326, 600);
    g.lineStyle(4, THEME.colors.mapBorder, 1);
    g.strokeRect(32, 104, 326, 600);
    g.lineStyle(2, THEME.colors.wallShadow, 1);
    g.strokeRect(38, 110, 314, 588);

    this.drawRooms(g);
    this.drawWalkableTiles(g);
    this.drawProps(g);

    this.add
      .text(44, 112, this.level.map.floorLabel, {
        fontFamily: THEME.font,
        fontSize: '18px',
        color: '#8b4513',
        fontStyle: 'bold',
        backgroundColor: '#fff7d6',
        padding: { x: 5, y: 2 }
      })
      .setDepth(8);

    this.add
      .text(this.level.playerStart.x - 32, this.level.playerStart.y - 34, this.level.startLabel, {
        fontFamily: THEME.font,
        fontSize: '14px',
        color: '#fff5d6',
        backgroundColor: '#2b2435',
        padding: { x: 4, y: 2 },
        wordWrap: { width: 110 }
      })
      .setDepth(10);
  }

  private drawWalkableTiles(g: Phaser.GameObjects.Graphics): void {
    const tile = 16;
    for (const rect of this.level.map.walkable) {
      for (let y = rect.y; y < rect.y + rect.height; y += tile) {
        for (let x = rect.x; x < rect.x + rect.width; x += tile) {
          const checker = ((x / tile + y / tile) % 2) === 0;
          const isEntrance = this.level.map.props.some((prop) => prop.kind === 'entrance' && this.rectContains(prop, x + 8, y + 8));
          const isStairs = this.level.map.props.some((prop) => prop.kind === 'stairs' && this.rectContains(prop, x + 8, y + 8));
          if (isEntrance) {
            g.fillStyle(checker ? THEME.colors.entranceA : THEME.colors.entranceB, 1);
          } else if (isStairs) {
            g.fillStyle(checker ? THEME.colors.stairsA : THEME.colors.stairsB, 1);
          } else {
            g.fillStyle(checker ? THEME.colors.hallA : THEME.colors.hallB, 1);
          }
          g.fillRect(x, y, tile, tile);
          g.lineStyle(1, THEME.colors.hallLine, 0.32);
          g.strokeRect(x, y, tile, tile);
        }
      }
      g.lineStyle(3, THEME.colors.hallLine, 0.95);
      g.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  }

  private drawRooms(g: Phaser.GameObjects.Graphics): void {
    for (const room of this.level.map.rooms) {
      const color = this.getRoomColor(room);
      g.fillStyle(color.base, 1);
      g.fillRect(room.x, room.y, room.width, room.height);
      g.lineStyle(3, THEME.colors.mapBorder, 1);
      g.strokeRect(room.x, room.y, room.width, room.height);

      g.fillStyle(color.dark, 1);
      g.fillRect(room.x + 8, room.y + 26, room.width - 16, 10);
      g.fillStyle(THEME.colors.window, 1);
      g.fillRect(room.x + 12, room.y + 40, 20, 18);
      g.fillRect(room.x + 36, room.y + 40, 20, 18);
      g.fillStyle(THEME.colors.windowLight, 0.85);
      g.fillRect(room.x + 15, room.y + 43, 6, 5);
      g.fillRect(room.x + 39, room.y + 43, 6, 5);

      this.drawRoomSpecifics(g, room, color.dark);
      this.drawDoor(g, room);
      this.addRoomLabel(room);
    }
  }

  private drawRoomSpecifics(g: Phaser.GameObjects.Graphics, room: RoomConfig, dark: number): void {
    if (room.kind === 'science') {
      g.fillStyle(0x5eead4, 0.95);
      g.fillRect(room.x + 16, room.y + room.height - 32, 46, 10);
      g.fillStyle(0x0891b2, 1);
      g.fillRect(room.x + 64, room.y + 76, 10, 22);
      this.addRoomIcon(room, '⚗', '#0f766e');
    } else if (room.kind === 'library') {
      for (let i = 0; i < 4; i += 1) {
        g.fillStyle(i % 2 === 0 ? 0x92400e : 0x1d4ed8, 1);
        g.fillRect(room.x + 14 + i * 14, room.y + room.height - 36, 8, 28);
      }
      this.addRoomIcon(room, '本', '#78350f');
    } else if (room.kind === 'music') {
      g.fillStyle(0x111827, 1);
      g.fillRect(room.x + 16, room.y + room.height - 38, 44, 18);
      g.fillStyle(0xffffff, 1);
      g.fillRect(room.x + 20, room.y + room.height - 34, 30, 5);
      this.addRoomIcon(room, '♪', '#9d174d');
    } else if (room.kind === 'nurse') {
      g.fillStyle(0xffffff, 0.85);
      g.fillRect(room.x + 12, room.y + 66, room.width - 24, 18);
      g.fillStyle(THEME.colors.fireRed, 1);
      g.fillRect(room.x + 42, room.y + 88, 12, 4);
      g.fillRect(room.x + 46, room.y + 84, 4, 12);
      this.addRoomIcon(room, '+', '#dc2626');
    } else if (room.kind === 'staff') {
      g.fillStyle(0x78350f, 1);
      g.fillRect(room.x + 14, room.y + room.height - 32, 56, 14);
      g.fillStyle(0xfef3c7, 1);
      g.fillRect(room.x + 18, room.y + room.height - 46, 18, 10);
    } else {
      g.fillStyle(dark, 0.8);
      g.fillRect(room.x + 18, room.y + room.height - 28, 48, 12);
    }
  }

  private drawDoor(g: Phaser.GameObjects.Graphics, room: RoomConfig): void {
    g.fillStyle(THEME.colors.doorDark, 1);
    g.fillRect(room.door.x - 8, room.door.y - 20, 16, 40);
    g.fillStyle(THEME.colors.door, 1);
    g.fillRect(room.door.x - 6, room.door.y - 18, 12, 36);
    g.fillStyle(THEME.colors.uiBorder, 1);
    g.fillRect(room.door.x + 2, room.door.y, 3, 3);
    g.fillStyle(0x3b2314, 0.8);
    g.fillRect(room.door.x - 4, room.door.y - 14, 2, 28);
  }

  private addRoomLabel(room: RoomConfig): void {
    const label = room.label === '職員室' ? '職員室前' : room.label;
    this.add
      .text(room.x + room.width / 2, room.y + 12, label, {
        fontFamily: THEME.font,
        fontSize: '12px',
        color: THEME.colors.plateText,
        backgroundColor: '#fff7d6',
        padding: { x: 3, y: 1 }
      })
      .setOrigin(0.5)
      .setDepth(9);
  }

  private drawProps(g: Phaser.GameObjects.Graphics): void {
    for (const prop of this.level.map.props) {
      if (prop.kind === 'window') {
        g.fillStyle(THEME.colors.window, 1);
        g.fillRect(prop.x, prop.y, prop.width, prop.height);
        g.fillStyle(THEME.colors.windowLight, 0.85);
        g.fillRect(prop.x + 4, prop.y + 3, Math.max(8, prop.width - 18), 3);
        g.lineStyle(2, THEME.colors.windowLight, 1);
        g.strokeRect(prop.x, prop.y, prop.width, prop.height);
      } else if (prop.kind === 'board') {
        g.fillStyle(THEME.colors.board, 1);
        g.fillRect(prop.x, prop.y, prop.width, prop.height);
        g.lineStyle(2, THEME.colors.boardTrim, 1);
        g.strokeRect(prop.x, prop.y, prop.width, prop.height);
        g.fillStyle(0xfef3c7, 1);
        g.fillRect(prop.x + 6, prop.y + 8, prop.width - 12, 3);
        g.fillRect(prop.x + 6, prop.y + 18, prop.width - 20, 3);
        this.addMapLabel(prop, '#f7fee7');
      } else if (prop.kind === 'shoebox') {
        this.drawShoeBox(g, prop);
      } else if (prop.kind === 'extinguisher') {
        g.fillStyle(THEME.colors.fireRed, 1);
        g.fillRect(prop.x, prop.y + 6, prop.width, prop.height - 6);
        g.fillStyle(0xfef2f2, 1);
        g.fillRect(prop.x + 3, prop.y + 10, prop.width - 6, 4);
      } else if (prop.kind === 'stairs') {
        this.drawStairs(g, prop);
      } else if (prop.kind === 'entrance') {
        g.lineStyle(3, THEME.colors.goalFrame, 0.95);
        g.strokeRect(prop.x + 4, prop.y + 4, prop.width - 8, prop.height - 8);
        this.addMapLabel(prop, '#5c3a00');
      } else if (prop.kind === 'poster') {
        g.fillStyle(0xf97316, 1);
        g.fillRect(prop.x, prop.y, prop.width, prop.height);
        g.fillStyle(0xfef3c7, 1);
        g.fillRect(prop.x + 5, prop.y + 6, prop.width - 10, 4);
        this.addMapLabel(prop, '#fff7ed');
      }
    }
  }

  private drawShoeBox(g: Phaser.GameObjects.Graphics, prop: MapPropConfig): void {
    g.fillStyle(THEME.colors.shoeBoxDark, 1);
    g.fillRect(prop.x - 2, prop.y - 2, prop.width + 4, prop.height + 4);
    g.fillStyle(THEME.colors.shoeBox, 1);
    g.fillRect(prop.x, prop.y, prop.width, prop.height);
    g.lineStyle(1, THEME.colors.uiBorder, 0.75);
    for (let x = prop.x + 8; x < prop.x + prop.width; x += 16) {
      g.lineBetween(x, prop.y, x, prop.y + prop.height);
    }
  }

  private drawStairs(g: Phaser.GameObjects.Graphics, prop: MapPropConfig): void {
    g.fillStyle(THEME.colors.stairsA, 1);
    g.fillRect(prop.x, prop.y, prop.width, prop.height);
    g.lineStyle(4, THEME.colors.goalFrame, 0.95);
    g.strokeRect(prop.x + 2, prop.y + 2, prop.width - 4, prop.height - 4);
    g.fillStyle(THEME.colors.stairsB, 0.88);
    g.fillRect(prop.x + 12, prop.y + 12, prop.width - 24, prop.height - 24);
    g.lineStyle(3, 0x374151, 0.95);
    for (let y = prop.y + 18; y < prop.y + prop.height - 10; y += 10) {
      g.lineBetween(prop.x + 18, y, prop.x + prop.width - 18, y);
    }
    const arrowX = prop.x + prop.width - 24;
    const arrowY = prop.y + prop.height / 2;
    g.fillStyle(THEME.colors.goalFrame, 1);
    g.fillTriangle(arrowX - 10, arrowY + 7, arrowX + 10, arrowY + 7, arrowX, arrowY - 10);
    this.addMapLabel(prop, '#111827');
  }

  private addMapLabel(prop: MapPropConfig, color: string): void {
    if (!prop.label) return;
    this.add
      .text(prop.x + prop.width / 2, prop.y + prop.height / 2, prop.label, {
        fontFamily: THEME.font,
        fontSize: '14px',
        color,
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: prop.kind === 'stairs' ? '#fff7d6' : undefined,
        padding: prop.kind === 'stairs' ? { x: 4, y: 2 } : undefined,
        wordWrap: { width: prop.width - 8 }
      })
      .setOrigin(0.5)
      .setDepth(9);
  }

  private getRoomColor(room: RoomConfig): { base: number; dark: number } {
    if (room.kind === 'science') return { base: 0x92e0dc, dark: 0x0e7490 };
    if (room.kind === 'music') return { base: 0xf7b7d7, dark: 0x9d174d };
    if (room.kind === 'library') return { base: 0xd9b06f, dark: 0x78350f };
    if (room.kind === 'nurse') return { base: 0xf8fafc, dark: 0x94a3b8 };
    if (room.kind === 'staff') return { base: 0xf8c861, dark: 0x92400e };
    if (room.kind === 'storage') return { base: 0xcbd5e1, dark: 0x475569 };
    return { base: 0xc5dfa8, dark: 0x356b31 };
  }

  private addRoomIcon(room: RoomConfig, icon: string, color: string): void {
    this.add
      .text(room.x + room.width - 18, room.y + room.height - 22, icon, {
        fontFamily: THEME.font,
        fontSize: '17px',
        color,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(9);
  }

  private canPlayerMoveTo(x: number, y: number, radius: number): boolean {
    const points = [
      { x, y },
      { x: x - radius, y },
      { x: x + radius, y },
      { x, y: y - radius },
      { x, y: y + radius }
    ];
    return points.every((point) => this.isPointWalkable(point.x, point.y)) && !this.isCircleBlocked(x, y, radius);
  }

  private isPointWalkable(x: number, y: number): boolean {
    return this.isPointOnWalkableFloor(x, y) && !this.level.map.blocking.some((rect) => this.rectContains(rect, x, y));
  }

  private isPointOnWalkableFloor(x: number, y: number): boolean {
    return this.level.map.walkable.some((rect) => this.rectContains(rect, x, y));
  }

  private rectContains(rect: RectConfig, x: number, y: number): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  private isInDashDisabledZone(x: number, y: number): boolean {
    return Boolean(this.level.map.dashDisabledZones?.some((rect) => this.rectContains(rect, x, y)));
  }

  private findStairTransition(x: number, y: number): StairTransitionConfig | undefined {
    return this.level.map.stairTransitions?.find((transition) => transition.fromFloor === this.currentFloor && this.rectContains(transition.trigger, x, y));
  }

  private startFloorTransition(transition: StairTransitionConfig): void {
    this.isFloorTransitioning = true;
    this.wasDashing = false;
    this.updateDangerFrame(false);

    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.82).setScrollFactor(0);
    const panel = this.add.rectangle(GAME_WIDTH / 2, 382, 318, 182, THEME.colors.uiPanel, 0.98).setStrokeStyle(5, THEME.colors.uiBorder, 1).setScrollFactor(0);
    const label = this.add
      .text(GAME_WIDTH / 2, 356, transition.label, {
        fontFamily: THEME.font,
        fontSize: '26px',
        color: THEME.colors.uiText,
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 5,
        align: 'center'
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    const sub = this.add
      .text(GAME_WIDTH / 2, 414, `${transition.fromFloor}F → ${transition.toFloor}F`, {
        fontFamily: THEME.font,
        fontSize: '22px',
        color: '#ffe66d',
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    const overlay = this.add.container(0, 0, [dim, panel, label, sub]).setDepth(1600).setScrollFactor(0);

    this.time.delayedCall(700, () => {
      this.player.setPosition(transition.destinationSpawn.x, transition.destinationSpawn.y);
      this.currentFloor = transition.toFloor;
      this.hud.setFloor(this.getFloorLabel(this.currentFloor));
      this.stairNoticeShown = false;

      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 260,
        delay: 220,
        onComplete: () => {
          overlay.destroy(true);
          this.isFloorTransitioning = false;
        }
      });
    });
  }

  private canClearOnCurrentFloor(): boolean {
    return this.level.goalFloor === undefined || this.level.goalFloor === this.currentFloor;
  }

  private getFloorLabel(floor: number): string {
    return `${floor}F`;
  }

  private showStairNotice(): void {
    if (this.stairNoticeShown || this.level.id < 4) return;
    this.stairNoticeShown = true;
    const notice = this.add
      .text(GAME_WIDTH / 2, 132, '階段はDASH不可', {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: '#2f2418',
        backgroundColor: '#fff7d6',
        padding: { x: 8, y: 5 }
      })
      .setOrigin(0.5)
      .setDepth(950)
      .setScrollFactor(0);
    this.tweens.add({
      targets: notice,
      alpha: 0,
      y: 106,
      duration: 900,
      delay: 450,
      onComplete: () => notice.destroy()
    });
  }

  private isCircleBlocked(x: number, y: number, radius: number): boolean {
    return this.level.map.blocking.some((rect) => this.circleIntersectsRect(x, y, radius, rect));
  }

  private circleIntersectsRect(x: number, y: number, radius: number, rect: RectConfig): boolean {
    const nearestX = Phaser.Math.Clamp(x, rect.x, rect.x + rect.width);
    const nearestY = Phaser.Math.Clamp(y, rect.y, rect.y + rect.height);
    return Phaser.Math.Distance.Squared(x, y, nearestX, nearestY) < radius * radius;
  }

  private shouldEnableDebug(): boolean {
    if (!DEBUG_MODE || typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debug');
  }

  private createDebugOverlay(): void {
    if (DEBUG_MODE && this.input.keyboard) {
      this.input.keyboard.on('keydown-D', () => {
        this.debugEnabled = !this.debugEnabled;
        this.debugText?.setVisible(this.debugEnabled);
        this.debugGraphics?.setVisible(this.debugEnabled);
      });
    }

    this.debugText = this.add
      .text(10, 690, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 4 }
      })
      .setDepth(1300)
      .setScrollFactor(0)
      .setVisible(this.debugEnabled);
  }

  private drawCollisionDebug(): void {
    this.debugGraphics?.destroy();
    this.debugGraphics = this.add.graphics().setDepth(850).setVisible(this.debugEnabled);

    this.debugGraphics.fillStyle(0x22c55e, 0.12);
    this.debugGraphics.lineStyle(1, 0x22c55e, 0.45);
    for (const rect of this.level.map.walkable) {
      this.debugGraphics.fillRect(rect.x, rect.y, rect.width, rect.height);
      this.debugGraphics.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    this.debugGraphics.fillStyle(0xef4444, 0.18);
    this.debugGraphics.lineStyle(2, 0xef4444, 0.7);
    for (const rect of this.level.map.blocking) {
      this.debugGraphics.fillRect(rect.x, rect.y, rect.width, rect.height);
      this.debugGraphics.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  }

  private updateDebugOverlay(isDashing: boolean, isInTeacherVision: boolean, inputSource: string): void {
    if (!this.debugEnabled || !this.debugText || !this.player) return;
    const x = Math.round(this.player.x);
    const y = Math.round(this.player.y);
    const floor = this.isPointOnWalkableFloor(this.player.x, this.player.y);
    const walkable = this.isPointWalkable(this.player.x, this.player.y) && !this.isCircleBlocked(this.player.x, this.player.y, 13);
    this.debugText.setText([
      `Level: ${this.level.id}`,
      `Floor: ${this.currentFloor}F`,
      `Player: ${x}, ${y}`,
      `Time: ${(this.remainingMs / 1000).toFixed(1)}`,
      `floor: ${floor ? 'walkable' : 'void'}`,
      `current: ${walkable ? 'walkable' : 'blocked'}`,
      `isDashing: ${isDashing}`,
      `isInTeacherVision: ${isInTeacherVision}`,
      `teacher: ${this.teachers.map((teacher) => teacher.getDebugState()).join(',')}`,
      `input: ${inputSource}`
    ]);
  }
}
