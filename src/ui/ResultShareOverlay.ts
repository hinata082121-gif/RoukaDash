import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import type { ResultThemeConfig } from '../config/resultTheme';
import { THEME } from '../config/visualTheme';
import type { GameResultData } from '../types/LevelTypes';

export class ResultShareOverlay {
  private readonly container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, result: GameResultData, theme: ResultThemeConfig) {
    const brand = scene.add
      .text(24, GAME_HEIGHT - 74, 'RoukaDash', {
        fontFamily: THEME.font,
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 4
      })
      .setOrigin(0, 0.5);

    const hash = scene.add
      .text(GAME_WIDTH - 24, GAME_HEIGHT - 74, theme.hashtags.join(' '), {
        fontFamily: THEME.font,
        fontSize: '15px',
        color: theme.colors.subText,
        align: 'right',
        stroke: '#15101d',
        strokeThickness: 3,
        wordWrap: { width: 230 }
      })
      .setOrigin(1, 0.5);

    const level = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 34, `LEVEL ${result.levelId}  /  DASH ${result.dashCount}回`, {
        fontFamily: THEME.font,
        fontSize: '15px',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#15101d',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5);

    this.container = scene.add.container(0, 0, [brand, hash, level]).setDepth(950).setVisible(false);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy(true);
  }
}
