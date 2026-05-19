import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { SIDE_LAYOUT, SIDE_VISUAL, THEME } from '../config/visualTheme';
import type { RectConfig, RoomKind } from '../types/LevelTypes';
import type {
  ClassroomSeatAnchor,
  PeekAnchor,
  SideScrollConfig,
  SideScrollMetrics,
  SideScrollRoomConfig
} from '../types/SideScrollTypes';
import { buildSideScrollMetrics } from '../utils/sideScrollMetrics';

type RoomPalette = { wall: number; dark: number; floor: number; accent: number };

export class SideScrollRenderer {
  static render(scene: Phaser.Scene, side: SideScrollConfig, metrics = buildSideScrollMetrics(GAME_WIDTH, GAME_HEIGHT, SIDE_LAYOUT)): void {
    const renderer = new SideScrollRenderer(scene, side, metrics);
    renderer.render();
  }

  private readonly roomY: number;
  private readonly roomHeight: number;
  private readonly windowOffsetY: number;
  private readonly windowHeight: number;
  private readonly floorTopY: number;
  private readonly floorBottomY: number;
  private readonly hallwayBackY: number;

  private constructor(private scene: Phaser.Scene, private side: SideScrollConfig, private metrics: SideScrollMetrics) {
    this.roomY = metrics.transomTopY;
    this.roomHeight = metrics.sillY - metrics.transomTopY + 44;
    this.windowOffsetY = metrics.windowTopY - metrics.transomTopY;
    this.windowHeight = metrics.windowBottomY - metrics.windowTopY;
    this.floorTopY = metrics.hallBackY + 16;
    this.floorBottomY = metrics.floorBottomY;
    this.hallwayBackY = metrics.hallBackY;
  }

  private render(): void {
    const g = this.scene.add.graphics().setDepth(1);
    const windowG = this.scene.add.graphics().setDepth(30);
    this.buildMetrics();
    this.drawBackWallAndCeiling(g);
    this.drawRoomFacadeModules(g);
    for (const room of this.side.backgroundRooms) {
      this.drawClassroomInterior(room);
    }
    for (const room of this.side.backgroundRooms) {
      this.drawClassroomWindowFrames(windowG, room);
    }
    this.drawCorridorProps(g);
    this.drawPerspectiveFloor(g);
    this.drawFloorAccents(g);
    for (const transition of this.side.stairTransitions ?? []) {
      this.drawStairs(g, transition.trigger, transition.toFloor);
    }

    this.scene.add
      .text(52, 124, `${this.side.initialFloor}F 廊下`, {
        fontFamily: THEME.font,
        fontSize: '20px',
        color: '#2f2418',
        backgroundColor: '#fff7d6',
        padding: { x: 7, y: 3 }
      })
      .setDepth(8);
  }

  private buildMetrics(): SideScrollMetrics {
    return this.metrics;
  }

  private drawBackWallAndCeiling(g: Phaser.GameObjects.Graphics): void {
    this.drawBackgroundWall(g);
  }

  private drawRoomFacadeModules(g: Phaser.GameObjects.Graphics): void {
    for (const room of this.side.backgroundRooms) {
      this.drawRoomFacadeModule(g, room);
    }
  }

  private drawRoomFacadeModule(g: Phaser.GameObjects.Graphics, room: SideScrollRoomConfig): void {
    const palette = this.getRoomPalette(room.kind);
    const x = room.x;
    const y = this.roomY;
    const width = this.getFacadeWidth(room);
    const height = this.roomHeight;

    g.fillStyle(palette.wall, 1);
    g.fillRect(x, y, width, height);
    g.fillStyle(0xe6d1a8, 1);
    g.fillRect(x, this.metrics.sillY, width, height - (this.metrics.sillY - y));
    g.fillStyle(0xd6b881, 1);
    g.fillRect(x, this.metrics.sillY + 22, width, 16);

    g.fillStyle(0xb08b5a, 1);
    g.fillRect(x, y, 14, height);
    g.fillRect(x + width - 14, y, 14, height);
    g.fillStyle(0xf7e6bf, 1);
    g.fillRect(x + 14, y, width - 28, this.metrics.windowTopY - y - 8);
    g.fillStyle(0xb9dbe7, 0.5);
    g.fillRect(x + 18, this.metrics.transomTopY + 6, width - 36, Math.max(14, this.metrics.windowTopY - this.metrics.transomTopY - 18));

    g.lineStyle(3, THEME.colors.mapBorder, 0.48);
    g.strokeRect(x, y, width, height);
    g.lineStyle(2, 0xffffff, 0.3);
    g.lineBetween(x + 8, y + 7, x + width - 8, y + 7);
    g.lineStyle(3, 0xa88b62, 0.48);
    g.lineBetween(x + 2, this.metrics.sillY, x + width - 2, this.metrics.sillY);

    this.drawRoomPlate(room);
  }

  private drawClassroomInterior(room: SideScrollRoomConfig): void {
    const interiorG = this.scene.add.graphics().setDepth(4);
    const windowRect = this.getWindowRect(room);
    const maskShape = this.scene.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(windowRect.x, windowRect.y, windowRect.width, windowRect.height);
    interiorG.setMask(maskShape.createGeometryMask());

    const width = this.getFacadeWidth(room);
    this.drawBackWallFeature(interiorG, room.x, this.roomY, width, this.roomHeight, room.kind);
    this.drawClassroomMid(interiorG, room);
  }

  private drawClassroomWindowFrames(g: Phaser.GameObjects.Graphics, room: SideScrollRoomConfig): void {
    this.drawWindowFront(g, room);
  }

  private drawCorridorProps(g: Phaser.GameObjects.Graphics): void {
    this.drawCorridorBack(g);
  }

  private drawPerspectiveFloor(g: Phaser.GameObjects.Graphics): void {
    this.drawFloor(g);
  }

  private drawBackgroundWall(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xf8f0dd, 1);
    g.fillRect(0, this.metrics.ceilingY, this.side.worldWidth, this.hallwayBackY - this.metrics.ceilingY);
    g.fillStyle(0xe4d1ad, 1);
    g.fillRect(0, this.metrics.ceilingY, this.side.worldWidth, 34);
    g.fillStyle(0xd7c09b, 1);
    g.fillRect(0, this.hallwayBackY - 18, this.side.worldWidth, 18);
    g.lineStyle(5, 0xa88b62, 0.85);
    g.lineBetween(0, this.hallwayBackY, this.side.worldWidth, this.hallwayBackY);
    g.lineStyle(2, 0xfff7d6, 0.58);
    g.lineBetween(0, this.hallwayBackY + 10, this.side.worldWidth, this.hallwayBackY + 10);
  }

  private drawClassroomBack(g: Phaser.GameObjects.Graphics, room: SideScrollRoomConfig): void {
    const palette = this.getRoomPalette(room.kind);
    const x = room.x;
    const y = this.roomY;
    const height = this.roomHeight;
    const width = this.getFacadeWidth(room);
    g.fillStyle(palette.wall, 1);
    g.fillRect(x, y, width, height);
    g.lineStyle(3, THEME.colors.mapBorder, 0.48);
    g.lineBetween(x, y, x + width, y);
    g.lineBetween(x, y + height, x + width, y + height);
    g.lineStyle(2, 0xffffff, 0.32);
    g.lineBetween(x + 4, y + 5, x + width - 4, y + 5);

    g.fillStyle(palette.floor, 1);
    g.fillRect(x + 8, this.metrics.sillY + 10, width - 16, Math.max(26, y + height - this.metrics.sillY - 18));
    g.lineStyle(2, 0xb58e5f, 0.28);
    for (let floorLineY = this.metrics.sillY + 24; floorLineY < y + height - 10; floorLineY += 24) {
      g.lineBetween(x + 10, floorLineY, x + width - 10, floorLineY);
    }

    this.drawBackWallFeature(g, x, y, width, height, room.kind);
    this.drawRoomPlate(room);
  }

  private drawClassroomMid(g: Phaser.GameObjects.Graphics, room: SideScrollRoomConfig): void {
    const x = room.x;
    const y = this.roomY;
    const width = this.getFacadeWidth(room);
    const kind = room.kind;

    if (kind === 'science') {
      this.drawExperimentTables(g, x, y, width);
      this.drawStandingStudent(g, x + 128, this.metrics.sillY - 12, 0x8dd7c7, 0.78);
      this.drawTeacherSilhouette(g, x + width - 120, this.metrics.sillY - 8, 0xf7f7f7);
    } else if (kind === 'music') {
      this.drawPiano(g, x + 52, this.metrics.sillY - 20);
      this.drawMusicStands(g, x + 172, this.metrics.sillY - 28);
      this.drawSeatedStudent(g, x + 238, this.metrics.sillY + 14, 0x71c562);
    } else if (kind === 'library') {
      this.drawReadingTable(g, x + 70, this.metrics.sillY + 4, width - 180);
      this.drawSeatedStudent(g, x + 126, this.metrics.sillY + 18, 0x4f9ad8);
      this.drawSeatedStudent(g, x + 214, this.metrics.sillY + 18, 0xf59e0b);
    } else if (kind === 'nurse') {
      this.drawNurseBed(g, x + 58, this.metrics.sillY - 2);
      this.drawTeacherSilhouette(g, x + width - 126, this.metrics.sillY + 8, 0xffffff);
    } else if (kind === 'staff') {
      for (let deskX = x + 44; deskX < x + width - 140; deskX += 74) {
        this.drawOfficeDesk(g, deskX, this.metrics.sillY - 4);
      }
      this.drawTeacherSilhouette(g, x + 120, this.metrics.sillY + 20, THEME.colors.teacherSuit);
      this.drawTeacherSilhouette(g, x + width - 144, this.metrics.sillY + 20, THEME.colors.teacherSuit);
    } else if (kind === 'storage' || room.label.includes('玄関') || room.label.includes('下駄箱')) {
      this.drawShoeBoxes(g, x + 38, this.metrics.windowTopY + 6, Math.max(8, Math.floor((width - 90) / 28)));
    } else {
      this.drawClassroomDesks(g, x, y, width);
      const seatAnchors = this.getSeatAnchors(room).slice(0, 3);
      seatAnchors.forEach((anchor, index) => this.drawSeatedStudent(g, anchor.x, anchor.y, index % 2 === 0 ? 0x4f9ad8 : 0xf59e0b));
      this.drawStandingStudent(g, x + 286, this.metrics.sillY - 8, 0x71c562, 0.78);
      this.drawTeacherDesk(g, x + width - 150, this.metrics.sillY - 16);
    }
  }

  private drawWindowFront(g: Phaser.GameObjects.Graphics, room: SideScrollRoomConfig): void {
    const x = room.x;
    const y = this.roomY;
    const width = this.getFacadeWidth(room);
    const height = this.roomHeight;
    const doorWidth = Phaser.Math.Clamp(this.metrics.doorPairWidthPx, 154, 173);
    const doorX = x + width - doorWidth - 18;
    const windowRect = this.getWindowRect(room);

    g.fillStyle(THEME.colors.door, 1);
    g.fillRect(doorX, this.metrics.transomTopY + 50, doorWidth, height - 50);
    g.lineStyle(4, THEME.colors.doorDark, 0.85);
    g.strokeRect(doorX, this.metrics.transomTopY + 50, doorWidth, height - 50);
    g.lineBetween(doorX + doorWidth / 2, this.metrics.transomTopY + 54, doorX + doorWidth / 2, y + height - 4);
    g.fillStyle(THEME.colors.windowLight, 0.78);
    g.fillRect(doorX + 16, this.metrics.windowTopY + 14, 36, 34);
    g.fillRect(doorX + doorWidth - 54, this.metrics.windowTopY + 14, 36, 34);
    g.fillStyle(0x3b2314, 1);
    g.fillRect(doorX + doorWidth / 2 - 8, this.metrics.sillY + 38, 5, 5);
    g.fillRect(doorX + doorWidth / 2 + 6, this.metrics.sillY + 38, 5, 5);

    const visibleWidth = windowRect.width;
    g.fillStyle(0xb9dbe7, 0.26);
    g.fillRect(windowRect.x, windowRect.y, visibleWidth, windowRect.height);
    g.lineStyle(4, 0x35505a, 0.88);
    g.strokeRect(windowRect.x, windowRect.y, visibleWidth, windowRect.height);
    g.lineStyle(3, 0x35505a, 0.78);
    g.lineBetween(windowRect.x, windowRect.y + windowRect.height / 2, windowRect.x + visibleWidth, windowRect.y + windowRect.height / 2);
    for (let sashX = windowRect.x + 54; sashX < windowRect.x + visibleWidth - 8; sashX += 72) {
      g.lineBetween(sashX, windowRect.y + 2, sashX, windowRect.y + windowRect.height - 2);
    }

    g.fillStyle(THEME.colors.curtain, 0.9);
    g.fillRect(windowRect.x + 2, windowRect.y - 4, 10, windowRect.height + 10);
    g.fillRect(windowRect.x + visibleWidth - 12, windowRect.y - 4, 10, windowRect.height + 10);
    g.fillStyle(0xe8fbff, 0.62);
    g.fillTriangle(windowRect.x + 16, windowRect.y + 10, windowRect.x + 74, windowRect.y + 10, windowRect.x + 16, windowRect.y + 42);
    g.fillTriangle(
      windowRect.x + 94,
      windowRect.y + windowRect.height - 36,
      windowRect.x + 172,
      windowRect.y + windowRect.height - 36,
      windowRect.x + 94,
      windowRect.y + windowRect.height - 8
    );
    g.fillStyle(0x2f2418, 0.18);
    g.fillRect(windowRect.x, windowRect.y + windowRect.height - 8, visibleWidth, 8);
  }

  private drawCorridorBack(g: Phaser.GameObjects.Graphics): void {
    for (let x = 112; x < this.side.worldWidth; x += 260) {
      this.drawPoster(g, x, this.hallwayBackY - 38);
      this.drawExtinguisher(g, x + 98, this.hallwayBackY - 4);
      this.drawUmbrellaStand(g, x + 158, this.hallwayBackY);
    }
    for (let x = 330; x < this.side.worldWidth; x += 520) {
      this.drawCleaningCloset(g, x, this.hallwayBackY - 54);
    }
    for (let x = 220; x < this.side.worldWidth; x += 620) {
      this.drawMotto(g, x, this.metrics.ceilingY + 20);
    }
  }

  private drawFloor(g: Phaser.GameObjects.Graphics): void {
    const topInset = 42;
    const bottomOutset = -90;
    const floorLeftAt = (y: number) => Phaser.Math.Linear(topInset, bottomOutset, (y - this.floorTopY) / (this.floorBottomY - this.floorTopY));
    const floorRightAt = (y: number) => Phaser.Math.Linear(this.side.worldWidth - topInset, this.side.worldWidth - bottomOutset, (y - this.floorTopY) / (this.floorBottomY - this.floorTopY));
    const floorBands = [
      { y1: this.floorTopY, y2: this.floorTopY + 42, color: 0xd5b16e },
      { y1: this.floorTopY + 42, y2: this.floorTopY + 90, color: 0xdfbf79 },
      { y1: this.floorTopY + 90, y2: this.metrics.walkY, color: 0xe8cd8d },
      { y1: this.metrics.walkY, y2: this.floorBottomY, color: 0xf0d99f }
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
    for (const y of [this.floorTopY + 30, this.floorTopY + 68, this.floorTopY + 112, this.metrics.walkY, this.floorBottomY]) {
      g.lineBetween(floorLeftAt(y), y, floorRightAt(y), y);
    }
    g.lineStyle(2, THEME.colors.hallLine, 0.22);
    for (let x = 80; x < this.side.worldWidth; x += 180) {
      g.lineBetween(x, this.floorTopY, x - 76, this.floorBottomY);
      g.lineBetween(x + 90, this.floorTopY, x + 142, this.floorBottomY);
    }
    g.lineStyle(5, THEME.colors.hallWax, 0.34);
    for (let x = 54; x < this.side.worldWidth; x += 270) {
      g.lineBetween(x, this.floorTopY + 74, x + 116, this.floorTopY + 64);
      g.lineBetween(x + 38, this.metrics.walkY + 32, x + 178, this.metrics.walkY + 16);
    }
    g.lineStyle(4, 0xfff3c4, 0.46);
    g.lineBetween(0, this.metrics.walkY + 20, this.side.worldWidth, this.metrics.walkY + 20);
    g.fillStyle(THEME.colors.hallwayShadow, 0.12);
    g.fillRect(0, this.floorBottomY - 12, this.side.worldWidth, 30);
  }

  private drawFloorAccents(g: Phaser.GameObjects.Graphics): void {
    for (const room of this.side.backgroundRooms) {
      if (room.label.includes('玄関') || room.label.includes('下駄箱')) {
        this.drawEntranceMat(g, room.x + 18, this.floorTopY + 34, Math.min(150, room.width - 36));
      } else if (room.kind === 'science') {
        this.drawCorridorIconPanel(g, room.x + 28, this.floorTopY - 28, 0x1f9e95, 'SCI');
      } else if (room.kind === 'music') {
        this.drawCorridorIconPanel(g, room.x + 28, this.floorTopY - 28, 0x7c3aed, '♪');
      } else if (room.kind === 'library') {
        this.drawCorridorIconPanel(g, room.x + 28, this.floorTopY - 28, 0x8b5a2b, '本');
      } else if (room.kind === 'nurse') {
        this.drawCorridorIconPanel(g, room.x + 28, this.floorTopY - 28, 0xef4444, '+');
      } else if (room.kind === 'staff') {
        this.drawCorridorIconPanel(g, room.x + 28, this.floorTopY - 28, 0x4b5563, '職');
      }
    }
  }

  private drawEntranceMat(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number): void {
    g.fillStyle(0x2f6f4f, 0.9);
    g.fillRect(x, y, width, 28);
    g.lineStyle(3, 0xfff7d6, 0.58);
    g.strokeRect(x + 2, y + 2, width - 4, 24);
    g.lineStyle(2, 0x9bdaf1, 0.35);
    for (let stripeX = x + 14; stripeX < x + width - 8; stripeX += 24) {
      g.lineBetween(stripeX, y + 5, stripeX + 12, y + 23);
    }
  }

  private drawCorridorIconPanel(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, label: string): void {
    g.fillStyle(0xfff7d6, 0.96);
    g.fillRect(x, y, 52, 24);
    g.lineStyle(3, color, 0.9);
    g.strokeRect(x, y, 52, 24);
    this.scene.add
      .text(x + 26, y + 12, label, {
        fontFamily: THEME.font,
        fontSize: label.length > 1 ? '11px' : '16px',
        color: '#2f2418',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private drawBackWallFeature(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, kind: RoomKind): void {
    if (kind === 'library') {
      for (let shelfX = x + 18; shelfX < x + width - 52; shelfX += 34) {
        this.drawBookShelf(g, shelfX, y + 24, 28, 70);
      }
      return;
    }
    if (kind === 'music') {
      g.fillStyle(0xfff7d6, 1);
      g.fillRect(x + 22, y + 28, 54, 36);
      this.drawMusicNote(g, x + 36, y + 36);
      this.drawMusicNote(g, x + 60, y + 48);
      return;
    }
    if (kind === 'nurse') {
      g.fillStyle(0xffffff, 0.95);
      g.fillRect(x + 22, y + 26, width - 92, height - 76);
      g.fillStyle(0xef4444, 1);
      g.fillRect(x + 54, y + 46, 10, 34);
      g.fillRect(x + 42, y + 58, 34, 10);
      return;
    }
    if (kind === 'science') {
      g.fillStyle(THEME.colors.locker, 1);
      g.fillRect(x + 20, y + 24, width - 92, 58);
      g.fillStyle(0x9bdaf1, 1);
      for (let bottleX = x + 30; bottleX < x + width - 102; bottleX += 24) {
        g.fillRect(bottleX, y + 48, 10, 24);
        g.fillRect(bottleX + 2, y + 42, 6, 8);
      }
      return;
    }
    if (kind === 'staff') {
      g.fillStyle(THEME.colors.locker, 1);
      g.fillRect(x + 18, y + 22, width - 84, 70);
      g.lineStyle(2, 0x35505a, 0.7);
      for (let lineX = x + 44; lineX < x + width - 90; lineX += 26) g.lineBetween(lineX, y + 26, lineX, y + 88);
      return;
    }
    if (kind === 'storage') {
      this.drawShoeBoxes(g, x + 24, y + 28, Math.max(4, Math.floor((width - 90) / 24)));
      return;
    }

    g.fillStyle(THEME.colors.chalkboard, 1);
    g.fillRect(x + 24, y + 24, width - 94, 42);
    g.lineStyle(3, 0x214d37, 1);
    g.strokeRect(x + 24, y + 24, width - 94, 42);
    g.fillStyle(0xfff7d6, 0.9);
    g.fillRect(x + 34, y + 52, 34, 4);
    g.fillStyle(0xf87171, 0.85);
    g.fillRect(x + width - 130, y + 34, 18, 18);
    g.fillStyle(THEME.colors.paper, 0.9);
    g.fillRect(x + width - 106, y + 36, 18, 16);
  }

  private drawClassroomDesks(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number): void {
    for (let row = 0; row < 2; row += 1) {
      for (let deskX = x + 42; deskX < x + width - 180; deskX += 86) {
        const deskY = this.metrics.sillY - 10 + row * 42;
        g.fillStyle(0x7c4a24, 0.95);
        g.fillRect(deskX, deskY + this.metrics.deskHeightPx - 8, this.metrics.deskWidthPx, 8);
        g.fillStyle(0xa86934, 1);
        g.fillRect(deskX, deskY, this.metrics.deskWidthPx, this.metrics.deskHeightPx);
      }
    }
  }

  private drawExperimentTables(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number): void {
    for (let tableX = x + 44; tableX < x + width - 150; tableX += 118) {
      g.fillStyle(0x177f78, 1);
      g.fillRect(tableX, this.metrics.sillY - 8, this.metrics.deskWidthPx + 26, this.metrics.deskHeightPx);
      g.fillStyle(0xe8fbff, 0.92);
      g.fillTriangle(tableX + 16, this.metrics.sillY - 28, tableX + 6, this.metrics.sillY + 2, tableX + 28, this.metrics.sillY + 2);
      g.fillRect(tableX + 46, this.metrics.sillY - 24, 14, 28);
    }
  }

  private drawSeatedStudent(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
    const scale = SIDE_VISUAL.studentScaleClassroomSitting;
    const deskWidth = this.metrics.deskWidthPx;
    const visibleHeight = this.metrics.seatedStudentVisibleHeightPx * 0.42;
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(x, y + 18, 26 * scale, 7 * scale);
    g.fillStyle(THEME.colors.playerFace, 0.98);
    g.fillRect(x - 7 * scale, y - visibleHeight * 0.62, 14 * scale, 13 * scale);
    g.fillStyle(0x2d1c14, 1);
    g.fillRect(x - 7 * scale, y - visibleHeight * 0.72, 14 * scale, 5 * scale);
    g.fillStyle(color, 0.96);
    g.fillRect(x - 10 * scale, y - visibleHeight * 0.34, 20 * scale, 22 * scale);
    g.fillStyle(0xa86934, 1);
    g.fillRect(x - deskWidth / 2, y + 4 * scale, deskWidth, this.metrics.deskHeightPx * 0.56);
  }

  private drawStandingStudent(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, alpha = 0.9): void {
    const scale = SIDE_VISUAL.studentScaleClassroomStanding;
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(x, y + 18, 20 * scale, 7 * scale);
    g.fillStyle(color, alpha);
    g.fillRect(x - 8 * scale, y - 2 * scale, 16 * scale, 22 * scale);
    g.fillStyle(THEME.colors.playerFace, alpha);
    g.fillRect(x - 7 * scale, y - 18 * scale, 14 * scale, 13 * scale);
    g.fillStyle(0x2d1c14, alpha);
    g.fillRect(x - 7 * scale, y - 24 * scale, 14 * scale, 5 * scale);
  }

  private drawTeacherSilhouette(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(x, y + 18, 26, 8);
    g.fillStyle(color, 0.94);
    g.fillRect(x - 10, y - 4, 20, 28);
    g.fillStyle(THEME.colors.teacherFace, 0.94);
    g.fillRect(x - 7, y - 20, 14, 13);
    g.fillStyle(0x292524, 0.94);
    g.fillRect(x - 7, y - 25, 14, 5);
  }

  private drawTeacherDesk(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(x, y, 52, 24);
    g.fillStyle(THEME.colors.paper, 1);
    g.fillRect(x + 8, y + 5, 18, 5);
  }

  private drawPiano(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x292524, 1);
    g.fillRect(x, y, 64, 30);
    g.fillRect(x + 48, y - 24, 16, 54);
    g.fillStyle(0xfff7d6, 1);
    for (let keyX = x + 6; keyX < x + 56; keyX += 8) g.fillRect(keyX, y + 10, 5, 10);
  }

  private drawMusicStands(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    for (let standX = x; standX < x + 68; standX += 34) {
      g.fillStyle(0x3b2f4b, 1);
      g.fillRect(standX, y, 22, 14);
      g.lineStyle(2, 0x3b2f4b, 1);
      g.lineBetween(standX + 11, y + 14, standX + 11, y + 42);
      g.lineBetween(standX + 11, y + 42, standX, y + 50);
      g.lineBetween(standX + 11, y + 42, standX + 22, y + 50);
    }
  }

  private drawReadingTable(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number): void {
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(x, y, width, 22);
    g.fillStyle(0xfff7d6, 1);
    g.fillRect(x + 18, y + 5, 24, 8);
    g.fillStyle(0x4f9ad8, 1);
    g.fillRect(x + width - 42, y + 5, 22, 8);
  }

  private drawNurseBed(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0xffffff, 0.96);
    g.fillRect(x, y, 82, 34);
    g.fillStyle(0x93c5fd, 0.86);
    g.fillRect(x + 8, y + 8, 64, 18);
    g.fillStyle(0x6b7280, 1);
    g.fillRect(x - 4, y + 28, 90, 6);
  }

  private drawOfficeDesk(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(x, y, 30, 24);
    g.fillStyle(THEME.colors.paper, 1);
    g.fillRect(x + 5, y + 5, 14, 5);
    g.fillRect(x + 9, y + 14, 14, 5);
  }

  private drawBookShelf(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(x, y, width, height);
    for (let bookY = y + 10; bookY < y + height - 10; bookY += 14) {
      g.fillStyle(bookY % 28 === 0 ? 0x4f9ad8 : 0xf59e0b, 1);
      g.fillRect(x + 4, bookY, 5, 10);
      g.fillStyle(0x71c562, 1);
      g.fillRect(x + 12, bookY, 5, 10);
      g.fillStyle(0xfff7d6, 1);
      g.fillRect(x + 20, bookY, 4, 10);
    }
  }

  private drawShoeBoxes(g: Phaser.GameObjects.Graphics, x: number, y: number, columns: number): void {
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        g.fillStyle(THEME.colors.shoeBox, 1);
        g.fillRect(x + col * 24, y + row * 24, 18, 16);
        g.fillStyle(THEME.colors.shoeBoxDark, 0.68);
        g.fillRect(x + 3 + col * 24, y + 5 + row * 24, 12, 3);
      }
    }
  }

  private drawPoster(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(THEME.colors.board, 1);
    g.fillRect(x, y, 78, 42);
    g.lineStyle(3, THEME.colors.boardTrim, 1);
    g.strokeRect(x, y, 78, 42);
    g.fillStyle(0xfef3c7, 1);
    g.fillRect(x + 8, y + 10, 44, 4);
    g.fillRect(x + 8, y + 24, 60, 4);
    g.fillRect(x + 56, y + 8, 10, 24);
  }

  private drawExtinguisher(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(THEME.colors.fireRed, 1);
    g.fillRect(x, y, 12, 32);
    g.fillStyle(0xfef2f2, 1);
    g.fillRect(x + 3, y + 9, 6, 5);
  }

  private drawUmbrellaStand(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x6b7280, 1);
    g.fillRect(x, y + 18, 28, 10);
    g.lineStyle(2, 0x374151, 1);
    for (let offset = 4; offset <= 22; offset += 6) g.lineBetween(x + offset, y + 18, x + offset - 3, y);
    g.fillStyle(0x60a5fa, 1);
    g.fillTriangle(x + 2, y + 4, x + 13, y - 8, x + 24, y + 4);
  }

  private drawCleaningCloset(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(x, y, 42, 62);
    g.lineStyle(3, THEME.colors.doorDark, 0.8);
    g.strokeRect(x, y, 42, 62);
    g.lineBetween(x + 21, y + 4, x + 21, y + 58);
    g.fillStyle(0xfacc15, 1);
    g.fillRect(x + 10, y + 10, 22, 8);
  }

  private drawMotto(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0xfff7d6, 0.95);
    g.fillRect(x, y, 86, 24);
    g.lineStyle(2, THEME.colors.mapBorder, 0.8);
    g.strokeRect(x, y, 86, 24);
    g.fillStyle(0x3b2f4b, 0.9);
    g.fillRect(x + 10, y + 8, 52, 3);
    g.fillRect(x + 10, y + 15, 66, 3);
  }

  private drawStairs(g: Phaser.GameObjects.Graphics, trigger: RectConfig, toFloor: number): void {
    g.fillStyle(0x6b7280, 0.24);
    g.fillRect(trigger.x - 26, 448, trigger.width + 52, 230);
    g.fillStyle(THEME.colors.stairsA, 1);
    g.fillRect(trigger.x - 6, 482, trigger.width + 12, 176);
    g.lineStyle(6, THEME.colors.goalFrame, 1);
    g.strokeRect(trigger.x - 4, 482, trigger.width + 8, 176);
    g.lineStyle(3, 0x4b5563, 0.9);
    for (let y = 504; y < 646; y += 18) g.lineBetween(trigger.x + 4, y, trigger.x + trigger.width + 4, y);
    g.fillStyle(0xfff7d6, 0.92);
    g.fillTriangle(trigger.x + trigger.width / 2, 628, trigger.x + 28, 596, trigger.x + trigger.width - 28, 596);
    this.scene.add
      .text(trigger.x + trigger.width / 2, 512, `階段\n${toFloor}Fへ`, {
        fontFamily: THEME.font,
        fontSize: '21px',
        color: '#111827',
        align: 'center',
        backgroundColor: '#fff7d6',
        padding: { x: 8, y: 5 },
        stroke: '#ffffff',
        strokeThickness: 2
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private drawMusicNote(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x3b2f4b, 1);
    g.fillRect(x + 9, y, 4, 24);
    g.fillCircle(x + 5, y + 24, 7);
    g.fillRect(x + 12, y, 12, 4);
  }

  private drawRoomPlate(room: SideScrollRoomConfig): void {
    this.scene.add
      .text(room.x + 16, this.roomY + 12, `${room.floor}F ${room.label}`, {
        fontFamily: THEME.font,
        fontSize: '16px',
        color: THEME.colors.plateText,
        backgroundColor: '#fff7d6',
        padding: { x: 5, y: 2 }
      })
      .setDepth(8);
  }

  private getFacadeWidth(room: SideScrollRoomConfig): number {
    const compressedModuleWidth = Math.min(this.metrics.classroomModuleWidthPx, 640);
    return Math.max(room.width, compressedModuleWidth);
  }

  private getWindowRect(room: SideScrollRoomConfig): Phaser.Geom.Rectangle {
    const x = room.x;
    const width = this.getFacadeWidth(room);
    const doorWidth = Phaser.Math.Clamp(this.metrics.doorPairWidthPx, 154, 173);
    const doorX = x + width - doorWidth - 18;
    const visibleWidth = Math.min(Math.max(360, this.metrics.windowBandWidthPx), Math.max(84, doorX - x - 34));
    return new Phaser.Geom.Rectangle(x + 18, this.roomY + this.windowOffsetY, visibleWidth, this.windowHeight);
  }

  private getPeekAnchors(): PeekAnchor[] {
    return this.side.backgroundRooms.map((room) => {
      const windowRect = this.getWindowRect(room);
      return {
        roomId: `${room.floor}-${room.label}-${room.x}`,
        x: windowRect.x + windowRect.width - 28,
        y: windowRect.y + windowRect.height * 0.58,
        direction: 'right',
        maskRect: {
          x: windowRect.x,
          y: windowRect.y,
          width: windowRect.width,
          height: windowRect.height
        }
      };
    });
  }

  private getSeatAnchors(room: SideScrollRoomConfig): ClassroomSeatAnchor[] {
    const anchors: ClassroomSeatAnchor[] = [];
    const windowRect = this.getWindowRect(room);
    const roomId = `${room.floor}-${room.label}-${room.x}`;
    const yRows = [windowRect.y + windowRect.height * 0.62, windowRect.y + windowRect.height * 0.82];
    for (let row = 0; row < yRows.length; row += 1) {
      for (let x = windowRect.x + 92; x < windowRect.x + windowRect.width - 92; x += 96) {
        anchors.push({ roomId, x, y: yRows[row], scale: row === 0 ? 0.9 : 0.96, row });
      }
    }
    return anchors;
  }

  private getRoomPalette(kind: RoomKind): RoomPalette {
    if (kind === 'science') return { wall: 0xcde9e4, dark: 0x1f9e95, floor: 0xd7efe9, accent: 0x1f9e95 };
    if (kind === 'music') return { wall: 0xe8daf7, dark: 0x3b2f4b, floor: 0xe4d5ef, accent: 0x7c3aed };
    if (kind === 'library') return { wall: 0xe9d0ad, dark: 0x8b5a2b, floor: 0xd9b887, accent: 0x8b5a2b };
    if (kind === 'nurse') return { wall: 0xf7f7f2, dark: 0xef4444, floor: 0xe6efff, accent: 0xef4444 };
    if (kind === 'staff') return { wall: 0xd4d4d8, dark: 0x4b5563, floor: 0xc9c1b4, accent: 0x4b5563 };
    if (kind === 'storage') return { wall: 0xf0d3a1, dark: 0xa7652a, floor: 0xe2bd83, accent: 0xa7652a };
    return { wall: THEME.colors.classroomWall, dark: THEME.colors.chalkboard, floor: THEME.colors.classroomFloor, accent: 0x4f8f45 };
  }
}
