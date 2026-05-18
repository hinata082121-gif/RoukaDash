import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { DashButton } from '../ui/DashButton';
import { HorizontalMoveControls } from '../ui/HorizontalMoveControls';
import { VirtualJoystick } from '../ui/VirtualJoystick';

interface CursorKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  shift: Phaser.Input.Keyboard.Key;
}

export interface InputState {
  direction: Phaser.Math.Vector2;
  isDashing: boolean;
  wantsDash: boolean;
  dashEnergy: number;
  inputSource: 'touch' | 'keyboard' | 'none';
}

export type InputMode = 'joystick' | 'horizontalButtons';

export class InputManager {
  private joystick?: VirtualJoystick;
  private horizontalControls?: HorizontalMoveControls;
  private dashButton: DashButton;
  private keys?: CursorKeys;
  readonly state: InputState = {
    direction: new Phaser.Math.Vector2(0, 0),
    isDashing: false,
    wantsDash: false,
    dashEnergy: 1,
    inputSource: 'none'
  };
  private dashEnergy = 1;
  private readonly dashDrainPerSecond = 0.32;
  private readonly dashRecoverPerSecond = 0.24;
  private readonly dashResumeThreshold = 0.18;

  constructor(private scene: Phaser.Scene, private mode: InputMode = 'joystick') {
    if (mode === 'horizontalButtons') {
      this.horizontalControls = new HorizontalMoveControls(scene);
    } else {
      this.joystick = new VirtualJoystick(scene, 82, GAME_HEIGHT - 126);
    }
    this.dashButton = new DashButton(scene, GAME_WIDTH - 82, GAME_HEIGHT - 126);

    if (scene.input.keyboard) {
      this.keys = scene.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        w: Phaser.Input.Keyboard.KeyCodes.W,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
      }) as CursorKeys;
    }
  }

  update(deltaMs: number): InputState {
    const keyboardVector = this.mode === 'horizontalButtons' ? this.getHorizontalKeyboardVector() : this.getKeyboardVector();

    if (this.mode === 'horizontalButtons') {
      const buttonX = this.horizontalControls?.directionX ?? 0;
      if (buttonX !== 0) {
        this.state.direction.set(buttonX, 0);
        this.state.inputSource = 'touch';
      } else {
        this.state.direction.copy(keyboardVector);
        this.state.inputSource = keyboardVector.lengthSq() > 0.01 ? 'keyboard' : this.dashButton.isDown ? 'touch' : Boolean(this.keys?.shift.isDown) ? 'keyboard' : 'none';
      }
      this.state.direction.y = 0;
    } else {
      const joystickVector = this.joystick?.vector ?? new Phaser.Math.Vector2(0, 0);
      if (joystickVector.lengthSq() > 0.01) {
        this.state.direction.copy(joystickVector);
        this.state.inputSource = 'touch';
      } else {
        this.state.direction.copy(keyboardVector);
        this.state.inputSource = keyboardVector.lengthSq() > 0.01 ? 'keyboard' : this.dashButton.isDown ? 'touch' : Boolean(this.keys?.shift.isDown) ? 'keyboard' : 'none';
      }
    }

    const wantsDash = this.dashButton.isDown || Boolean(this.keys?.shift.isDown);
    const moving = this.state.direction.lengthSq() > 0.01;
    const available = this.dashEnergy > 0 && (this.state.isDashing || this.dashEnergy >= this.dashResumeThreshold);
    this.state.isDashing = wantsDash && moving && available;
    this.state.wantsDash = wantsDash;

    const deltaSeconds = deltaMs / 1000;
    if (this.state.isDashing) {
      this.dashEnergy = Phaser.Math.Clamp(this.dashEnergy - this.dashDrainPerSecond * deltaSeconds, 0, 1);
    } else {
      this.dashEnergy = Phaser.Math.Clamp(this.dashEnergy + this.dashRecoverPerSecond * deltaSeconds, 0, 1);
    }

    this.state.dashEnergy = this.dashEnergy;
    this.dashButton.setCharge(this.dashEnergy);
    this.dashButton.setAvailable(this.dashEnergy >= this.dashResumeThreshold || this.state.isDashing);
    return this.state;
  }

  destroy(): void {
    this.joystick?.destroy();
    this.horizontalControls?.destroy();
    this.dashButton.destroy();
  }

  private getKeyboardVector(): Phaser.Math.Vector2 {
    const direction = new Phaser.Math.Vector2(0, 0);
    if (!this.keys) {
      return direction;
    }

    if (this.keys.left.isDown || this.keys.a.isDown) direction.x -= 1;
    if (this.keys.right.isDown || this.keys.d.isDown) direction.x += 1;
    if (this.keys.up.isDown || this.keys.w.isDown) direction.y -= 1;
    if (this.keys.down.isDown || this.keys.s.isDown) direction.y += 1;

    return direction.lengthSq() > 0 ? direction.normalize() : direction;
  }

  private getHorizontalKeyboardVector(): Phaser.Math.Vector2 {
    const direction = new Phaser.Math.Vector2(0, 0);
    if (!this.keys) {
      return direction;
    }

    if (this.keys.left.isDown || this.keys.a.isDown) direction.x -= 1;
    if (this.keys.right.isDown || this.keys.d.isDown) direction.x += 1;

    return direction.lengthSq() > 0 ? direction.normalize() : direction;
  }
}
