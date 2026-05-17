import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SAFE_MARGIN } from '../config/gameConfig';
import { THEME } from '../config/visualTheme';
import type { InputState } from '../systems/InputManager';

export class Player extends Phaser.GameObjects.Container {
  private shadow: Phaser.GameObjects.Ellipse;
  private head: Phaser.GameObjects.Rectangle;
  private uniform: Phaser.GameObjects.Rectangle;
  private hair: Phaser.GameObjects.Rectangle;
  private bag: Phaser.GameObjects.Rectangle;
  private dashDust: Phaser.GameObjects.Arc;
  private leftStep: Phaser.GameObjects.Ellipse;
  private rightStep: Phaser.GameObjects.Ellipse;
  private readonly walkSpeed = 92;
  private readonly dashSpeed = 168;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.shadow = scene.add.ellipse(0, 12, 24, 10, 0x000000, 0.22);
    this.dashDust = scene.add.circle(0, 17, 10, THEME.colors.uiBorder, 0.35).setScale(1, 0.42).setVisible(false);
    this.leftStep = scene.add.ellipse(-7, 19, 6, 14, THEME.colors.uiBorder, 0.45).setVisible(false);
    this.rightStep = scene.add.ellipse(7, 19, 6, 14, THEME.colors.uiBorder, 0.45).setVisible(false);
    this.uniform = scene.add.rectangle(0, 3, 18, 18, THEME.colors.playerUniform, 1).setStrokeStyle(2, 0x102a68, 1);
    this.head = scene.add.rectangle(0, -12, 16, 14, THEME.colors.playerFace, 1).setStrokeStyle(2, 0x5c321d, 0.9);
    this.hair = scene.add.rectangle(0, -18, 16, 5, THEME.colors.playerHair, 1);
    this.bag = scene.add.rectangle(-12, 4, 7, 14, THEME.colors.playerBag, 1).setStrokeStyle(1, 0x7c2d12, 0.65);

    this.add([this.shadow, this.dashDust, this.leftStep, this.rightStep, this.uniform, this.head, this.hair, this.bag]);
    this.setDepth(40);
    scene.add.existing(this);
  }

  updateFromInput(input: InputState, deltaMs: number, canMoveTo?: (x: number, y: number, radius: number) => boolean, speedMultiplier = 1): void {
    const speed = (input.isDashing ? this.dashSpeed : this.walkSpeed) * speedMultiplier;
    const distance = speed * (deltaMs / 1000);
    const moving = input.direction.lengthSq() > 0;

    if (moving) {
      const nextX = this.x + input.direction.x * distance;
      const nextY = this.y + input.direction.y * distance;
      const radius = 13;
      const canMoveBoth = canMoveTo ? canMoveTo(nextX, nextY, radius) : true;
      const canMoveX = canMoveTo ? canMoveTo(nextX, this.y, radius) : true;
      const canMoveY = canMoveTo ? canMoveTo(this.x, nextY, radius) : true;

      if (canMoveBoth) {
        this.x = nextX;
        this.y = nextY;
      } else {
        if (canMoveX) this.x = nextX;
        if (canMoveY) this.y = nextY;
      }
      this.rotation = input.direction.angle() + Math.PI / 2;
    }

    this.x = Phaser.Math.Clamp(this.x, SAFE_MARGIN.left + 10, GAME_WIDTH - SAFE_MARGIN.right - 10);
    this.y = Phaser.Math.Clamp(this.y, SAFE_MARGIN.top + 56, GAME_HEIGHT - SAFE_MARGIN.bottom - 122);

    this.dashDust.setVisible(input.isDashing && moving);
    this.leftStep.setVisible(input.isDashing && moving);
    this.rightStep.setVisible(input.isDashing && moving);
    if (input.isDashing && moving) {
      const pulse = Math.sin(this.scene.time.now * 0.036);
      this.dashDust.setAlpha(0.25 + pulse * 0.15);
      this.dashDust.setScale(1.1 + Math.sin(this.scene.time.now * 0.025) * 0.18, 0.48);
      this.leftStep.setAlpha(pulse > 0 ? 0.55 : 0.18);
      this.rightStep.setAlpha(pulse <= 0 ? 0.55 : 0.18);
    }
  }

  getPositionVector(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }
}
