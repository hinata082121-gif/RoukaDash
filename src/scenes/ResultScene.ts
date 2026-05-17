import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { THEME } from '../config/visualTheme';
import type { GameResultData } from '../types/LevelTypes';

export class ResultScene extends Phaser.Scene {
  private result!: GameResultData;

  constructor() {
    super('ResultScene');
  }

  init(data: GameResultData): void {
    this.result = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.result.cleared ? 0x164e63 : 0x3f1d1d);
    this.add.rectangle(GAME_WIDTH / 2, 246, 328, 284, THEME.colors.uiPanel, 0.88).setStrokeStyle(5, THEME.colors.uiBorder, 0.95);

    this.add
      .text(GAME_WIDTH / 2, 146, this.result.cleared ? 'クリア！' : '失敗', {
        fontFamily: THEME.font,
        fontSize: '40px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 6
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 232, `クリアタイム ${this.result.clearTime.toFixed(1)}秒\nダッシュ使用回数 ${this.result.dashCount}回`, {
        fontFamily: THEME.font,
        fontSize: '23px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 12,
        stroke: '#15101d',
        strokeThickness: 4
      })
      .setOrigin(0.5);

    if (this.result.cleared) {
      this.add
        .text(GAME_WIDTH / 2, 330, this.result.levelId < 5 ? '次のレベル解放！' : 'ミニゲーム解放！', {
          fontFamily: THEME.font,
          fontSize: '24px',
          color: '#fde68a',
          fontStyle: 'bold',
          stroke: '#15101d',
          strokeThickness: 4
        })
        .setOrigin(0.5);
    } else {
      this.add
        .text(GAME_WIDTH / 2, 330, this.result.reason ?? 'もう一度挑戦しよう', {
          fontFamily: THEME.font,
          fontSize: '20px',
          color: '#fecaca',
          align: 'center',
          stroke: '#15101d',
          strokeThickness: 4,
          wordWrap: { width: 300 }
        })
        .setOrigin(0.5);
    }

    this.createButton(GAME_WIDTH / 2, 470, 'リトライ', COLORS.goal, () => this.scene.start('GameScene', { levelId: this.result.levelId }));
    this.createButton(GAME_WIDTH / 2, 546, '校舎図へ戻る', 0xffffff, () => this.scene.start('SchoolMapScene'));

    if (this.result.cleared && this.result.levelId < 5) {
      this.createButton(GAME_WIDTH / 2, 622, `Level ${this.result.levelId + 1}へ進む`, 0xfde68a, () => this.scene.start('GameScene', { levelId: this.result.levelId + 1 }));
    }

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 74, '歩きなら視界内でもセーフ。ダッシュ中だけ危険。', {
        fontFamily: THEME.font,
        fontSize: '16px',
        color: '#e5e7eb',
        align: 'center',
        backgroundColor: '#111827',
        padding: { x: 8, y: 5 },
        wordWrap: { width: 310 }
      })
      .setOrigin(0.5);
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
    this.add.rectangle(x + 4, y + 5, 262, 58, THEME.colors.uiShadow, 0.6);
    const rect = this.add.rectangle(x, y, 262, 58, color, 0.96).setStrokeStyle(4, THEME.colors.uiBorder, 0.86).setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: THEME.font,
        fontSize: '20px',
        color: color === 0xffffff || color === 0xfde68a ? '#111827' : '#ffffff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    rect.on('pointerdown', () => {
      rect.setScale(0.98);
      text.setScale(0.98);
    });
    rect.on('pointerup', () => {
      rect.setScale(1);
      text.setScale(1);
      onClick();
    });
    rect.on('pointerout', () => {
      rect.setScale(1);
      text.setScale(1);
    });
  }
}
