import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SAFE_MARGIN } from '../config/gameConfig';
import { THEME } from '../config/visualTheme';

export class MiniGameScene extends Phaser.Scene {
  private correctIndex = 0;
  private completed = false;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('MiniGameScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x182131);
    this.correctIndex = Phaser.Math.Between(0, 11);
    this.completed = false;
    this.add.rectangle(GAME_WIDTH / 2, SAFE_MARGIN.top + 45, 342, 92, THEME.colors.uiPanel, 0.9).setStrokeStyle(4, THEME.colors.uiBorder, 0.95);

    this.add
      .text(SAFE_MARGIN.left, SAFE_MARGIN.top, '上履き探し', {
        fontFamily: THEME.font,
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 5
      })
      .setOrigin(0, 0);

    this.add
      .text(SAFE_MARGIN.left, SAFE_MARGIN.top + 44, '玄関の下駄箱から正しい上履きをタップ', {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: '#fff5d6',
        stroke: '#15101d',
        strokeThickness: 3,
        wordWrap: { width: 314 }
      })
      .setOrigin(0, 0);

    this.add
      .text(GAME_WIDTH - SAFE_MARGIN.right, SAFE_MARGIN.top + 8, '制限なし', {
        fontFamily: THEME.font,
        fontSize: '16px',
        color: '#ffe66d',
        backgroundColor: '#111827',
        padding: { x: 5, y: 3 }
      })
      .setOrigin(1, 0);

    this.drawShoeBoxes();
    this.add.rectangle(GAME_WIDTH / 2, 644, 326, 64, THEME.colors.uiPanel, 0.88).setStrokeStyle(4, THEME.colors.uiBorder, 0.86);
    this.statusText = this.add
      .text(GAME_WIDTH / 2, 644, 'あと少しで帰れる。', {
        fontFamily: THEME.font,
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#15101d',
        strokeThickness: 4,
        wordWrap: { width: 310 }
      })
      .setOrigin(0.5);

    this.createButton(GAME_WIDTH / 2, 734, '校舎図へ戻る', () => this.scene.start('SchoolMapScene'));
  }

  private drawShoeBoxes(): void {
    const startX = 58;
    const startY = 148;
    const boxW = 82;
    const boxH = 86;
    const gap = 18;

    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const index = row * 3 + col;
        const x = startX + col * (boxW + gap);
        const y = startY + row * (boxH + 16);
        const rect = this.add
          .rectangle(x + boxW / 2, y + boxH / 2, boxW, boxH, COLORS.floor, 1)
          .setStrokeStyle(4, 0x5b4636, 1)
          .setInteractive({ useHandCursor: true });

        this.add.rectangle(x + boxW / 2, y + 24, boxW - 12, 8, 0x5b4636, 0.4);
        const label = this.add
          .text(x + boxW / 2, y + boxH - 22, `${index + 1}`, {
            fontFamily: THEME.font,
            fontSize: '22px',
            color: '#111827',
            fontStyle: 'bold'
          })
          .setOrigin(0.5);

        rect.on('pointerdown', () => rect.setScale(0.98));
        rect.on('pointerup', () => {
          rect.setScale(1);
          this.chooseBox(index, rect, label);
        });
        rect.on('pointerout', () => rect.setScale(1));
      }
    }
  }

  private chooseBox(index: number, rect: Phaser.GameObjects.Rectangle, label: Phaser.GameObjects.Text): void {
    if (this.completed) {
      return;
    }

    if (index === this.correctIndex) {
      this.completed = true;
      rect.setFillStyle(0x86efac, 1);
      label.setFontSize(15);
      label.setText('上履き');
      this.statusText.setText('発見！これで帰れる。');
    } else {
      rect.setFillStyle(0xfca5a5, 1);
      label.setFontSize(18);
      label.setText('違う');
      this.statusText.setText('違う下駄箱だった。');
    }
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): void {
    this.add.rectangle(x + 4, y + 5, 268, 58, THEME.colors.uiShadow, 0.6);
    const rect = this.add.rectangle(x, y, 268, 58, 0xffffff, 0.96).setStrokeStyle(4, THEME.colors.uiBorder, 0.86).setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: THEME.font,
        fontSize: '20px',
        color: '#111827',
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
