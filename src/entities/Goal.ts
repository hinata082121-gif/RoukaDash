import Phaser from 'phaser';
import { THEME } from '../config/visualTheme';

export class Goal extends Phaser.GameObjects.Container {
  private rect: Phaser.Geom.Rectangle;
  private frame: Phaser.GameObjects.Rectangle;
  private glow: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, label: string) {
    super(scene, x, y);
    this.rect = new Phaser.Geom.Rectangle(x, y, width, height);

    this.glow = scene.add.rectangle(width / 2, height / 2, width + 12, height + 12, THEME.colors.goalGlow, 0.22);
    this.frame = scene.add.rectangle(width / 2, height / 2, width, height, 0x102a43, 0.16).setStrokeStyle(4, THEME.colors.goalFrame, 0.95);
    const text = scene.add
      .text(width / 2, height / 2, label, {
        fontFamily: THEME.font,
        fontSize: '13px',
        color: '#fff5d6',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: Math.max(60, width - 8) }
      })
      .setOrigin(0.5);

    this.add([this.glow, this.frame, text]);
    this.setDepth(15);
    scene.add.existing(this);

    scene.tweens.add({
      targets: this.glow,
      alpha: 0.45,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 700,
      yoyo: true,
      repeat: -1
    });
  }

  contains(x: number, y: number): boolean {
    return Phaser.Geom.Rectangle.Contains(this.rect, x, y);
  }

  getCenterVector(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.rect.centerX, this.rect.centerY);
  }
}
