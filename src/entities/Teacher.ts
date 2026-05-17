import Phaser from 'phaser';
import { THEME } from '../config/visualTheme';
import type { PatrolTeacherConfig, PeekState, PeekTeacherConfig, TeacherConfig } from '../types/TeacherTypes';

export class Teacher extends Phaser.GameObjects.Container {
  private visionGraphics: Phaser.GameObjects.Graphics;
  private marker: Phaser.GameObjects.Rectangle;
  private warningIcon?: Phaser.GameObjects.Text;
  private warningVisionRect?: Phaser.Geom.Rectangle;
  private peekState: PeekState = 'hidden';
  private stateElapsed = 0;
  private waypointIndex = 1;
  private facing = new Phaser.Math.Vector2(1, 0);
  private activeVisionRect?: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, private config: TeacherConfig) {
    super(scene, config.position.x, config.position.y);

    this.visionGraphics = scene.add.graphics().setDepth(12);
    this.marker = scene.add.rectangle(0, 3, 22, 24, THEME.colors.teacherSuit, 1).setStrokeStyle(3, 0xffffff, 0.72);
    const face = scene.add.rectangle(0, -12, 16, 13, THEME.colors.teacherFace, 1).setStrokeStyle(2, 0x5c321d, 0.7);
    const hair = scene.add.rectangle(0, -18, 16, 5, 0x292524, 1);
    const label = scene.add
      .text(0, 4, '先', {
        fontFamily: THEME.font,
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add([this.marker, face, hair, label]);
    this.setDepth(35);
    scene.add.existing(this);

    if (config.type === 'peek') {
      this.marker.setVisible(false);
      this.warningIcon = scene.add
        .text(config.position.x, config.position.y - 26, '!', {
          fontFamily: 'Courier New, monospace',
          fontSize: '24px',
          color: '#f59e0b',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setDepth(45)
        .setVisible(false);
    }
  }

  updateTeacher(deltaMs: number): void {
    this.visionGraphics.clear();

    if (this.config.type === 'peek') {
      this.updatePeek(this.config, deltaMs);
    } else {
      this.updatePatrol(this.config, deltaMs);
    }
  }

  getVisionRect(): Phaser.Geom.Rectangle | undefined {
    return this.activeVisionRect;
  }

  getWarningRect(): Phaser.Geom.Rectangle | undefined {
    return this.warningVisionRect;
  }

  getDebugState(): string {
    return this.config.type === 'peek' ? this.peekState : 'patrol';
  }

  private updatePeek(config: PeekTeacherConfig, deltaMs: number): void {
    this.stateElapsed += deltaMs;

    const duration = this.getPeekStateDuration(config);
    if (this.stateElapsed >= duration) {
      this.stateElapsed = 0;
      this.peekState = this.peekState === 'hidden' ? 'warning' : this.peekState === 'warning' ? 'watching' : 'hidden';
    }

    const doorColor = this.peekState === 'hidden' ? 0x6b7280 : this.peekState === 'warning' ? THEME.colors.warningVision : THEME.colors.teacherSuit;
    this.marker.setVisible(this.peekState === 'watching');
    this.marker.setFillStyle(doorColor, 1);
    this.warningIcon?.setVisible(this.peekState === 'warning');
    if (this.warningIcon) {
      this.warningIcon.setAlpha(0.55 + Math.sin(this.scene.time.now * 0.02) * 0.35);
    }

    this.warningVisionRect = undefined;

    if (this.peekState === 'warning') {
      this.warningVisionRect = new Phaser.Geom.Rectangle(config.vision.x, config.vision.y, config.vision.width, config.vision.height);
      this.drawVision(this.warningVisionRect, THEME.colors.warningVision, 0.34);
    }

    if (this.peekState === 'watching') {
      this.activeVisionRect = new Phaser.Geom.Rectangle(config.vision.x, config.vision.y, config.vision.width, config.vision.height);
      this.drawVision(this.activeVisionRect, THEME.colors.dangerVision, 0.38);
    } else {
      this.activeVisionRect = undefined;
    }
  }

  private updatePatrol(config: PatrolTeacherConfig, deltaMs: number): void {
    const target = config.waypoints[this.waypointIndex];
    const toTarget = new Phaser.Math.Vector2(target.x - this.x, target.y - this.y);
    const distance = toTarget.length();

    if (distance < 4) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex = (this.waypointIndex + 1) % config.waypoints.length;
    } else {
      const direction = toTarget.normalize();
      this.facing.copy(direction);
      const step = Math.min(distance, config.speed * (deltaMs / 1000));
      this.x += direction.x * step;
      this.y += direction.y * step;
      this.rotation = direction.angle() + Math.PI / 2;
    }

    this.activeVisionRect = this.createPatrolVision(config);
    this.warningVisionRect = undefined;
    this.drawVision(this.activeVisionRect, THEME.colors.dangerVision, 0.34);
  }

  private getPeekStateDuration(config: PeekTeacherConfig): number {
    if (this.peekState === 'hidden') return config.hiddenMs;
    if (this.peekState === 'warning') return config.warningMs;
    return config.watchingMs;
  }

  private createPatrolVision(config: PatrolTeacherConfig): Phaser.Geom.Rectangle {
    const horizontal = Math.abs(this.facing.x) >= Math.abs(this.facing.y);
    if (horizontal) {
      const width = config.visionSize.width;
      const height = config.visionSize.height;
      const x = this.facing.x >= 0 ? this.x + 12 : this.x - width - 12;
      return new Phaser.Geom.Rectangle(x, this.y - height / 2, width, height);
    }

    const width = config.visionSize.height;
    const height = config.visionSize.width;
    const y = this.facing.y >= 0 ? this.y + 12 : this.y - height - 12;
    return new Phaser.Geom.Rectangle(this.x - width / 2, y, width, height);
  }

  private drawVision(rect: Phaser.Geom.Rectangle, color: number, alpha: number): void {
    this.visionGraphics.fillStyle(color, alpha);
    this.visionGraphics.fillRectShape(rect);
    this.visionGraphics.lineStyle(2, 0xffedd5, 0.62);
    this.visionGraphics.strokeRectShape(rect);
  }
}
