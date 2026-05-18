import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { THEME } from '../config/visualTheme';
import { ProgressManager } from '../systems/ProgressManager';

export class TitleScene extends Phaser.Scene {
  private howToOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, THEME.colors.pageBg);
    this.add.rectangle(GAME_WIDTH / 2, 344, 314, 254, THEME.colors.mapBg, 1).setStrokeStyle(6, THEME.colors.mapBorder, 1);
    this.add.rectangle(GAME_WIDTH / 2, 464, 266, 60, THEME.colors.uiPanel, 1).setStrokeStyle(3, THEME.colors.uiBorder, 0.7);
    this.drawSchoolMotif();

    this.add
      .text(GAME_WIDTH / 2, 124, 'チャイムまでに\n帰れ！', {
        fontFamily: THEME.font,
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 8,
        stroke: '#15101d',
        strokeThickness: 5
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 296, '平成の学校ステルス・タイムアタック', {
        fontFamily: THEME.font,
        fontSize: '16px',
        color: '#111827',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 342, '先生の視界で走るとアウト！\n歩きならセーフ。\nチャイムまでに廊下を抜けよう。', {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: '#2f2418',
        align: 'center',
        lineSpacing: 7,
        wordWrap: { width: 286 }
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 414, `解放済み Level ${ProgressManager.load().unlockedLevel}`, {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: THEME.colors.uiText,
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 3
      })
      .setOrigin(0.5);

    this.createButton(GAME_WIDTH / 2, 558, '校舎図へ', () => this.scene.start('SchoolMapScene'));
    this.createButton(GAME_WIDTH / 2, 632, 'Level 1から開始', () => this.scene.start('GameScene', { levelId: 1 }));
    this.createButton(GAME_WIDTH / 2, 706, '遊び方', () => this.showHowTo());
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): void {
    const rect = this.add.rectangle(x + 4, y + 5, 268, 58, THEME.colors.uiShadow, 0.65);
    const button = this.add.rectangle(x, y, 268, 58, 0xfff7d6, 0.96).setStrokeStyle(4, THEME.colors.uiBorder, 1).setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: THEME.font,
        fontSize: '20px',
        color: '#2f2418',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    button.on('pointerdown', () => {
      button.setScale(0.98);
      text.setScale(0.98);
    });
    button.on('pointerup', () => {
      button.setScale(1);
      text.setScale(1);
      onClick();
    });
    button.on('pointerout', () => {
      button.setScale(1);
      text.setScale(1);
    });
    rect.setDepth(0);
    button.setDepth(1);
    text.setDepth(2);
  }

  private drawSchoolMotif(): void {
    const g = this.add.graphics();
    g.fillStyle(THEME.colors.hallA, 1);
    g.fillRect(70, 230, 250, 42);
    g.lineStyle(2, THEME.colors.hallLine, 0.8);
    for (let x = 70; x <= 320; x += 18) {
      g.lineBetween(x, 230, x, 272);
    }
    g.strokeRect(70, 230, 250, 42);

    const rooms = [
      { x: 84, label: '1-1' },
      { x: 154, label: '2-1' },
      { x: 224, label: '理科室' }
    ];
    for (const room of rooms) {
      g.fillStyle(0xc5dfa8, 1);
      g.fillRect(room.x, 180, 56, 48);
      g.fillStyle(THEME.colors.door, 1);
      g.fillRect(room.x + 22, 224, 12, 22);
      this.add
        .text(room.x + 28, 194, room.label, {
          fontFamily: THEME.font,
          fontSize: '12px',
          color: THEME.colors.plateText,
          backgroundColor: '#fff7d6',
          padding: { x: 2, y: 1 }
        })
        .setOrigin(0.5);
    }
  }

  private showHowTo(): void {
    if (this.howToOverlay) return;

    const lines = [
      '左下の← →で移動',
      '右下DASH長押しで走る',
      '先生の視界で走るとゲームオーバー',
      '歩いているだけなら見られてもセーフ',
      'チャイムまでにゴールへ向かう',
      'クリアすると校舎図が解放',
      '全レベルクリアでミニゲーム解放'
    ];
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setInteractive();
    const panel = this.add.rectangle(GAME_WIDTH / 2, 402, 328, 438, THEME.colors.uiPanel, 0.97).setStrokeStyle(5, THEME.colors.uiBorder, 1);
    const title = this.add
      .text(GAME_WIDTH / 2, 220, '遊び方', {
        fontFamily: THEME.font,
        fontSize: '28px',
        color: THEME.colors.uiText,
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 4
      })
      .setOrigin(0.5);
    const body = this.add
      .text(GAME_WIDTH / 2, 386, lines.join('\n'), {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: '#fff5d6',
        align: 'left',
        lineSpacing: 9,
        stroke: '#15101d',
        strokeThickness: 3,
        wordWrap: { width: 286 }
      })
      .setOrigin(0.5);
    const close = this.add.rectangle(GAME_WIDTH / 2, 604, 220, 52, THEME.colors.goalFrame, 0.96).setStrokeStyle(3, 0xffffff, 0.35).setInteractive({ useHandCursor: true });
    const closeText = this.add
      .text(GAME_WIDTH / 2, 604, '閉じる', {
        fontFamily: THEME.font,
        fontSize: '20px',
        color: '#2f2418',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const hide = () => {
      this.howToOverlay?.destroy(true);
      this.howToOverlay = undefined;
    };
    close.on('pointerup', hide);
    dim.on('pointerup', hide);

    this.howToOverlay = this.add.container(0, 0, [dim, panel, title, body, close, closeText]).setDepth(1500);
  }
}
