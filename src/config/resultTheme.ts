import type { ResultKind } from '../types/LevelTypes';

export interface ResultThemeConfig {
  headline: string;
  subline: string;
  description: string;
  teacherLine?: string;
  hashtags: string[];
  badges: string[];
  colors: {
    bgTop: number;
    bgBottom: number;
    panel: number;
    accent: number;
    accent2: number;
    text: string;
    subText: string;
    ribbon: number;
    ribbonText: string;
  };
}

export const RESULT_THEME: Record<ResultKind, ResultThemeConfig> = {
  clear: {
    headline: 'ギリセーフ！',
    subline: '着席成功',
    description: '先生の視線、回避完了。',
    hashtags: ['#RoukaDash', '#着席成功'],
    badges: ['着席成功', '先生回避', 'チャイム前帰還'],
    colors: {
      bgTop: 0x0e7490,
      bgBottom: 0xffd76d,
      panel: 0xfff7d6,
      accent: 0xffe66d,
      accent2: 0x69e9ff,
      text: '#ffffff',
      subText: '#2f2418',
      ribbon: 0xffe66d,
      ribbonText: '#2f2418'
    }
  },
  time_up: {
    headline: 'チャイム終了',
    subline: 'あと少しだった…',
    description: '教室まで、あと一歩。',
    hashtags: ['#RoukaDash', '#あと一歩'],
    badges: ['時間切れ', 'あと一歩', 'チャイム敗北'],
    colors: {
      bgTop: 0x172554,
      bgBottom: 0xf97316,
      panel: 0x2b2435,
      accent: 0xffa24a,
      accent2: 0xfff7d6,
      text: '#ffffff',
      subText: '#fff5d6',
      ribbon: 0xf97316,
      ribbonText: '#fff7ed'
    }
  },
  caught_dash: {
    headline: '見つかった！',
    subline: '走った瞬間、終わった。',
    description: '先生の視界でダッシュしてしまった。',
    teacherLine: '廊下を走るな！',
    hashtags: ['#RoukaDash', '#先生にバレた'],
    badges: ['先生激怒', '廊下ダッシュ', '即バレ'],
    colors: {
      bgTop: 0x1b1115,
      bgBottom: 0x7f1d1d,
      panel: 0x2b1018,
      accent: 0xff4b2e,
      accent2: 0xffd24a,
      text: '#ffffff',
      subText: '#ffe4e6',
      ribbon: 0xff4b2e,
      ribbonText: '#ffffff'
    }
  }
};
