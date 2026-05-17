import Phaser from 'phaser';
import { ProgressManager } from '../systems/ProgressManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.setPath('/assets');
  }

  create(): void {
    ProgressManager.load();
    this.scene.start('TitleScene');
  }
}
