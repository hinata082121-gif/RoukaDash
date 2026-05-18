import Phaser from 'phaser';
import { THEME } from '../config/visualTheme';

export class Student extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, color = 0x4f9ad8, scale = 1, depth = 30) {
    super(scene, x, y);

    const shadow = scene.add.ellipse(0, 18, 24, 8, 0x000000, 0.17);
    const backLeg = scene.add.rectangle(-5, 19, 5, 12, 0x1e3a8a, 0.9);
    const frontLeg = scene.add.rectangle(5, 19, 5, 12, 0x1e3a8a, 0.9);
    const body = scene.add.rectangle(0, 4, 18, 23, color, 0.96).setStrokeStyle(2, 0x1e3a5f, 0.82);
    const collar = scene.add.rectangle(0, -5, 13, 4, 0xf8fafc, 0.82);
    const arm = scene.add.rectangle(10, 5, 4, 16, THEME.colors.playerFace, 0.9);
    const face = scene.add.rectangle(3, -14, 15, 14, THEME.colors.playerFace, 0.98).setStrokeStyle(2, 0x5c321d, 0.75);
    const hair = scene.add.rectangle(2, -21, 16, 5, 0x2d1c14, 1);
    const bag = scene.add.rectangle(-12, 6, 5, 13, 0xffd166, 0.8);

    this.add([shadow, backLeg, frontLeg, bag, body, collar, arm, face, hair]);
    this.setScale(scale);
    this.setDepth(depth);
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
