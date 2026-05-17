import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { THEME } from '../config/visualTheme';

export class VirtualJoystick {
  private base: Phaser.GameObjects.Arc;
  private knob: Phaser.GameObjects.Arc;
  private touchArea: Phaser.GameObjects.Zone;
  private activePointerId: number | null = null;
  private originX: number;
  private originY: number;
  private readonly restX: number;
  private readonly restY: number;
  private readonly maxDistance = 48;
  private readonly deadZone = 8;
  readonly vector = new Phaser.Math.Vector2(0, 0);

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.restX = x;
    this.restY = y;
    this.originX = x;
    this.originY = y;
    this.touchArea = scene.add.zone(0, GAME_HEIGHT - 310, GAME_WIDTH * 0.58, 310).setOrigin(0, 0).setInteractive();
    this.base = scene.add.circle(x, y, 62, THEME.colors.uiPanel, 0.46).setStrokeStyle(4, THEME.colors.uiBorder, 0.45);
    this.knob = scene.add.circle(x, y, 25, THEME.colors.hallA, 0.78).setStrokeStyle(3, THEME.colors.mapBorder, 0.75);

    this.touchArea.setScrollFactor(0).setDepth(999);
    this.base.setScrollFactor(0).setDepth(1000);
    this.knob.setScrollFactor(0).setDepth(1001);

    this.touchArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.activePointerId = pointer.id;
      this.originX = pointer.x;
      this.originY = pointer.y;
      this.base.setPosition(this.originX, this.originY).setAlpha(0.74);
      this.knob.setPosition(this.originX, this.originY).setAlpha(0.82);
      this.updateVector(pointer.x, pointer.y);
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId === pointer.id) {
        this.updateVector(pointer.x, pointer.y);
      }
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId === pointer.id) {
        this.reset();
      }
    });

    scene.input.on('pointercancel', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId === pointer.id) {
        this.reset();
      }
    });
  }

  destroy(): void {
    this.touchArea.destroy();
    this.base.destroy();
    this.knob.destroy();
  }

  private updateVector(pointerX: number, pointerY: number): void {
    const dx = pointerX - this.originX;
    const dy = pointerY - this.originY;
    const rawDistance = Math.hypot(dx, dy);
    const length = Math.min(this.maxDistance, rawDistance);
    const angle = Math.atan2(dy, dx);

    if (rawDistance < this.deadZone) {
      this.vector.set(0, 0);
    } else {
      const strength = Phaser.Math.Clamp((rawDistance - this.deadZone) / (this.maxDistance - this.deadZone), 0, 1);
      this.vector.set(Math.cos(angle) * strength, Math.sin(angle) * strength);
    }

    this.knob.setPosition(this.originX + Math.cos(angle) * length, this.originY + Math.sin(angle) * length);
  }

  private reset(): void {
    this.activePointerId = null;
    this.vector.set(0, 0);
    this.originX = this.restX;
    this.originY = this.restY;
    this.base.setPosition(this.originX, this.originY).setAlpha(1);
    this.knob.setPosition(this.originX, this.originY).setAlpha(1);
  }
}
