import Phaser from 'phaser';
import { THEME } from '../config/visualTheme';

export class DashButton {
  private shadow: Phaser.GameObjects.Arc;
  private base: Phaser.GameObjects.Arc;
  private meter: Phaser.GameObjects.Arc;
  private label: Phaser.GameObjects.Text;
  private pointerId: number | null = null;
  private available = true;
  private readonly x: number;
  private readonly y: number;
  isDown = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.shadow = scene.add.circle(x + 4, y + 6, 55, THEME.colors.uiShadow, 0.42);
    this.base = scene.add.circle(x, y, 54, THEME.colors.dash, 0.9).setStrokeStyle(5, THEME.colors.uiBorder, 0.9);
    this.meter = scene.add.circle(x, y, 62, 0xffffff, 0).setStrokeStyle(6, THEME.colors.dashRing, 0.9);
    this.label = scene.add
      .text(x, y, 'DASH', {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: THEME.colors.uiText,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.shadow.setScrollFactor(0).setDepth(999);
    this.base.setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true });
    this.meter.setScrollFactor(0).setDepth(1001);
    this.label.setScrollFactor(0).setDepth(1001);

    this.base.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerId = pointer.id;
      this.setPressed(true);
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.pointerId === pointer.id) {
        this.pointerId = null;
        this.setPressed(false);
      }
    });

    scene.input.on('pointercancel', (pointer: Phaser.Input.Pointer) => {
      if (this.pointerId === pointer.id) {
        this.pointerId = null;
        this.setPressed(false);
      }
    });

    this.base.on('pointerout', (_pointer: Phaser.Input.Pointer) => {
      if (this.isDown) {
        this.pointerId = null;
        this.setPressed(false);
      }
    });
  }

  destroy(): void {
    this.shadow.destroy();
    this.base.destroy();
    this.meter.destroy();
    this.label.destroy();
  }

  setCharge(charge: number): void {
    const clamped = Phaser.Math.Clamp(charge, 0, 1);
    const color = clamped > 0.32 ? THEME.colors.dashRing : 0xfbbf24;
    const pressedScale = this.isDown ? 0.94 : 1;
    this.meter.setScale((0.78 + clamped * 0.22) * pressedScale);
    this.meter.setStrokeStyle(this.isDown ? 8 : 6, color, this.isDown ? 0.95 : 0.28 + clamped * 0.62);
  }

  setAvailable(available: boolean): void {
    this.available = available;
    if (!available) {
      this.base.setFillStyle(THEME.colors.dashDisabled, 0.78);
      this.base.setStrokeStyle(5, 0xd6d3d1, 0.55);
      this.label.setText('REST');
      this.label.setColor('#e5e7eb');
    } else if (!this.isDown) {
      this.base.setFillStyle(THEME.colors.dash, 0.9);
      this.base.setStrokeStyle(5, THEME.colors.uiBorder, 0.9);
      this.label.setText('DASH');
      this.label.setColor('#ffffff');
    }
  }

  private setPressed(pressed: boolean): void {
    this.isDown = pressed;
    const offset = pressed ? 4 : 0;
    this.base.setPosition(this.x, this.y + offset);
    this.meter.setPosition(this.x, this.y + offset);
    this.label.setPosition(this.x, this.y + offset);
    this.base.setScale(pressed ? 0.9 : 1);
    this.label.setScale(pressed ? 0.94 : 1);
    this.shadow.setScale(pressed ? 0.92 : 1);
    this.shadow.setAlpha(pressed ? 0.28 : 0.42);
    if (this.available) {
      this.base.setFillStyle(pressed ? THEME.colors.dashPressed : THEME.colors.dash, pressed ? 0.98 : 0.9);
      this.base.setStrokeStyle(pressed ? 7 : 5, pressed ? THEME.colors.dashRing : THEME.colors.uiBorder, pressed ? 0.96 : 0.9);
      this.meter.setStrokeStyle(pressed ? 8 : 6, THEME.colors.dashRing, pressed ? 0.96 : 0.7);
      this.label.setText(pressed ? 'RUN' : 'DASH');
      this.label.setColor(pressed ? '#fff7d6' : '#ffffff');
    }
  }
}
