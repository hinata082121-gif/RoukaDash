import Phaser from 'phaser';
import { THEME } from '../config/visualTheme';

export class Student extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, color = 0x4f9ad8) {
    super(scene, x, y);

    const shadow = scene.add.ellipse(0, 15, 18, 7, 0x000000, 0.18);
    const body = scene.add.rectangle(0, 3, 15, 18, color, 1).setStrokeStyle(2, 0x1e3a5f, 0.8);
    const face = scene.add.rectangle(0, -12, 13, 12, THEME.colors.playerFace, 1).setStrokeStyle(2, 0x5c321d, 0.75);
    const hair = scene.add.rectangle(0, -17, 13, 4, 0x2d1c14, 1);
    const bag = scene.add.rectangle(-10, 5, 5, 11, 0xffd166, 0.92);

    this.add([shadow, body, face, hair, bag]);
    this.setDepth(30);
    scene.add.existing(this);

    scene.tweens.add({
      targets: this,
      y: y - 2,
      duration: 620,
      yoyo: true,
      repeat: -1,
      delay: Phaser.Math.Between(0, 500)
    });
  }
}
