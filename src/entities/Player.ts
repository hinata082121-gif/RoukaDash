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
  private mohawk: Phaser.GameObjects.Rectangle;
  private sideBurn: Phaser.GameObjects.Rectangle;
  private bag: Phaser.GameObjects.Rectangle;
  private collar: Phaser.GameObjects.Triangle;
  private buttonA: Phaser.GameObjects.Rectangle;
  private buttonB: Phaser.GameObjects.Rectangle;
  private coatHem: Phaser.GameObjects.Rectangle;
  private frontArm: Phaser.GameObjects.Rectangle;
  private backArm: Phaser.GameObjects.Rectangle;
  private frontLeg: Phaser.GameObjects.Rectangle;
  private backLeg: Phaser.GameObjects.Rectangle;
  private dashDust: Phaser.GameObjects.Rectangle;
  private leftStep: Phaser.GameObjects.Rectangle;
  private rightStep: Phaser.GameObjects.Rectangle;
  private speedLineA: Phaser.GameObjects.Rectangle;
  private speedLineB: Phaser.GameObjects.Rectangle;
  private facingX = 1;
  private readonly walkSpeed = 48;
  private readonly dashSpeed = 152;
  private readonly sideVisualScale = SIDE_VISUAL.playerScale;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.shadow = scene.add.ellipse(0, 22, 38, 13, 0x000000, 0.28);
    this.dashDust = scene.add.rectangle(-18, 25, 22, 7, THEME.colors.dashDust, 0.32).setVisible(false);
    this.leftStep = scene.add.rectangle(-9, 28, 10, 4, THEME.colors.dashDust, 0.38).setVisible(false);
    this.rightStep = scene.add.rectangle(7, 28, 10, 4, THEME.colors.dashDust, 0.38).setVisible(false);
    this.speedLineA = scene.add.rectangle(-24, 5, 20, 3, THEME.colors.dashDust, 0.48).setVisible(false);
    this.speedLineB = scene.add.rectangle(-29, 14, 14, 3, THEME.colors.dashDust, 0.34).setVisible(false);
    this.backLeg = scene.add.rectangle(-6, 23, 8, 18, THEME.colors.playerPants, 1).setStrokeStyle(2, 0x050505, 0.9);
    this.frontLeg = scene.add.rectangle(7, 23, 8, 18, THEME.colors.playerPants, 1).setStrokeStyle(2, 0x050505, 0.9);
    this.bag = scene.add.rectangle(-13, 10, 7, 18, THEME.colors.playerBag, 1).setStrokeStyle(1, 0x050505, 0.75);
    this.backArm = scene.add.rectangle(-11, 7, 7, 23, THEME.colors.playerUniform, 1).setStrokeStyle(2, 0x050505, 0.9);
    this.uniform = scene.add.rectangle(0, 4, 25, 28, THEME.colors.playerUniform, 1).setStrokeStyle(3, 0xf8fafc, 0.72);
    this.collar = scene.add.triangle(2, -7, -10, -8, 10, -8, 2, 5, THEME.colors.playerTrim, 0.92).setStrokeStyle(1, 0x5c4a32, 0.65);
    this.buttonA = scene.add.rectangle(8, 0, 3, 3, THEME.colors.playerTrim, 1);
    this.buttonB = scene.add.rectangle(8, 8, 3, 3, THEME.colors.playerTrim, 1);
    this.coatHem = scene.add.rectangle(0, 18, 27, 6, THEME.colors.playerUniform, 1).setStrokeStyle(2, 0x050505, 0.8);
    this.pants = scene.add.rectangle(0, 18, 21, 10, THEME.colors.playerPants, 1).setStrokeStyle(1, 0x050505, 0.9);
    this.frontArm = scene.add.rectangle(12, 7, 7, 23, THEME.colors.playerUniform, 1).setStrokeStyle(2, 0x050505, 0.9);
    this.head = scene.add.rectangle(6, -17, 20, 17, THEME.colors.playerFace, 1).setStrokeStyle(2, 0x5c321d, 0.9);
    this.sideBurn = scene.add.rectangle(-2, -16, 6, 16, THEME.colors.playerHair, 1);
    this.hair = scene.add.rectangle(4, -27, 19, 8, THEME.colors.playerHair, 1).setStrokeStyle(1, 0x050505, 1);
    this.mohawk = scene.add.rectangle(3, -35, 9, 16, THEME.colors.playerHair, 1).setStrokeStyle(1, 0x050505, 1);
    const nose = scene.add.rectangle(17, -15, 5, 5, THEME.colors.playerFace, 1).setStrokeStyle(1, 0x5c321d, 0.65);
    const eye = scene.add.rectangle(10, -15, 3, 3, 0x15101d, 1);

    this.add([
      this.shadow,
      this.dashDust,
      this.leftStep,
      this.rightStep,
      this.speedLineA,
      this.speedLineB,
      this.backLeg,
      this.frontLeg,
      this.bag,
      this.backArm,
      this.uniform,
      this.collar,
      this.buttonA,
      this.buttonB,
      this.coatHem,
      this.pants,
      this.frontArm,
      this.head,
      this.sideBurn,
      this.hair,
      this.mohawk,
      nose,
      eye
    ]);
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
      this.dashDust.setAlpha(0.2 + Math.abs(pulse) * 0.16);
      this.dashDust.setScale(0.9 + Math.abs(pulse) * 0.2, 1);
      this.leftStep.setAlpha(pulse > 0 ? 0.42 : 0.14);
      this.rightStep.setAlpha(pulse <= 0 ? 0.42 : 0.14);
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
      const absPulse = Math.abs(pulse);
      this.dashDust.setPosition(-20 - absPulse * 4, 25);
      this.dashDust.setAlpha(0.22 + absPulse * 0.18);
      this.dashDust.setScale(1.05 + absPulse * 0.22, 1);
      this.speedLineA.setPosition(-27 - absPulse * 5, 2);
      this.speedLineB.setPosition(-31 - absPulse * 4, 12);
      this.speedLineA.setAlpha(0.38 + absPulse * 0.18);
      this.speedLineB.setAlpha(0.24 + absPulse * 0.14);
      this.leftStep.setAlpha(pulse > 0 ? 0.5 : 0.12);
      this.rightStep.setAlpha(pulse <= 0 ? 0.5 : 0.12);
    }
  }

  private updateSidePose(state: 'idle' | 'walk' | 'dash'): void {
    const time = this.scene.time.now;
    const phase = state === 'dash' ? Math.sin(time * 0.058) : state === 'walk' ? Math.sin(time * 0.02) : Math.sin(time * 0.006) * 0.25;
    const stride = state === 'dash' ? 11 : state === 'walk' ? 4.2 : 0.8;
    const arm = state === 'dash' ? 10 : state === 'walk' ? 4.2 : 0.8;
    const lean = state === 'dash' ? 0.13 : state === 'walk' ? 0.015 : 0;

    this.uniform.setRotation(lean);
    this.pants.setRotation(lean);
    this.collar.setRotation(lean);
    this.coatHem.setRotation(lean);
    this.head.setRotation(lean * 0.5);
    this.hair.setRotation(lean * 0.5);
    this.mohawk.setRotation(lean * 0.35);
    this.sideBurn.setRotation(lean * 0.45);
    this.bag.setPosition(state === 'dash' ? -18 : -13, state === 'dash' ? 13 : 10);
    this.bag.setRotation(state === 'dash' ? -0.16 + phase * 0.03 : state === 'walk' ? phase * 0.04 : 0);
    this.shadow.setScale(state === 'dash' ? 1.36 : state === 'walk' ? 1.08 : 1, state === 'dash' ? 0.82 : 1);
    this.head.setY(state === 'dash' ? -16 : -17 + phase * 0.4);
    this.hair.setY(state === 'dash' ? -26 : -27 + phase * 0.3);
    this.mohawk.setY(state === 'dash' ? -34 : -35 + phase * 0.2);

    this.frontLeg.setPosition(7 + phase * stride * 0.5, state === 'dash' ? 23 + Math.abs(phase) * 1.2 : 22);
    this.backLeg.setPosition(-6 - phase * stride * 0.5, state === 'dash' ? 23 - Math.abs(phase) * 0.4 : 22);
    this.frontLeg.setRotation(phase * (state === 'dash' ? 0.48 : 0.2));
    this.backLeg.setRotation(-phase * (state === 'dash' ? 0.48 : 0.2));
    this.frontArm.setPosition(12 - phase * arm * 0.45, 7);
    this.backArm.setPosition(-11 + phase * arm * 0.45, 7);
    this.frontArm.setRotation(-phase * (state === 'dash' ? 0.68 : 0.24));
    this.backArm.setRotation(phase * (state === 'dash' ? 0.68 : 0.24));
    this.coatHem.setY(state === 'dash' ? 20 + phase * 0.9 : 18);
    this.buttonA.setPosition(state === 'dash' ? 9 : 8, state === 'dash' ? 1 : 0);
    this.buttonB.setPosition(state === 'dash' ? 9 : 8, state === 'dash' ? 9 : 8);
  }

  getPositionVector(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }
}
