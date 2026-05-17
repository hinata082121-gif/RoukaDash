import Phaser from 'phaser';
import type { Teacher } from '../entities/Teacher';

export class VisionSystem {
  static isPointInVision(playerPosition: Phaser.Math.Vector2, teachers: Teacher[]): boolean {
    return teachers.some((teacher) => {
      const vision = teacher.getVisionRect();
      return vision ? Phaser.Geom.Rectangle.Contains(vision, playerPosition.x, playerPosition.y) : false;
    });
  }

  static isPointSeenWhileDashing(playerPosition: Phaser.Math.Vector2, teachers: Teacher[], isDashing: boolean): boolean {
    if (!isDashing) {
      return false;
    }

    return this.isPointInVision(playerPosition, teachers);
  }

  static isNearVision(playerPosition: Phaser.Math.Vector2, teachers: Teacher[], distance: number): boolean {
    return teachers.some((teacher) => {
      const rect = teacher.getVisionRect();
      if (!rect) return false;
      return this.distanceToRect(playerPosition, rect) <= distance;
    });
  }

  private static distanceToRect(point: Phaser.Math.Vector2, rect: Phaser.Geom.Rectangle): number {
    const nearestX = Phaser.Math.Clamp(point.x, rect.left, rect.right);
    const nearestY = Phaser.Math.Clamp(point.y, rect.top, rect.bottom);
    return Phaser.Math.Distance.Between(point.x, point.y, nearestX, nearestY);
  }
}
