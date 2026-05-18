import Phaser from 'phaser';
import { THEME } from '../config/visualTheme';

export class MoveButton {
  private base: Phaser.GameObjects.Rectangle;
  private top: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private pointerId: number | null = null;
  private readonly onPointerUp: (pointer: Phaser.Input.Pointer) => void;
  private readonly onPointerCancel: (pointer: Phaser.Input.Pointer) => void;
  isDown = false;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    private onPress: () => void,
    private onRelease: () => void
  ) {
    this.base = scene.add.rectangle(x + 3, y + 4, 70, 68, THEME.colors.uiShadow, 0.55);
    this.top = scene.add.rectangle(x, y, 70, 68, 0x2f4f73, 0.94).setStrokeStyle(4, THEME.colors.uiBorder, 0.95);
    this.label = scene.add
      .text(x, y - 1, label, {
        fontFamily: THEME.font,
        fontSize: '34px',
        color: THEME.colors.uiText,
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 4
      })
      .setOrigin(0.5);

    for (const part of [this.base, this.top, this.label]) {
      part.setScrollFactor(0).setDepth(1000);
    }

    this.top.setInteractive({ useHandCursor: true });
    this.top.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerId = pointer.id;
      this.setPressed(true);
      this.onPress();
    });
    this.top.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      if (this.pointerId === pointer.id) {
        this.release();
      }
    });

    this.onPointerUp = (pointer: Phaser.Input.Pointer) => {
      if (this.pointerId === pointer.id) {
        this.release();
      }
    };
    this.onPointerCancel = this.onPointerUp;
    scene.input.on('pointerup', this.onPointerUp);
    scene.input.on('pointercancel', this.onPointerCancel);
  }

  destroy(): void {
    this.scene.input.off('pointerup', this.onPointerUp);
    this.scene.input.off('pointercancel', this.onPointerCancel);
    this.base.destroy();
    this.top.destroy();
    this.label.destroy();
  }

  private release(): void {
    this.pointerId = null;
    this.setPressed(false);
    this.onRelease();
  }

  private setPressed(pressed: boolean): void {
    this.isDown = pressed;
    this.top.setScale(pressed ? 0.94 : 1);
    this.label.setScale(pressed ? 0.94 : 1);
    this.top.setFillStyle(pressed ? 0x426f9e : 0x2f4f73, pressed ? 1 : 0.94);
  }
}
