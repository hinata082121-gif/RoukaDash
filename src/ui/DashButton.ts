import Phaser from 'phaser';
import { THEME } from '../config/visualTheme';

export class DashButton {
  private base: Phaser.GameObjects.Arc;
  private meter: Phaser.GameObjects.Arc;
  private label: Phaser.GameObjects.Text;
  private pointerId: number | null = null;
  private available = true;
  isDown = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.base = scene.add.circle(x, y, 60, THEME.colors.dash, 0.9).setStrokeStyle(5, THEME.colors.uiBorder, 0.9);
    this.meter = scene.add.circle(x, y, 68, 0xffffff, 0).setStrokeStyle(6, 0x86efac, 0.9);
    this.label = scene.add
      .text(x, y, 'DASH', {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: THEME.colors.uiText,
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

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
    this.base.destroy();
    this.meter.destroy();
    this.label.destroy();
  }

  setCharge(charge: number): void {
    const clamped = Phaser.Math.Clamp(charge, 0, 1);
    const color = clamped > 0.32 ? 0x86efac : 0xfbbf24;
    this.meter.setScale(0.78 + clamped * 0.22);
    this.meter.setStrokeStyle(6, color, 0.28 + clamped * 0.62);
  }

  setAvailable(available: boolean): void {
    this.available = available;
    if (!available) {
      this.base.setFillStyle(THEME.colors.dashDisabled, 0.78);
      this.label.setText('REST');
      this.label.setColor('#e5e7eb');
    } else if (!this.isDown) {
      this.base.setFillStyle(THEME.colors.dash, 0.9);
      this.label.setText('DASH');
      this.label.setColor('#ffffff');
    }
  }

  private setPressed(pressed: boolean): void {
    this.isDown = pressed;
    this.base.setScale(pressed ? 0.92 : 1);
    if (this.available) {
      this.base.setFillStyle(pressed ? THEME.colors.dashPressed : THEME.colors.dash, pressed ? 0.98 : 0.9);
      this.label.setText(pressed ? 'RUN' : 'DASH');
    }
  }
}
