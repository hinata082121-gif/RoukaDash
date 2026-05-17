import Phaser from 'phaser';
import { GAME_WIDTH, SAFE_MARGIN } from '../config/gameConfig';
import { THEME } from '../config/visualTheme';

export class Hud {
  private timeText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private floorText: Phaser.GameObjects.Text;
  private timePanel: Phaser.GameObjects.Rectangle;
  private levelPanel: Phaser.GameObjects.Rectangle;
  private floorPanel: Phaser.GameObjects.Rectangle;
  private pauseButton: Phaser.GameObjects.Rectangle;
  private pauseIcon: Phaser.GameObjects.Text;
  private goalArrow: Phaser.GameObjects.Triangle;
  private goalArrowBg: Phaser.GameObjects.Arc;
  private warningTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, levelName: string, floorLabel: string, onPause: () => void) {
    scene.add
      .rectangle(0, 0, GAME_WIDTH, SAFE_MARGIN.top + 78, THEME.colors.uiShadow, 0.78)
      .setOrigin(0, 0)
      .setDepth(899)
      .setScrollFactor(0);

    this.timePanel = scene.add
      .rectangle(SAFE_MARGIN.left + 68, SAFE_MARGIN.top + 18, 136, 42, THEME.colors.uiPanel, 0.98)
      .setStrokeStyle(3, THEME.colors.uiBorder, 0.95)
      .setDepth(900)
      .setScrollFactor(0);

    this.floorPanel = scene.add
      .rectangle(SAFE_MARGIN.left + 158, SAFE_MARGIN.top + 18, 54, 42, THEME.colors.uiBg, 0.98)
      .setStrokeStyle(3, THEME.colors.goalFrame, 0.9)
      .setDepth(900)
      .setScrollFactor(0);

    this.levelPanel = scene.add
      .rectangle(SAFE_MARGIN.left + 132, SAFE_MARGIN.top + 58, 264, 30, THEME.colors.uiBg, 0.96)
      .setStrokeStyle(2, THEME.colors.uiBorder, 0.7)
      .setDepth(900)
      .setScrollFactor(0);

    this.timeText = scene.add
      .text(SAFE_MARGIN.left + 8, SAFE_MARGIN.top - 1, '00.0', {
        fontFamily: THEME.font,
        fontSize: '30px',
        color: THEME.colors.uiText,
        fontStyle: 'bold'
      })
      .setDepth(901)
      .setScrollFactor(0);

    this.floorText = scene.add
      .text(this.floorPanel.x, this.floorPanel.y, floorLabel, {
        fontFamily: THEME.font,
        fontSize: '20px',
        color: '#ffe66d',
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(901)
      .setScrollFactor(0);

    this.levelText = scene.add
      .text(SAFE_MARGIN.left + 8, SAFE_MARGIN.top + 46, levelName, {
        fontFamily: THEME.font,
        fontSize: '16px',
        color: '#fff5d6',
        stroke: '#15101d',
        strokeThickness: 3,
        wordWrap: { width: 256 }
      })
      .setDepth(901)
      .setScrollFactor(0);

    this.goalArrowBg = scene.add
      .circle(GAME_WIDTH - SAFE_MARGIN.right - 88, SAFE_MARGIN.top + 22, 20, THEME.colors.uiPanel, 0.94)
      .setStrokeStyle(3, THEME.colors.uiBorder, 0.85)
      .setDepth(900)
      .setScrollFactor(0);

    this.goalArrow = scene.add
      .triangle(this.goalArrowBg.x, this.goalArrowBg.y, 0, -9, 10, 10, -10, 10, THEME.colors.goalFrame, 1)
      .setDepth(901)
      .setScrollFactor(0);

    this.pauseButton = scene.add
      .rectangle(GAME_WIDTH - SAFE_MARGIN.right - 24, SAFE_MARGIN.top + 22, 48, 48, 0x111827, 0.6)
      .setStrokeStyle(3, THEME.colors.uiBorder, 0.9)
      .setDepth(900)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.pauseIcon = scene.add
      .text(this.pauseButton.x, this.pauseButton.y - 1, 'II', {
        fontFamily: THEME.font,
        fontSize: '20px',
        color: THEME.colors.uiText,
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(901)
      .setScrollFactor(0);

    this.pauseButton.on('pointerup', onPause);
  }

  setTime(seconds: number): void {
    const safeSeconds = Math.max(0, seconds);
    this.timeText.setText(`${safeSeconds.toFixed(1)}秒`);

    if (safeSeconds <= 10) {
      this.timeText.setColor('#fca5a5');
      this.timePanel.setStrokeStyle(3, 0xff5a3d, 0.95);
      if (!this.warningTween) {
        this.warningTween = this.timeText.scene.tweens.add({
          targets: this.timeText,
          scale: 1.08,
          duration: 220,
          yoyo: true,
          repeat: -1
        });
      }
    } else {
      this.timeText.setColor('#ffffff');
      this.timePanel.setStrokeStyle(3, THEME.colors.uiBorder, 0.95);
      this.warningTween?.stop();
      this.warningTween = undefined;
      this.timeText.setScale(1);
    }
  }

  setPaused(paused: boolean): void {
    this.pauseIcon.setText(paused ? '▶' : 'II');
  }

  setFloor(floorLabel: string): void {
    this.floorText.setText(floorLabel);
  }

  setGoalDirection(player: Phaser.Math.Vector2, goalCenter: Phaser.Math.Vector2): void {
    const angle = Phaser.Math.Angle.Between(player.x, player.y, goalCenter.x, goalCenter.y);
    this.goalArrow.setRotation(angle + Math.PI / 2);
  }
}
