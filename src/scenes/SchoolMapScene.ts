import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SAFE_MARGIN } from '../config/gameConfig';
import { THEME } from '../config/visualTheme';
import { LevelManager } from '../systems/LevelManager';
import { ProgressManager, type ProgressSummary } from '../systems/ProgressManager';

interface MapRoom {
  label: string;
  icon: string;
  levelId?: number;
  areaKey: string;
  x: number;
  width: number;
}

export class SchoolMapScene extends Phaser.Scene {
  private progress!: ProgressSummary;
  private noticeText?: Phaser.GameObjects.Text;

  constructor() {
    super('SchoolMapScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(THEME.colors.pageBg);
    this.progress = ProgressManager.getSummary();

    this.drawHeader();
    this.drawBuildingMap();
    this.createLevelButtons();
    this.createMiniGameEntrance();
    this.createNavigationButtons();
    this.playUnlockPulse();
  }

  private drawHeader(): void {
    this.add
      .text(SAFE_MARGIN.left, SAFE_MARGIN.top - 4, '校舎図', {
        fontFamily: THEME.font,
        fontSize: '32px',
        color: THEME.colors.uiText,
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 5
      })
      .setOrigin(0, 0);

    const cleared = this.progress.clearedLevels.length;
    const rate = Math.round(this.progress.clearRate * 100);
    this.add
      .text(SAFE_MARGIN.left, SAFE_MARGIN.top + 34, `解放率 ${rate}%  クリア ${cleared}/5`, {
        fontFamily: THEME.font,
        fontSize: '16px',
        color: '#fff5d6',
        backgroundColor: '#2b2435',
        padding: { x: 6, y: 3 }
      })
      .setOrigin(0, 0);
  }

  private drawBuildingMap(): void {
    this.drawFloor(108, '3F', [
      { label: '図書室', icon: '本', levelId: 4, areaKey: '3F図書室・階段周辺', x: 54, width: 74 },
      { label: '音楽室', icon: '♪', levelId: 5, areaKey: '校舎図全体', x: 134, width: 74 },
      { label: '階段', icon: '階', levelId: 4, areaKey: '3F図書室・階段周辺', x: 214, width: 70 }
    ]);

    this.drawFloor(218, '2F', [
      { label: '理科室', icon: '⚗', levelId: 2, areaKey: '2F理科室・教室周辺', x: 54, width: 74 },
      { label: '2-1', icon: '□', levelId: 2, areaKey: '2F理科室・教室周辺', x: 134, width: 74 },
      { label: '職員室前', icon: '先', levelId: 4, areaKey: '3F図書室・階段周辺', x: 214, width: 86 }
    ]);

    this.drawFloor(328, '1F', [
      { label: '1-1', icon: '□', levelId: 1, areaKey: '1F玄関周辺', x: 46, width: 58 },
      { label: '保健室', icon: '+', levelId: 3, areaKey: '1F保健室・教室周辺', x: 110, width: 74 },
      { label: '下駄箱', icon: '▤', levelId: 3, areaKey: '1F保健室・教室周辺', x: 190, width: 70 },
      { label: '玄関', icon: '◎', levelId: 1, areaKey: '1F玄関周辺', x: 266, width: 62 }
    ]);
  }

  private drawFloor(y: number, floorLabel: string, rooms: MapRoom[]): void {
    const bg = this.add.rectangle(GAME_WIDTH / 2, y + 42, 330, 88, THEME.colors.mapBg, 1).setStrokeStyle(4, THEME.colors.mapBorder, 1);
    this.add
      .text(42, y + 8, floorLabel, {
        fontFamily: THEME.font,
        fontSize: '23px',
        color: '#fff5d6',
        fontStyle: 'bold',
        backgroundColor: '#2b2435',
        padding: { x: 6, y: 2 },
        stroke: '#15101d',
        strokeThickness: 3
      })
      .setDepth(2);

    this.add.rectangle(GAME_WIDTH / 2, y + 48, 274, 22, THEME.colors.hallB, 1).setStrokeStyle(2, THEME.colors.hallLine, 0.9);

    rooms.forEach((room) => this.drawMapRoom(room, y));
    bg.setDepth(0);
  }

  private drawMapRoom(room: MapRoom, floorY: number): void {
    const x = room.x + room.width / 2;
    const unlocked = this.isAreaUnlocked(room.areaKey, room.levelId);
    const cleared = room.levelId ? this.progress.clearedLevels.includes(room.levelId) : false;
    const next = room.levelId === this.progress.unlockedLevel && !cleared;
    const fill = unlocked ? this.getRoomColor(room.label) : 0x535b68;
    const alpha = unlocked ? 1 : 0.58;

    const rect = this.add.rectangle(x, floorY + 50, room.width, 44, fill, alpha).setStrokeStyle(3, unlocked ? THEME.colors.uiBorder : 0x9ca3af, unlocked ? 0.9 : 0.35);
    const icon = this.add
      .text(x, floorY + 40, unlocked ? room.icon : '？', {
        fontFamily: THEME.font,
        fontSize: '18px',
        color: unlocked ? '#2f2418' : '#e5e7eb',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    const label = this.add
      .text(x, floorY + 61, unlocked ? room.label : '？？？', {
        fontFamily: THEME.font,
        fontSize: '14px',
        color: unlocked ? '#2f2418' : '#e5e7eb',
        align: 'center',
        backgroundColor: unlocked ? '#fff7d6' : '#374151',
        padding: { x: 2, y: 1 },
        wordWrap: { width: room.width + 14 }
      })
      .setOrigin(0.5);

    if (cleared) {
      this.add
        .text(x + room.width / 2 - 10, floorY + 28, '✓', {
          fontFamily: THEME.font,
          fontSize: '16px',
          color: '#166534',
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
    }

    if (next) {
      this.tweens.add({
        targets: rect,
        alpha: 0.55,
        duration: 420,
        yoyo: true,
        repeat: -1
      });
    }

    if (room.levelId) {
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerup', () => {
        if (ProgressManager.isLevelUnlocked(room.levelId!)) {
          this.scene.start('GameScene', { levelId: room.levelId });
        } else {
          this.showNotice('まだ解放されていません');
        }
      });
      icon.setInteractive({ useHandCursor: true }).on('pointerup', () => rect.emit('pointerup'));
      label.setInteractive({ useHandCursor: true }).on('pointerup', () => rect.emit('pointerup'));
    }
  }

  private createLevelButtons(): void {
    this.add
      .text(SAFE_MARGIN.left, 442, 'Level選択', {
        fontFamily: THEME.font,
        fontSize: '22px',
        color: THEME.colors.uiText,
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 4
      })
      .setOrigin(0, 0.5);

    LevelManager.getAllLevels().forEach((level, index) => {
      const y = 486 + index * 44;
      const unlocked = ProgressManager.isLevelUnlocked(level.id);
      const cleared = ProgressManager.isLevelCleared(level.id);
      const next = level.id === this.progress.unlockedLevel && !cleared;
      const fill = unlocked ? (cleared ? 0x86efac : 0xfff7d6) : 0x4b5563;
      const rect = this.add.rectangle(GAME_WIDTH / 2, y, 326, 40, fill, unlocked ? 0.96 : 0.66).setStrokeStyle(3, next ? THEME.colors.goalFrame : THEME.colors.uiBorder, next ? 1 : 0.45);

      const label = `${cleared ? '✓ ' : ''}L${level.id} ${unlocked ? level.name : '未解放'}`;
      this.add
        .text(46, y, label, {
          fontFamily: THEME.font,
          fontSize: '14px',
          color: unlocked ? '#2f2418' : '#e5e7eb',
          fontStyle: 'bold',
          wordWrap: { width: 288 }
        })
        .setOrigin(0, 0.5);

      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerup', () => {
        if (unlocked) {
          this.scene.start('GameScene', { levelId: level.id });
        } else {
          this.showNotice('まだ解放されていません');
        }
      });

      if (next) {
        this.tweens.add({ targets: rect, scaleX: 1.02, scaleY: 1.08, duration: 420, yoyo: true, repeat: -1 });
      }
    });
  }

  private createMiniGameEntrance(): void {
    const y = GAME_HEIGHT - 118;
    const unlocked = ProgressManager.isMiniGameUnlocked();
    const rect = this.add
      .rectangle(GAME_WIDTH / 2, y, 326, 48, unlocked ? THEME.colors.goalFrame : 0x4b5563, unlocked ? 0.96 : 0.62)
      .setStrokeStyle(3, THEME.colors.uiBorder, unlocked ? 0.95 : 0.35)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, y, unlocked ? '玄関ホール：上履き探し' : 'ミニゲーム：？？？', {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: unlocked ? '#2f2418' : '#e5e7eb',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    rect.on('pointerup', () => {
      if (unlocked) {
        this.scene.start('MiniGameScene');
      } else {
        this.showNotice('Level 5クリアで解放');
      }
    });
  }

  private createNavigationButtons(): void {
    this.createSmallButton(GAME_WIDTH - SAFE_MARGIN.right - 42, SAFE_MARGIN.top + 18, 78, 38, '戻る', () => this.scene.start('TitleScene'));
    this.createSmallButton(GAME_WIDTH / 2, GAME_HEIGHT - 54, 170, 42, 'タイトルへ戻る', () => this.scene.start('TitleScene'));
  }

  private createSmallButton(x: number, y: number, width: number, height: number, label: string, onClick: () => void): void {
    const rect = this.add.rectangle(x, y, width, height, THEME.colors.uiPanel, 0.96).setStrokeStyle(3, THEME.colors.uiBorder, 0.85).setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontFamily: THEME.font,
        fontSize: '15px',
        color: THEME.colors.uiText,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    rect.on('pointerup', onClick);
  }

  private isAreaUnlocked(areaKey: string, levelId?: number): boolean {
    if (this.progress.unlockedMapAreas.includes('校舎図全体')) return true;
    if (levelId === 1 && this.progress.unlockedLevel >= 1) return true;
    return this.progress.unlockedMapAreas.includes(areaKey);
  }

  private getRoomColor(label: string): number {
    if (label.includes('玄関')) return THEME.colors.entranceA;
    if (label.includes('階段')) return THEME.colors.stairsA;
    if (label.includes('保健')) return 0xf8fafc;
    if (label.includes('理科')) return 0x92e0dc;
    if (label.includes('図書')) return 0xd9b06f;
    if (label.includes('音楽')) return 0xf7b7d7;
    if (label.includes('職員')) return 0xf8c861;
    return 0xc5dfa8;
  }

  private showNotice(message: string): void {
    this.noticeText?.destroy();
    this.noticeText = this.add
      .text(GAME_WIDTH / 2, 424, message, {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: '#2f2418',
        backgroundColor: '#fff7d6',
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: this.noticeText,
      alpha: 0,
      y: 408,
      delay: 900,
      duration: 500,
      onComplete: () => {
        this.noticeText?.destroy();
        this.noticeText = undefined;
      }
    });
  }

  private playUnlockPulse(): void {
    this.cameras.main.flash(220, 255, 240, 181);
  }
}
