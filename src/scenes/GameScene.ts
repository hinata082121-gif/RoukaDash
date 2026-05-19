import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { DEBUG_MODE } from '../config/releaseConfig';
import { SIDE_LAYOUT, SIDE_VISUAL, THEME } from '../config/visualTheme';
import { Goal } from '../entities/Goal';
import { Player } from '../entities/Player';
import { Student } from '../entities/Student';
import { Teacher } from '../entities/Teacher';
import { SideScrollRenderer } from '../renderers/SideScrollRenderer';
import type { LevelConfig, MapPropConfig, RectConfig, RoomConfig, StairTransitionConfig } from '../types/LevelTypes';
import type { SideScrollConfig, SideScrollDirection, SideScrollMetrics, SideScrollTeacherConfig, SideScrollTeacherState } from '../types/SideScrollTypes';
import { Hud } from '../ui/Hud';
import { InputManager } from '../systems/InputManager';
import { LevelManager } from '../systems/LevelManager';
import { ProgressManager } from '../systems/ProgressManager';
import { VisionSystem } from '../systems/VisionSystem';
import { buildSideScrollMetrics } from '../utils/sideScrollMetrics';

interface SideTeacherRuntime {
  config: SideScrollTeacherConfig;
  x: number;
  direction: SideScrollDirection;
  state: SideScrollTeacherState;
  elapsed: number;
  body: Phaser.GameObjects.Container;
  vision: Phaser.GameObjects.Graphics;
  visualScale: number;
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
  private sideMetrics?: SideScrollMetrics;

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
    this.sideMetrics = buildSideScrollMetrics(GAME_WIDTH, GAME_HEIGHT, SIDE_LAYOUT);
    const walkY = this.sideMetrics.walkY;

    SideScrollRenderer.render(this, side, this.sideMetrics);
    this.goal = new Goal(this, side.goalX - 26, walkY - 86, 64, 82, this.level.goalLabel);
    this.player = new Player(this, side.startX, walkY);
    this.player.setDepth(50);
    this.sideTeachers = side.teachers.map((teacher) => this.createSideTeacher(teacher, side));
    side.students.forEach((student) => {
      const isClassroom = student.layer === 'classroom';
      const y = isClassroom ? this.sideMetrics!.sillY + 12 : walkY - 20;
      const sprite = new Student(this, student.x, y, student.color, isClassroom ? SIDE_VISUAL.studentScaleClassroomStanding : SIDE_VISUAL.studentScaleHallway, isClassroom ? 27 : 43);
      if (isClassroom) sprite.setAlpha(0.86);
    });

    this.inputManager = new InputManager(this, 'horizontalButtons');
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

    const walkY = this.sideMetrics?.walkY ?? side.floorY;
    this.player.updateSideScroll(input, delta, walkY, 40, side.worldWidth - 40);
    const position = this.player.getPositionVector();

    const stairTransition = this.findSideStairTransition(side, position.x, position.y);
    if (stairTransition) {
      this.startFloorTransition(stairTransition);
      return;
    }

    this.updateSideTeachers(delta, side);
    const isInTeacherVision = this.isPointInSideTeacherVision(position);
    this.hud.setGoalDirection(position, new Phaser.Math.Vector2(this.sideGoalX, walkY - 56));
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
    const wallY = 112;
    const roomY = 158;
    const hallwayBackY = SIDE_VISUAL.hallwayBackY;
    const floorTopY = SIDE_VISUAL.floorTopY;
    const floorBottomY = SIDE_VISUAL.floorBottomY;
    const topInset = 42;
    const bottomOutset = -90;
    const floorLeftAt = (y: number) => Phaser.Math.Linear(topInset, bottomOutset, (y - floorTopY) / (floorBottomY - floorTopY));
    const floorRightAt = (y: number) => Phaser.Math.Linear(side.worldWidth - topInset, side.worldWidth - bottomOutset, (y - floorTopY) / (floorBottomY - floorTopY));

    g.fillStyle(0xf8f0dd, 1);
    g.fillRect(0, wallY, side.worldWidth, hallwayBackY - wallY);
    g.fillStyle(0xe7d6b7, 1);
    g.fillRect(0, hallwayBackY, side.worldWidth, floorTopY - hallwayBackY);
    g.lineStyle(5, 0xa88b62, 0.8);
    g.lineBetween(0, hallwayBackY, side.worldWidth, hallwayBackY);
    g.lineStyle(2, 0xfff7d6, 0.55);
    g.lineBetween(0, hallwayBackY + 10, side.worldWidth, hallwayBackY + 10);

    const floorBands = [
      { y1: floorTopY, y2: 512, color: 0xd5b16e },
      { y1: 512, y2: 560, color: 0xdfbf79 },
      { y1: 560, y2: 618, color: 0xe8cd8d },
      { y1: 618, y2: floorBottomY, color: 0xf0d99f }
    ];
    for (const band of floorBands) {
      g.fillStyle(band.color, 1);
      g.fillPoints(
        [
          new Phaser.Geom.Point(floorLeftAt(band.y1), band.y1),
          new Phaser.Geom.Point(floorRightAt(band.y1), band.y1),
          new Phaser.Geom.Point(floorRightAt(band.y2), band.y2),
          new Phaser.Geom.Point(floorLeftAt(band.y2), band.y2)
        ],
        true
      );
    }
    g.lineStyle(3, THEME.colors.hallLine, 0.42);
    for (const y of [500, 536, 580, 632, 684]) {
      g.lineBetween(floorLeftAt(y), y, floorRightAt(y), y);
    }
    g.lineStyle(2, THEME.colors.hallLine, 0.22);
    for (let x = 80; x < side.worldWidth; x += 180) {
      g.lineBetween(x, floorTopY, x - 84, floorBottomY);
      g.lineBetween(x + 90, floorTopY, x + 156, floorBottomY);
    }
    g.lineStyle(5, THEME.colors.hallWax, 0.34);
    for (let x = 54; x < side.worldWidth; x += 270) {
      g.lineBetween(x, 530, x + 116, 520);
      g.lineBetween(x + 38, 652, x + 178, 636);
    }
    g.lineStyle(4, 0xfff3c4, 0.46);
    g.lineBetween(0, side.floorY + 20, side.worldWidth, side.floorY + 20);

    for (let x = 120; x < side.worldWidth; x += 260) {
      this.drawSidePoster(g, x, 400);
      this.drawSideExtinguisher(g, x + 96, 428);
      this.drawSideUmbrellaStand(g, x + 154, 430);
    }
    for (let x = 330; x < side.worldWidth; x += 520) {
      this.drawSideCleaningCloset(g, x, 384);
    }

    for (const room of side.backgroundRooms) {
      this.drawSideRoom(g, room.x, roomY, room.width, 252, room.label, room.kind, room.floor);
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
    g.fillStyle(0xfff7d6, 0.9);
    g.fillRect(x + 28, y + 52, 24, 3);
    g.fillStyle(0xf87171, 0.85);
    g.fillRect(x + width - 64, y + 50, 18, 5);
    g.fillStyle(0xf2ddb4, 0.95);
    g.fillRect(x + 10, y + 122, width - 20, height - 132);
    g.lineStyle(2, 0xbc9865, 0.35);
    for (let tileY = y + 144; tileY < y + height - 12; tileY += 34) {
      g.lineBetween(x + 10, tileY, x + width - 10, tileY);
    }
    g.fillStyle(THEME.colors.window, 1);
    for (let wx = x + 26; wx < x + width - 34; wx += 48) {
      g.fillRect(wx, y + 78, 32, 34);
      g.fillStyle(THEME.colors.windowLight, 0.8);
      g.fillRect(wx + 6, y + 84, 12, 6);
      g.fillStyle(THEME.colors.curtain, 0.88);
      g.fillRect(wx - 4, y + 76, 5, 38);
      g.fillRect(wx + 31, y + 76, 5, 38);
      g.fillStyle(THEME.colors.window, 1);
    }

    g.fillStyle(THEME.colors.door, 1);
    g.fillRect(x + width - 42, y + height - 86, 30, 86);
    g.lineStyle(3, THEME.colors.doorDark, 0.8);
    g.strokeRect(x + width - 42, y + height - 86, 30, 86);
    g.fillStyle(THEME.colors.windowLight, 0.86);
    g.fillRect(x + width - 35, y + height - 74, 16, 16);
    g.fillStyle(0x3b2314, 1);
    g.fillRect(x + width - 18, y + height - 44, 4, 4);

    const deskColor = kind === 'science' ? 0x1f9e95 : kind === 'library' ? 0x8b5a2b : 0x9b6b35;
    g.fillStyle(deskColor, 0.9);
    for (let dx = x + 24; dx < x + width - 70; dx += 44) {
      g.fillRect(dx, y + 150, 28, 18);
      g.fillRect(dx, y + 188, 28, 18);
    }
    this.drawSideRoomDetail(g, x, y, width, height, kind, label);

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

  private drawSideRoomDetail(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, kind: RoomConfig['kind'], label: string): void {
    g.fillStyle(THEME.colors.paper, 0.95);
    g.fillRect(x + width - 76, y + 30, 14, 18);
    g.fillRect(x + width - 58, y + 32, 14, 16);

    if (kind === 'science') {
      g.fillStyle(0x1f9e95, 1);
      g.fillRect(x + 28, y + 156, width - 96, 22);
      g.fillStyle(0x9bdaf1, 1);
      g.fillTriangle(x + 48, y + 142, x + 38, y + 170, x + 58, y + 170);
      g.fillRect(x + 76, y + 144, 12, 26);
      g.fillStyle(0xe8fbff, 0.9);
      g.fillRect(x + 78, y + 150, 8, 8);
    } else if (kind === 'music') {
      g.fillStyle(0x292524, 1);
      g.fillRect(x + 28, y + 152, 58, 26);
      g.fillRect(x + 72, y + 132, 14, 46);
      g.fillStyle(0xfff7d6, 1);
      for (let keyX = x + 32; keyX < x + 80; keyX += 8) g.fillRect(keyX, y + 160, 5, 10);
      this.drawMusicNote(g, x + 118, y + 146);
      this.drawMusicNote(g, x + 144, y + 172);
    } else if (kind === 'library') {
      for (let shelfX = x + 24; shelfX < x + width - 82; shelfX += 36) {
        g.fillStyle(0x8b5a2b, 1);
        g.fillRect(shelfX, y + 132, 28, 84);
        for (let bookY = y + 140; bookY < y + 206; bookY += 14) {
          g.fillStyle(bookY % 28 === 0 ? 0x4f9ad8 : 0xf59e0b, 1);
          g.fillRect(shelfX + 4, bookY, 5, 10);
          g.fillStyle(0x71c562, 1);
          g.fillRect(shelfX + 12, bookY, 5, 10);
        }
      }
    } else if (kind === 'nurse') {
      g.fillStyle(0xffffff, 0.96);
      g.fillRect(x + 24, y + 148, 74, 32);
      g.fillStyle(0x93c5fd, 0.84);
      g.fillRect(x + 30, y + 154, 60, 18);
      g.fillStyle(0xef4444, 1);
      g.fillRect(x + 118, y + 136, 10, 34);
      g.fillRect(x + 106, y + 148, 34, 10);
      g.fillStyle(0xf8fafc, 0.9);
      g.fillRect(x + width - 84, y + 118, 16, 96);
      g.fillRect(x + width - 64, y + 118, 16, 96);
    } else if (kind === 'staff') {
      for (let deskX = x + 24; deskX < x + width - 84; deskX += 34) {
        g.fillStyle(0x8b5a2b, 1);
        g.fillRect(deskX, y + 134, 26, 22);
        g.fillStyle(0xfff7d6, 1);
        g.fillRect(deskX + 5, y + 138, 12, 5);
        g.fillRect(deskX + 9, y + 148, 12, 5);
      }
      g.fillStyle(THEME.colors.locker, 1);
      g.fillRect(x + width - 94, y + 128, 28, 76);
      g.lineStyle(2, 0x35505a, 0.7);
      g.lineBetween(x + width - 80, y + 132, x + width - 80, y + 200);
    } else if (kind === 'storage' || label.includes('玄関') || label.includes('下駄箱')) {
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          g.fillStyle(THEME.colors.shoeBox, 1);
          g.fillRect(x + 24 + col * 24, y + 134 + row * 24, 18, 16);
          g.fillStyle(THEME.colors.shoeBoxDark, 0.68);
          g.fillRect(x + 27 + col * 24, y + 139 + row * 24, 12, 3);
        }
      }
    } else {
      g.fillStyle(0x9b6b35, 1);
      g.fillRect(x + 26, y + 128, 46, 20);
      g.fillStyle(0xfff7d6, 1);
      g.fillRect(x + 32, y + 132, 18, 5);
      g.fillStyle(THEME.colors.boardTrim, 1);
      g.fillRect(x + 86, y + 130, 38, 26);
    }
  }

  private drawMusicNote(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x3b2f4b, 1);
    g.fillRect(x + 9, y, 4, 24);
    g.fillCircle(x + 5, y + 24, 7);
    g.fillRect(x + 12, y, 12, 4);
  }

  private drawSidePoster(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(THEME.colors.board, 1);
    g.fillRect(x, y, 72, 38);
    g.lineStyle(3, THEME.colors.boardTrim, 1);
    g.strokeRect(x, y, 72, 38);
    g.fillStyle(0xfef3c7, 1);
    g.fillRect(x + 8, y + 10, 44, 4);
    g.fillRect(x + 8, y + 22, 56, 4);
    g.fillStyle(0xfff7d6, 1);
    g.fillRect(x + 54, y + 8, 10, 22);
  }

  private drawSideExtinguisher(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(THEME.colors.fireRed, 1);
    g.fillRect(x, y, 12, 32);
    g.fillStyle(0xfef2f2, 1);
    g.fillRect(x + 3, y + 9, 6, 5);
  }

  private drawSideUmbrellaStand(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x6b7280, 1);
    g.fillRect(x, y + 18, 28, 10);
    g.lineStyle(2, 0x374151, 1);
    for (let offset = 4; offset <= 22; offset += 6) {
      g.lineBetween(x + offset, y + 18, x + offset - 3, y);
    }
    g.fillStyle(0x60a5fa, 1);
    g.fillTriangle(x + 2, y + 4, x + 13, y - 8, x + 24, y + 4);
  }

  private drawSideCleaningCloset(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(x, y, 42, 62);
    g.lineStyle(3, THEME.colors.doorDark, 0.8);
    g.strokeRect(x, y, 42, 62);
    g.lineBetween(x + 21, y + 4, x + 21, y + 58);
    g.fillStyle(0xfacc15, 1);
    g.fillRect(x + 10, y + 10, 22, 8);
    g.fillStyle(0xfef3c7, 1);
    g.fillRect(x + 12, y + 12, 18, 3);
  }

  private drawSideStairs(g: Phaser.GameObjects.Graphics, trigger: RectConfig, toFloor: number): void {
    g.fillStyle(0x6b7280, 0.24);
    g.fillRect(trigger.x - 18, 456, trigger.width + 36, 220);
    g.fillStyle(THEME.colors.stairsA, 1);
    g.fillRect(trigger.x, 488, trigger.width, 168);
    g.lineStyle(4, THEME.colors.goalFrame, 1);
    g.strokeRect(trigger.x + 2, 488, trigger.width - 4, 168);
    g.lineStyle(3, 0x4b5563, 0.9);
    for (let y = 508; y < 642; y += 18) {
      g.lineBetween(trigger.x + 10, y, trigger.x + trigger.width - 10, y);
    }
    g.fillStyle(0xfff7d6, 0.92);
    g.fillTriangle(trigger.x + trigger.width / 2, 628, trigger.x + 28, 596, trigger.x + trigger.width - 28, 596);
    this.add
      .text(trigger.x + trigger.width / 2, 518, `階段\n${toFloor}Fへ`, {
        fontFamily: THEME.font,
        fontSize: '19px',
        color: '#111827',
        align: 'center',
        backgroundColor: '#fff7d6',
        padding: { x: 7, y: 4 },
        stroke: '#ffffff',
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private createSideTeacher(config: SideScrollTeacherConfig, side: SideScrollConfig): SideTeacherRuntime {
    const metrics = this.sideMetrics ?? buildSideScrollMetrics(GAME_WIDTH, GAME_HEIGHT, SIDE_LAYOUT);
    const classroomPeekY = metrics.windowBottomY - 8;
    const y = config.type === 'classroom_watch' ? classroomPeekY : metrics.walkY - 22;
    const visualScale = config.type === 'classroom_watch' ? SIDE_VISUAL.teacherScaleClassroom : SIDE_VISUAL.teacherScaleHallway;
    const body = this.add.container(config.x, y).setDepth(config.type === 'classroom_watch' ? 28 : 45);
    const shadow = this.add.ellipse(0, 21, 34, 11, 0x000000, config.type === 'classroom_watch' ? 0.08 : 0.2);
    const suit = this.add.rectangle(0, 4, 28, 40, THEME.colors.teacherSuit, 1).setStrokeStyle(3, 0xffffff, 0.75);
    const shirt = this.add.rectangle(0, -3, 12, 16, 0xf8fafc, 0.92);
    const tie = this.add.triangle(0, 7, 0, -5, -6, 11, 6, 11, 0x1e3a8a, 0.9);
    const face = this.add.rectangle(0, -23, 20, 17, THEME.colors.teacherFace, 1).setStrokeStyle(2, 0x5c321d, 0.8);
    const hair = this.add.rectangle(0, -31, 20, 6, 0x292524, 1);
    const label = this.add
      .text(0, 5, '先生', {
        fontFamily: THEME.font,
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 2
      })
      .setOrigin(0.5);
    body.add([shadow, suit, shirt, tie, face, hair, label]);

    return {
      config,
      x: config.x,
      direction: config.direction,
      state: config.type === 'classroom_watch' ? 'hidden' : 'active',
      elapsed: 0,
      body,
      vision: this.add.graphics().setDepth(24),
      visualScale
    };
  }

  private updateSideTeachers(delta: number, side: SideScrollConfig): void {
    for (const teacher of this.sideTeachers) {
      teacher.vision.clear();
      teacher.activeVision = undefined;
      teacher.warningVision = undefined;

      if (teacher.config.type === 'hallway_patrol') {
        this.updateSidePatrolTeacher(teacher, delta);
        teacher.activeVision = this.createSideVisionRect(teacher.x, this.sideMetrics?.walkY ?? side.floorY, teacher.direction, teacher.config.visionWidth, teacher.config.visionHeight);
      } else if (teacher.config.type === 'hallway_static') {
        teacher.activeVision = this.createSideVisionRect(teacher.x, this.sideMetrics?.walkY ?? side.floorY, teacher.direction, teacher.config.visionWidth, teacher.config.visionHeight);
      } else {
        this.updateSideClassroomWatchTeacher(teacher, delta, side);
      }

      teacher.body.setX(teacher.x);
      teacher.body.setScale(teacher.direction === 'left' ? -teacher.visualScale : teacher.visualScale, teacher.visualScale);
      if (teacher.config.floor !== this.currentFloor) {
        teacher.body.setAlpha(0.35);
        continue;
      }
      if (teacher.config.type === 'classroom_watch') {
        const metrics = this.sideMetrics ?? buildSideScrollMetrics(GAME_WIDTH, GAME_HEIGHT, SIDE_LAYOUT);
        const baseY = metrics.windowBottomY - 8;
        const isWatching = teacher.state === 'watching';
        const isWarning = teacher.state === 'warning';
        teacher.body.setY(baseY + (teacher.state === 'hidden' ? 22 : isWarning ? 9 : 0));
        teacher.body.setAlpha(isWatching ? 1 : isWarning ? 0.7 : 0.04);
      } else {
        teacher.body.setAlpha(1);
      }
      if (teacher.warningVision) this.drawSideVision(teacher.vision, teacher.warningVision, THEME.colors.warningVision, 0.38);
      if (teacher.activeVision) this.drawSideVision(teacher.vision, teacher.activeVision, THEME.colors.dangerVision, 0.44);
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

    const rect = this.createSideVisionRect(teacher.x, this.sideMetrics?.walkY ?? side.floorY, teacher.direction, teacher.config.visionWidth, teacher.config.visionHeight);
    if (teacher.state === 'warning') teacher.warningVision = rect;
    if (teacher.state === 'watching') teacher.activeVision = rect;
  }

  private createSideVisionRect(x: number, floorY: number, direction: SideScrollDirection, width: number, height: number): Phaser.Geom.Rectangle {
    const rectX = direction === 'right' ? x + 28 : x - width - 28;
    return new Phaser.Geom.Rectangle(rectX, floorY - height - 4, width, height + 8);
  }

  private drawSideVision(g: Phaser.GameObjects.Graphics, rect: Phaser.Geom.Rectangle, color: number, alpha: number): void {
    g.fillStyle(color, alpha);
    g.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 13);
    g.fillStyle(0xfff7d6, alpha * 0.42);
    g.fillRoundedRect(rect.x + 8, rect.y + 8, Math.max(12, rect.width - 18), 10, 5);
    g.lineStyle(5, 0xffedd5, 0.82);
    g.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 13);
    g.lineStyle(2, 0x7f1d1d, 0.38);
    g.strokeRoundedRect(rect.x + 4, rect.y + 4, Math.max(1, rect.width - 8), Math.max(1, rect.height - 8), 10);
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
      return ['左下の← →で移動', '右のDASH長押しで走る', '先生の視界で走るとアウト', '歩くだけなら見られてもセーフ', '玄関ホールまで行こう'];
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
      const destinationY = this.sideScroll ? this.sideMetrics?.walkY ?? transition.destinationSpawn.y : transition.destinationSpawn.y;
      this.player.setPosition(transition.destinationSpawn.x, destinationY);
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
