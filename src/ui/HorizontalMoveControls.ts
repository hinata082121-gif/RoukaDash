import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/gameConfig';
import { MoveButton } from './MoveButton';

type HorizontalPress = 'left' | 'right';

export class HorizontalMoveControls {
  private leftButton: MoveButton;
  private rightButton: MoveButton;
  private heldOrder: HorizontalPress[] = [];

  constructor(scene: Phaser.Scene) {
    const y = GAME_HEIGHT - 116;
    this.leftButton = new MoveButton(scene, 76, y, '←', () => this.press('left'), () => this.release('left'));
    this.rightButton = new MoveButton(scene, 156, y, '→', () => this.press('right'), () => this.release('right'));
  }

  get directionX(): number {
    const latest = this.heldOrder[this.heldOrder.length - 1];
    if (latest === 'left') return -1;
    if (latest === 'right') return 1;
    return 0;
  }

  destroy(): void {
    this.leftButton.destroy();
    this.rightButton.destroy();
  }

  private press(direction: HorizontalPress): void {
    this.heldOrder = this.heldOrder.filter((value) => value !== direction);
    this.heldOrder.push(direction);
  }

  private release(direction: HorizontalPress): void {
    this.heldOrder = this.heldOrder.filter((value) => value !== direction);
  }
}
