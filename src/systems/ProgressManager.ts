export interface ProgressState {
  unlockedLevel: number;
  clearedLevels: number[];
  miniGameUnlocked: boolean;
}

export interface ProgressSummary extends ProgressState {
  unlockedLevels: number[];
  unlockedMapAreas: string[];
  clearRate: number;
}

const STORAGE_KEY = 'chime-made-ni-kaere-progress-v1';

const defaultProgress: ProgressState = {
  unlockedLevel: 1,
  clearedLevels: [],
  miniGameUnlocked: false
};

export class ProgressManager {
  static load(): ProgressState {
    if (typeof window === 'undefined') {
      return { ...defaultProgress };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultProgress };
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      return {
        unlockedLevel: Math.max(1, parsed.unlockedLevel ?? 1),
        clearedLevels: Array.isArray(parsed.clearedLevels) ? parsed.clearedLevels : [],
        miniGameUnlocked: Boolean(parsed.miniGameUnlocked)
      };
    } catch {
      return { ...defaultProgress };
    }
  }

  static save(progress: ProgressState): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  static isLevelUnlocked(levelId: number): boolean {
    return this.load().unlockedLevel >= levelId;
  }

  static isLevelCleared(levelId: number): boolean {
    return this.load().clearedLevels.includes(levelId);
  }

  static clearLevel(levelId: number): ProgressState {
    const progress = this.load();
    if (!progress.clearedLevels.includes(levelId)) {
      progress.clearedLevels.push(levelId);
      progress.clearedLevels.sort((a, b) => a - b);
    }

    progress.unlockedLevel = Math.max(progress.unlockedLevel, Math.min(levelId + 1, 5));
    if (levelId >= 5) {
      progress.miniGameUnlocked = true;
    }

    this.save(progress);
    return progress;
  }

  static isMiniGameUnlocked(): boolean {
    return this.load().miniGameUnlocked;
  }

  static getSummary(): ProgressSummary {
    const progress = this.load();
    const unlockedLevels = Array.from({ length: progress.unlockedLevel }, (_value, index) => index + 1).filter((levelId) => levelId <= 5);
    return {
      ...progress,
      unlockedLevels,
      unlockedMapAreas: this.getUnlockedMapAreas(progress.clearedLevels),
      clearRate: progress.clearedLevels.length / 5
    };
  }

  private static getUnlockedMapAreas(clearedLevels: number[]): string[] {
    const areas: string[] = [];
    if (clearedLevels.includes(1)) areas.push('1F玄関周辺');
    if (clearedLevels.includes(2)) areas.push('2F理科室・教室周辺');
    if (clearedLevels.includes(3)) areas.push('1F保健室・教室周辺');
    if (clearedLevels.includes(4)) areas.push('3F図書室・階段周辺');
    if (clearedLevels.includes(5)) areas.push('校舎図全体');
    return areas;
  }
}
