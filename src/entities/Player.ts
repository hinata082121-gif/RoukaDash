import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SAFE_MARGIN } from '../config/gameConfig';
import { SIDE_VISUAL, THEME } from '../config/visualTheme';
import type { InputState } from '../systems/InputManager';

export class Player extends Phaser.GameObjects.Container {
  private shadow: Phaser.GameObjects.Ellipse;
  private head: Phaser.GameObjects.Rectangle;
  private uniform: Phaser.GameObjects.Rectangle;
  private pants: Phaser.GameObjects.Rectangle;
  private hair: Phaser.GameObjects.Rectangle;
  private bag: Phaser.GameObjects.Rectangle;
  private frontArm: Phaser.GameObjects.Rectangle;
  private backArm: Phaser.GameObjects.Rectangle;
  private frontLeg: Phaser.GameObjects.Rectangle;
  private backLeg: Phaser.GameObjects.Rectangle;
  private dashDust: Phaser.GameObjects.Arc;
  private leftStep: Phaser.GameObjects.Ellipse;
  private rightStep: Phaser.GameObjects.Ellipse;
  private speedLineA: Phaser.GameObjects.Rectangle;
  private speedLineB: Phaser.GameObjects.Rectangle;
  private facingX = 1;
  private readonly walkSpeed = 48;
  private readonly dashSpeed = 152;
  private readonly sideVisualScale = SIDE_VISUAL.playerScale;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.shadow = scene.add.ellipse(0, 20, 34, 12, 0x000000, 0.25);
    this.dashDust = scene.add.circle(-18, 23, 12, THEME.colors.uiBorder, 0.35).setScale(1.2, 0.42).setVisible(false);
    this.leftStep = scene.add.ellipse(-8, 24, 7, 16, THEME.colors.uiBorder, 0.45).setVisible(false);
    this.rightStep = scene.add.ellipse(8, 24, 7, 16, THEME.colors.uiBorder, 0.45).setVisible(false);
    this.speedLineA = scene.add.rectangle(-22, 6, 18, 3, THEME.colors.uiBorder, 0.45).setVisible(false);
    this.speedLineB = scene.add.rectangle(-25, 14, 13, 3, THEME.colors.uiBorder, 0.32).setVisible(false);
    this.backLeg = scene.add.rectangle(-5, 21, 7, 16, 0x1e3a8a, 1).setStrokeStyle(1, 0x102a68, 0.9);
    this.frontLeg = scene.add.rectangle(7, 21, 7, 16, 0x1e3a8a, 1).setStrokeStyle(1, 0x102a68, 0.9);
    this.bag = scene.add.rectangle(-12, 5, 9, 18, THEME.colors.playerBag, 1).setStrokeStyle(1, 0x7c2d12, 0.65);
    this.backArm = scene.add.rectangle(-9, 6, 6, 20, THEME.colors.playerFace, 1).setStrokeStyle(1, 0x5c321d, 0.75);
    this.uniform = scene.add.rectangle(0, 3, 21, 22, THEME.colors.playerUniform, 1).setStrokeStyle(2, 0x102a68, 1);
    this.pants = scene.add.rectangle(0, 15, 19, 9, 0x1e3a8a, 1).setStrokeStyle(1, 0x102a68, 0.9);
    this.frontArm = scene.add.rectangle(9, 6, 6, 20, THEME.colors.playerFace, 1).setStrokeStyle(1, 0x5c321d, 0.75);
    this.head = scene.add.rectangle(5, -14, 18, 16, THEME.colors.playerFace, 1).setStrokeStyle(2, 0x5c321d, 0.9);
    this.hair = scene.add.rectangle(3, -22, 20, 7, THEME.colors.playerHair, 1);
    const nose = scene.add.rectangle(15, -12, 4, 5, THEME.colors.playerFace, 1).setStrokeStyle(1, 0x5c321d, 0.65);
    const eye = scene.add.rectangle(10, -15, 3, 3, 0x15101d, 1);

    this.add([this.shadow, this.dashDust, this.leftStep, this.rightStep, this.speedLineA, this.speedLineB, this.backLeg, this.frontLeg, this.bag, this.backArm, this.uniform, this.pants, this.frontArm, this.head, this.hair, nose, eye]);
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

  updateSideScroll(input: InputState, deltaMs: number, floorY: number, minX: number, maxX: number): void {
    const horizontal = Phaser.Math.Clamp(input.direction.x, -1, 1);
    const moving = Math.abs(horizontal) > 0.02;
    const speed = input.isDashing ? this.dashSpeed : this.walkSpeed;
    this.x = Phaser.Math.Clamp(this.x + horizontal * speed * (deltaMs / 1000), minX, maxX);
    this.y = floorY;
    this.rotation = 0;
    if (horizontal < -0.02) this.facingX = -1;
    if (horizontal > 0.02) this.facingX = 1;
    this.setScale(this.facingX * this.sideVisualScale, this.sideVisualScale);
    this.updateSidePose(moving ? (input.isDashing ? 'dash' : 'walk') : 'idle');

    this.dashDust.setVisible(input.isDashing && moving);
    this.leftStep.setVisible(input.isDashing && moving);
    this.rightStep.setVisible(input.isDashing && moving);
    this.speedLineA.setVisible(input.isDashing && moving);
    this.speedLineB.setVisible(input.isDashing && moving);
    if (input.isDashing && moving) {
      const pulse = Math.sin(this.scene.time.now * 0.036);
      this.dashDust.setAlpha(0.25 + pulse * 0.15);
      this.dashDust.setScale(1.45 + Math.sin(this.scene.time.now * 0.025) * 0.22, 0.58);
      this.leftStep.setAlpha(pulse > 0 ? 0.55 : 0.18);
      this.rightStep.setAlpha(pulse <= 0 ? 0.55 : 0.18);
    }
  }

  private updateSidePose(state: 'idle' | 'walk' | 'dash'): void {
    const time = this.scene.time.now;
    const phase = state === 'dash' ? Math.sin(time * 0.045) : state === 'walk' ? Math.sin(time * 0.018) : 0;
    const stride = state === 'dash' ? 8 : state === 'walk' ? 4 : 0;
    const arm = state === 'dash' ? 7 : state === 'walk' ? 4 : 1;
    const lean = state === 'dash' ? 0.08 : 0;

    this.uniform.setRotation(lean);
    this.pants.setRotation(lean);
    this.head.setRotation(lean * 0.5);
    this.hair.setRotation(lean * 0.5);
    this.bag.setPosition(state === 'dash' ? -16 : -12, state === 'dash' ? 7 : 5);
    this.bag.setRotation(state === 'dash' ? -0.12 : 0);
    this.shadow.setScale(state === 'dash' ? 1.22 : 1, state === 'dash' ? 0.9 : 1);

    this.frontLeg.setPosition(7 + phase * stride * 0.45, 21);
    this.backLeg.setPosition(-5 - phase * stride * 0.45, 21);
    this.frontLeg.setRotation(phase * (state === 'dash' ? 0.32 : 0.18));
    this.backLeg.setRotation(-phase * (state === 'dash' ? 0.32 : 0.18));
    this.frontArm.setPosition(9 - phase * arm * 0.45, 6);
    this.backArm.setPosition(-9 + phase * arm * 0.45, 6);
    this.frontArm.setRotation(-phase * (state === 'dash' ? 0.45 : 0.22));
    this.backArm.setRotation(phase * (state === 'dash' ? 0.45 : 0.22));
  }

  getPositionVector(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }
}
