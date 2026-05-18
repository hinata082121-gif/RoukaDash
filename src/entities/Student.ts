import Phaser from 'phaser';
import { THEME } from '../config/visualTheme';

export class Student extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, color = 0x4f9ad8, scale = 1, depth = 30) {
    super(scene, x, y);

    const shadow = scene.add.ellipse(0, 16, 22, 8, 0x000000, 0.17);
    const body = scene.add.rectangle(0, 4, 17, 21, color, 0.96).setStrokeStyle(2, 0x1e3a5f, 0.82);
    const collar = scene.add.rectangle(0, -5, 13, 4, 0xf8fafc, 0.82);
    const face = scene.add.rectangle(0, -13, 14, 13, THEME.colors.playerFace, 0.98).setStrokeStyle(2, 0x5c321d, 0.75);
    const hair = scene.add.rectangle(0, -19, 14, 5, 0x2d1c14, 1);
    const bag = scene.add.rectangle(-11, 6, 5, 12, 0xffd166, 0.86);

    this.add([shadow, body, collar, face, hair, bag]);
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
