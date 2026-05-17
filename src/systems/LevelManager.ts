import { levels } from '../config/levels';
import type { LevelConfig } from '../types/LevelTypes';
import { ProgressManager } from './ProgressManager';

export class LevelManager {
  static getLevel(levelId: number): LevelConfig {
    const level = levels.find((candidate) => candidate.id === levelId);
    if (!level) {
      throw new Error(`Unknown level id: ${levelId}`);
    }
    return level;
  }

  static getAllLevels(): LevelConfig[] {
    return levels;
  }

  static getUnlockedMapAreas(): string[] {
    const cleared = ProgressManager.load().clearedLevels;
    return levels.filter((level) => cleared.includes(level.id)).map((level) => level.unlockedMapArea);
  }
}
