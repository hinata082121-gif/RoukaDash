import Phaser from 'phaser';
import { SIDE_VISUAL, THEME } from '../config/visualTheme';
import type { RectConfig, RoomKind } from '../types/LevelTypes';
import type { SideScrollConfig, SideScrollRoomConfig } from '../types/SideScrollTypes';

type RoomPalette = { wall: number; dark: number; floor: number; accent: number };

export class SideScrollRenderer {
  static render(scene: Phaser.Scene, side: SideScrollConfig): void {
    const renderer = new SideScrollRenderer(scene, side);
    renderer.render();
  }

  private readonly roomY = 150;
  private readonly roomHeight = 284;
  private readonly floorTopY = SIDE_VISUAL.floorTopY;
  private readonly floorBottomY = SIDE_VISUAL.floorBottomY;
  private readonly hallwayBackY = SIDE_VISUAL.hallwayBackY;

  private constructor(private scene: Phaser.Scene, private side: SideScrollConfig) {}

  private render(): void {
    const g = this.scene.add.graphics().setDepth(1);
    this.drawBackgroundWall(g);
    for (const room of this.side.backgroundRooms) {
      this.drawClassroomBack(g, room);
    }
    for (const room of this.side.backgroundRooms) {
      this.drawClassroomMid(g, room);
    }
    for (const room of this.side.backgroundRooms) {
      this.drawWindowFront(g, room);
    }
    this.drawCorridorBack(g);
    this.drawFloor(g);
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

  private drawBackgroundWall(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xf8f0dd, 1);
    g.fillRect(0, 108, this.side.worldWidth, this.hallwayBackY - 108);
    g.fillStyle(0xe4d1ad, 1);
    g.fillRect(0, 108, this.side.worldWidth, 34);
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
    const width = room.width;
    const height = this.roomHeight;
    g.fillStyle(palette.wall, 1);
    g.fillRect(x, y, width, height);
    g.lineStyle(4, THEME.colors.mapBorder, 1);
    g.strokeRect(x, y, width, height);

    g.fillStyle(palette.floor, 1);
    g.fillRect(x + 8, y + 164, width - 16, height - 172);
    g.lineStyle(2, 0xb58e5f, 0.28);
    for (let floorLineY = y + 190; floorLineY < y + height - 10; floorLineY += 30) {
      g.lineBetween(x + 10, floorLineY, x + width - 10, floorLineY);
    }

    this.drawBackWallFeature(g, x, y, width, height, room.kind);
    this.drawRoomPlate(room);
  }

  private drawClassroomMid(g: Phaser.GameObjects.Graphics, room: SideScrollRoomConfig): void {
    const x = room.x;
    const y = this.roomY;
    const width = room.width;
    const kind = room.kind;

    if (kind === 'science') {
      this.drawExperimentTables(g, x, y, width);
      this.drawStandingStudent(g, x + 74, y + 196, 0x8dd7c7, 0.78);
      this.drawTeacherSilhouette(g, x + width - 92, y + 194, 0xf7f7f7);
    } else if (kind === 'music') {
      this.drawPiano(g, x + 26, y + 184);
      this.drawMusicStands(g, x + 112, y + 176);
      this.drawSeatedStudent(g, x + 142, y + 214, 0x71c562);
    } else if (kind === 'library') {
      this.drawReadingTable(g, x + 42, y + 196, width - 112);
      this.drawSeatedStudent(g, x + 78, y + 208, 0x4f9ad8);
      this.drawSeatedStudent(g, x + 132, y + 208, 0xf59e0b);
    } else if (kind === 'nurse') {
      this.drawNurseBed(g, x + 24, y + 190);
      this.drawTeacherSilhouette(g, x + width - 80, y + 200, 0xffffff);
    } else if (kind === 'staff') {
      for (let deskX = x + 22; deskX < x + width - 82; deskX += 42) {
        this.drawOfficeDesk(g, deskX, y + 184);
      }
      this.drawTeacherSilhouette(g, x + 74, y + 208, THEME.colors.teacherSuit);
      this.drawTeacherSilhouette(g, x + width - 96, y + 208, THEME.colors.teacherSuit);
    } else if (kind === 'storage' || room.label.includes('玄関') || room.label.includes('下駄箱')) {
      this.drawShoeBoxes(g, x + 26, y + 172, Math.max(4, Math.floor((width - 70) / 24)));
    } else {
      this.drawClassroomDesks(g, x, y, width);
      this.drawSeatedStudent(g, x + 58, y + 204, 0x4f9ad8);
      if (width > 175) this.drawSeatedStudent(g, x + 110, y + 204, 0xf59e0b);
      if (width > 205) this.drawStandingStudent(g, x + 148, y + 196, 0x71c562, 0.78);
      this.drawTeacherDesk(g, x + width - 92, y + 178);
    }
  }

  private drawWindowFront(g: Phaser.GameObjects.Graphics, room: SideScrollRoomConfig): void {
    const x = room.x;
    const y = this.roomY;
    const width = room.width;
    const height = this.roomHeight;
    const doorX = x + width - 44;

    g.fillStyle(THEME.colors.door, 1);
    g.fillRect(doorX, y + height - 100, 34, 100);
    g.lineStyle(4, THEME.colors.doorDark, 0.85);
    g.strokeRect(doorX, y + height - 100, 34, 100);
    g.fillStyle(THEME.colors.windowLight, 0.78);
    g.fillRect(doorX + 7, y + height - 86, 18, 22);
    g.fillStyle(0x3b2314, 1);
    g.fillRect(doorX + 25, y + height - 48, 4, 4);

    const visibleWidth = Math.max(58, width - 74);
    g.fillStyle(0xb9dbe7, 0.26);
    g.fillRect(x + 18, y + 82, visibleWidth, 126);
    g.lineStyle(4, 0x35505a, 0.88);
    g.strokeRect(x + 18, y + 82, visibleWidth, 126);
    g.lineStyle(3, 0x35505a, 0.78);
    g.lineBetween(x + 18, y + 144, x + visibleWidth + 18, y + 144);
    for (let sashX = x + 66; sashX < x + visibleWidth + 8; sashX += 48) {
      g.lineBetween(sashX, y + 84, sashX, y + 206);
    }

    g.fillStyle(THEME.colors.curtain, 0.9);
    g.fillRect(x + 20, y + 78, 10, 134);
    g.fillRect(x + visibleWidth + 6, y + 78, 10, 134);
    g.fillStyle(0xe8fbff, 0.62);
    g.fillTriangle(x + 34, y + 92, x + 92, y + 92, x + 34, y + 132);
    g.fillTriangle(x + 76, y + 164, x + 128, y + 164, x + 76, y + 196);
  }

  private drawCorridorBack(g: Phaser.GameObjects.Graphics): void {
    for (let x = 112; x < this.side.worldWidth; x += 260) {
      this.drawPoster(g, x, 392);
      this.drawExtinguisher(g, x + 98, 426);
      this.drawUmbrellaStand(g, x + 158, 430);
    }
    for (let x = 330; x < this.side.worldWidth; x += 520) {
      this.drawCleaningCloset(g, x, 376);
    }
    for (let x = 220; x < this.side.worldWidth; x += 620) {
      this.drawMotto(g, x, 128);
    }
  }

  private drawFloor(g: Phaser.GameObjects.Graphics): void {
    const topInset = 42;
    const bottomOutset = -90;
    const floorLeftAt = (y: number) => Phaser.Math.Linear(topInset, bottomOutset, (y - this.floorTopY) / (this.floorBottomY - this.floorTopY));
    const floorRightAt = (y: number) => Phaser.Math.Linear(this.side.worldWidth - topInset, this.side.worldWidth - bottomOutset, (y - this.floorTopY) / (this.floorBottomY - this.floorTopY));
    const floorBands = [
      { y1: this.floorTopY, y2: 512, color: 0xd5b16e },
      { y1: 512, y2: 560, color: 0xdfbf79 },
      { y1: 560, y2: 618, color: 0xe8cd8d },
      { y1: 618, y2: this.floorBottomY, color: 0xf0d99f }
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
    for (let x = 80; x < this.side.worldWidth; x += 180) {
      g.lineBetween(x, this.floorTopY, x - 84, this.floorBottomY);
      g.lineBetween(x + 90, this.floorTopY, x + 156, this.floorBottomY);
    }
    g.lineStyle(5, THEME.colors.hallWax, 0.34);
    for (let x = 54; x < this.side.worldWidth; x += 270) {
      g.lineBetween(x, 530, x + 116, 520);
      g.lineBetween(x + 38, 652, x + 178, 636);
    }
    g.lineStyle(4, 0xfff3c4, 0.46);
    g.lineBetween(0, this.side.floorY + 20, this.side.worldWidth, this.side.floorY + 20);
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
        this.drawBookShelf(g, shelfX, y + 28, 28, 84);
      }
      return;
    }
    if (kind === 'music') {
      g.fillStyle(0xfff7d6, 1);
      g.fillRect(x + 22, y + 32, 54, 42);
      this.drawMusicNote(g, x + 36, y + 42);
      this.drawMusicNote(g, x + 60, y + 54);
      return;
    }
    if (kind === 'nurse') {
      g.fillStyle(0xffffff, 0.95);
      g.fillRect(x + 22, y + 28, width - 92, height - 96);
      g.fillStyle(0xef4444, 1);
      g.fillRect(x + 54, y + 46, 10, 34);
      g.fillRect(x + 42, y + 58, 34, 10);
      return;
    }
    if (kind === 'science') {
      g.fillStyle(THEME.colors.locker, 1);
      g.fillRect(x + 20, y + 26, width - 92, 68);
      g.fillStyle(0x9bdaf1, 1);
      for (let bottleX = x + 30; bottleX < x + width - 102; bottleX += 24) {
        g.fillRect(bottleX, y + 48, 10, 24);
        g.fillRect(bottleX + 2, y + 42, 6, 8);
      }
      return;
    }
    if (kind === 'staff') {
      g.fillStyle(THEME.colors.locker, 1);
      g.fillRect(x + 18, y + 24, width - 84, 88);
      g.lineStyle(2, 0x35505a, 0.7);
      for (let lineX = x + 44; lineX < x + width - 90; lineX += 26) g.lineBetween(lineX, y + 28, lineX, y + 108);
      return;
    }
    if (kind === 'storage') {
      this.drawShoeBoxes(g, x + 24, y + 34, Math.max(4, Math.floor((width - 90) / 24)));
      return;
    }

    g.fillStyle(THEME.colors.chalkboard, 1);
    g.fillRect(x + 24, y + 26, width - 94, 48);
    g.lineStyle(3, 0x214d37, 1);
    g.strokeRect(x + 24, y + 26, width - 94, 48);
    g.fillStyle(0xfff7d6, 0.9);
    g.fillRect(x + 34, y + 56, 34, 4);
    g.fillStyle(0xf87171, 0.85);
    g.fillRect(x + width - 130, y + 34, 18, 18);
    g.fillStyle(THEME.colors.paper, 0.9);
    g.fillRect(x + width - 106, y + 36, 18, 16);
  }

  private drawClassroomDesks(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number): void {
    for (let row = 0; row < 2; row += 1) {
      for (let deskX = x + 28; deskX < x + width - 84; deskX += 46) {
        const deskY = y + 174 + row * 38;
        g.fillStyle(0x7c4a24, 0.95);
        g.fillRect(deskX, deskY + 12, 30, 8);
        g.fillStyle(0xa86934, 1);
        g.fillRect(deskX, deskY, 30, 18);
      }
    }
  }

  private drawExperimentTables(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number): void {
    for (let tableX = x + 28; tableX < x + width - 92; tableX += 70) {
      g.fillStyle(0x177f78, 1);
      g.fillRect(tableX, y + 178, 54, 24);
      g.fillStyle(0xe8fbff, 0.92);
      g.fillTriangle(tableX + 12, y + 160, tableX + 4, y + 188, tableX + 22, y + 188);
      g.fillRect(tableX + 34, y + 164, 12, 26);
    }
  }

  private drawSeatedStudent(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
    const scale = SIDE_VISUAL.studentScaleClassroomSitting;
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(x, y + 16, 20 * scale, 6 * scale);
    g.fillStyle(THEME.colors.playerFace, 0.98);
    g.fillRect(x - 6 * scale, y - 18 * scale, 12 * scale, 11 * scale);
    g.fillStyle(0x2d1c14, 1);
    g.fillRect(x - 6 * scale, y - 22 * scale, 12 * scale, 4 * scale);
    g.fillStyle(color, 0.96);
    g.fillRect(x - 8 * scale, y - 6 * scale, 16 * scale, 16 * scale);
    g.fillStyle(0xa86934, 1);
    g.fillRect(x - 18 * scale, y + 4 * scale, 36 * scale, 14 * scale);
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
