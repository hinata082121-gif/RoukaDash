import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { RESULT_THEME, type ResultThemeConfig } from '../config/resultTheme';
import { THEME } from '../config/visualTheme';
import { ScreenshotService } from '../services/ScreenshotService';
import { ShareService } from '../services/ShareService';
import type { GameResultData, ResultKind } from '../types/LevelTypes';
import { ResultShareOverlay } from '../ui/ResultShareOverlay';
import { trackEvent } from '../utils/analytics';

type ResultSceneInitData = GameResultData & { captureMode?: boolean };

export class ResultScene extends Phaser.Scene {
  private result!: GameResultData;
  private theme!: ResultThemeConfig;
  private captureMode = false;
  private isSharing = false;
  private actionContainer?: Phaser.GameObjects.Container;
  private shareOverlay?: ResultShareOverlay;
  private toastText?: Phaser.GameObjects.Text;

  constructor() {
    super('ResultScene');
  }

  init(data: ResultSceneInitData): void {
    this.result = data;
    this.theme = RESULT_THEME[data.resultKind];
    this.captureMode = Boolean(data.captureMode);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.theme.colors.bgTop);
    this.drawCardBackground();
    const title = this.drawHeader();
    this.drawMainArt();
    this.drawStatsAndBadges();
    this.drawFooterBrand();
    this.actionContainer = this.createActionButtons();
    this.shareOverlay = new ResultShareOverlay(this, this.result, this.theme);
    this.runEntryAnimation(title);
    this.setCaptureMode(this.captureMode);
    trackEvent('result_view', this.getAnalyticsParams());
  }

  setCaptureMode(enabled: boolean): void {
    this.captureMode = enabled;
    this.actionContainer?.setVisible(!enabled);
    this.shareOverlay?.setVisible(enabled);
    this.toastText?.setVisible(!enabled);
  }

  private drawCardBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(this.theme.colors.bgTop, this.theme.colors.bgTop, this.theme.colors.bgBottom, this.theme.colors.bgBottom, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    g.fillStyle(0xf8f0dd, 0.92);
    g.fillRect(20, 112, GAME_WIDTH - 40, 472);
    g.lineStyle(6, 0x15101d, 0.88);
    g.strokeRect(20, 112, GAME_WIDTH - 40, 472);
    g.lineStyle(3, this.theme.colors.accent, 0.9);
    g.strokeRect(28, 120, GAME_WIDTH - 56, 456);

    for (let y = 132; y < 584; y += 32) {
      g.lineStyle(2, 0xffffff, 0.18);
      g.lineBetween(30, y, GAME_WIDTH - 30, y);
    }

    if (this.result.resultKind === 'caught_dash') {
      this.drawImpactBackground(g);
    } else if (this.result.resultKind === 'time_up') {
      this.drawBellBackground(g);
    } else {
      this.drawConfettiBackground(g);
    }
  }

  private drawHeader(): Phaser.GameObjects.Text {
    const ribbonY = 92;
    this.add.rectangle(GAME_WIDTH / 2, ribbonY, 310, 38, this.theme.colors.ribbon, 0.96).setStrokeStyle(4, 0x15101d, 0.82);
    this.add
      .text(GAME_WIDTH / 2, ribbonY, `LEVEL ${this.result.levelId}${this.result.levelName ? `  ${this.result.levelName}` : ''}`, {
        fontFamily: THEME.font,
        fontSize: '15px',
        color: this.theme.colors.ribbonText,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 292 }
      })
      .setOrigin(0.5);

    const headline = this.add
      .text(GAME_WIDTH / 2, 42, this.theme.headline, {
        fontFamily: THEME.font,
        fontSize: '42px',
        color: this.theme.colors.text,
        fontStyle: 'bold',
        align: 'center',
        stroke: '#15101d',
        strokeThickness: 7
      })
      .setOrigin(0.5)
      .setScale(0.86);

    this.add
      .text(GAME_WIDTH / 2, 138, this.theme.subline, {
        fontFamily: THEME.font,
        fontSize: '24px',
        color: this.theme.colors.subText,
        fontStyle: 'bold',
        align: 'center',
        stroke: this.result.resultKind === 'clear' ? '#ffffff' : '#15101d',
        strokeThickness: 4
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 170, this.theme.description, {
        fontFamily: THEME.font,
        fontSize: '17px',
        color: this.result.resultKind === 'clear' ? '#2f2418' : '#ffffff',
        align: 'center',
        backgroundColor: this.result.resultKind === 'clear' ? '#fff7d6' : '#15101d',
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5);

    return headline;
  }

  private drawMainArt(): void {
    if (this.result.resultKind === 'clear') {
      this.drawClearArt();
    } else if (this.result.resultKind === 'time_up') {
      this.drawTimeUpArt();
    } else {
      this.drawCaughtDashArt();
    }
  }

  private drawStatsAndBadges(): void {
    const panelY = 632;
    this.add.rectangle(GAME_WIDTH / 2, panelY, 342, 98, this.theme.colors.panel, 0.92).setStrokeStyle(4, this.theme.colors.accent, 0.96);

    const timeLabel = this.result.resultKind === 'time_up' ? 'TIME 00.0s' : `TIME ${this.result.clearTime.toFixed(1)}s`;
    this.add
      .text(GAME_WIDTH / 2, panelY - 24, `${timeLabel}   DASH ${this.result.dashCount}回`, {
        fontFamily: THEME.font,
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 4
      })
      .setOrigin(0.5);

    const badges = (this.result.badges.length > 0 ? this.result.badges : this.theme.badges).slice(0, 3);
    badges.forEach((badge, index) => this.createBadge(64 + index * 131, panelY + 22, badge, index));
  }

  private drawFooterBrand(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 108, 'チャイムまでに帰れ！  #RoukaDash', {
        fontFamily: THEME.font,
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        stroke: '#15101d',
        strokeThickness: 4
      })
      .setOrigin(0.5);
  }

  private createActionButtons(): Phaser.GameObjects.Container {
    const items: Phaser.GameObjects.GameObject[] = [];
    const primaryLabel = this.result.cleared && this.result.levelId < 5 ? '次へ' : 'もう一度';
    const primaryAction =
      this.result.cleared && this.result.levelId < 5
        ? () => {
            trackEvent('next_level_tap', this.getAnalyticsParams());
            this.scene.start('GameScene', { levelId: this.result.levelId + 1 });
          }
        : () => {
            trackEvent('retry_tap', this.getAnalyticsParams());
            this.scene.start('GameScene', { levelId: this.result.levelId });
          };
    items.push(
      ...this.createButtonObjects(72, 748, 'リトライ', COLORS.goal, () => {
        trackEvent('retry_tap', this.getAnalyticsParams());
        this.scene.start('GameScene', { levelId: this.result.levelId });
      })
    );
    items.push(...this.createButtonObjects(196, 748, '校舎図へ', 0xffffff, () => this.scene.start('SchoolMapScene')));
    items.push(...this.createButtonObjects(318, 748, primaryLabel, 0xfde68a, primaryAction));
    items.push(...this.createButtonObjects(GAME_WIDTH / 2, 814, 'スクショを共有', this.theme.colors.accent, () => void this.handleShare(), 314));
    return this.add.container(0, 0, items).setDepth(900);
  }

  private createButtonObjects(x: number, y: number, label: string, color: number, onClick: () => void, width = 104): Phaser.GameObjects.GameObject[] {
    const shadow = this.add.rectangle(x + 3, y + 4, width, 52, 0x15101d, 0.62);
    const rect = this.add.rectangle(x, y, width, 52, color, 0.97).setStrokeStyle(4, THEME.colors.uiBorder, 0.88).setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: THEME.font,
        fontSize: '18px',
        color: color === 0xffffff || color === 0xfde68a ? '#111827' : '#ffffff',
        fontStyle: 'bold',
        stroke: color === 0xffffff || color === 0xfde68a ? undefined : '#15101d',
        strokeThickness: color === 0xffffff || color === 0xfde68a ? 0 : 3
      })
      .setOrigin(0.5);
    rect.on('pointerdown', () => {
      rect.setScale(0.97);
      text.setScale(0.97);
    });
    rect.on('pointerup', () => {
      rect.setScale(1);
      text.setScale(1);
      onClick();
    });
    rect.on('pointerout', () => {
      rect.setScale(1);
      text.setScale(1);
    });
    return [shadow, rect, text];
  }

  private drawClearArt(): void {
    const g = this.add.graphics();
    this.drawSchoolFacade(g, 60, 242, 270, 146, 0xf7e8c8);
    this.drawDesk(g, 224, 438, 92, 44);
    this.drawResultPlayer(g, 162, 434, 1.34, 'celebrate');
    this.add.rectangle(162, 490, 118, 14, 0xffe66d, 0.28);
    this.tweens.add({ targets: g, alpha: 0.95, duration: 420, yoyo: true, repeat: 1 });
  }

  private drawTimeUpArt(): void {
    const g = this.add.graphics();
    this.add
      .text(GAME_WIDTH / 2, 238, '00.0', {
        fontFamily: THEME.font,
        fontSize: '70px',
        color: '#fff7d6',
        fontStyle: 'bold',
        stroke: '#15101d',
        strokeThickness: 8
      })
      .setOrigin(0.5);
    this.drawBell(g, 304, 288);
    this.drawSchoolFacade(g, 46, 336, 286, 126, 0xe9d0ad);
    this.drawResultPlayer(g, 184, 504, 1.3, 'sad');
    this.drawWaveLines(g, 62, 302);
  }

  private drawCaughtDashArt(): void {
    this.cameras.main.shake(90, 0.01);
    this.cameras.main.flash(140, 255, 72, 46);
    const g = this.add.graphics();
    this.drawRedSpeedLines(g);
    const teacherSide = this.result.captureSeed?.teacherSide ?? 'right';
    const teacherX = teacherSide === 'left' ? 92 : 300;
    this.drawAngryTeacher(g, teacherX, 356, teacherSide === 'left' ? 1 : -1);
    this.drawResultPlayer(g, teacherSide === 'left' ? 254 : 128, 508, 1.08, 'shocked');
    this.drawSpeechBubble(this.theme.teacherLine ?? '廊下を走るな！', GAME_WIDTH / 2, 248);
  }

  private drawSchoolFacade(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, color: number): void {
    g.fillStyle(color, 1);
    g.fillRect(x, y, width, height);
    g.lineStyle(5, 0x15101d, 0.82);
    g.strokeRect(x, y, width, height);
    g.fillStyle(0x9bdaf1, 0.82);
    g.fillRect(x + 16, y + 30, width - 92, 54);
    g.lineStyle(3, 0x35505a, 0.86);
    g.strokeRect(x + 16, y + 30, width - 92, 54);
    for (let sx = x + 68; sx < x + width - 112; sx += 52) g.lineBetween(sx, y + 32, sx, y + 82);
    g.fillStyle(THEME.colors.door, 1);
    g.fillRect(x + width - 68, y + 24, 50, height - 32);
    g.lineStyle(3, THEME.colors.doorDark, 0.9);
    g.strokeRect(x + width - 68, y + 24, 50, height - 32);
    g.fillStyle(THEME.colors.chalkboard, 0.85);
    g.fillRect(x + 34, y + 50, 80, 22);
  }

  private drawDesk(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
    g.fillStyle(0x7c4a24, 1);
    g.fillRect(x, y + height - 10, width, 12);
    g.fillStyle(0xa86934, 1);
    g.fillRect(x, y, width, height);
    g.fillStyle(0xfff7d6, 0.9);
    g.fillRect(x + 14, y + 10, 28, 6);
  }

  private drawResultPlayer(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number, pose: 'celebrate' | 'sad' | 'shocked'): void {
    const lean = pose === 'celebrate' ? -6 : pose === 'shocked' ? 4 : 0;
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(x, y + 34 * scale, 58 * scale, 14 * scale);
    g.fillStyle(THEME.colors.playerPants, 1);
    g.fillRect(x - 13 * scale, y + 11 * scale, 9 * scale, 32 * scale);
    g.fillRect(x + 4 * scale, y + 11 * scale, 9 * scale, 32 * scale);
    g.fillStyle(THEME.colors.playerUniform, 1);
    g.fillRect(x - 20 * scale + lean, y - 28 * scale, 40 * scale, 48 * scale);
    g.lineStyle(3, 0xf2d16b, 0.9);
    g.lineBetween(x - 1 * scale + lean, y - 26 * scale, x - 1 * scale + lean, y + 16 * scale);
    g.fillStyle(THEME.colors.playerFace, 1);
    g.fillRect(x - 14 * scale + lean, y - 58 * scale, 28 * scale, 24 * scale);
    g.fillStyle(THEME.colors.playerHair, 1);
    g.fillRect(x - 15 * scale + lean, y - 66 * scale, 26 * scale, 8 * scale);
    g.fillTriangle(x + 4 * scale + lean, y - 68 * scale, x + 30 * scale + lean, y - 62 * scale, x + 4 * scale + lean, y - 56 * scale);
    g.fillStyle(0xffffff, 1);
    g.fillRect(x + 8 * scale + lean, y - 49 * scale, 5 * scale, 4 * scale);
    g.fillStyle(THEME.colors.playerUniform, 1);
    const armLift = pose === 'celebrate' ? -30 : pose === 'sad' ? 18 : -8;
    g.fillRect(x - 31 * scale + lean, y - 18 * scale + armLift * scale * 0.35, 10 * scale, 34 * scale);
    g.fillRect(x + 21 * scale + lean, y - 18 * scale - armLift * scale * 0.25, 10 * scale, 34 * scale);
    if (pose === 'shocked') {
      g.fillStyle(0xffd24a, 1);
      g.fillRect(x + 28 * scale, y - 78 * scale, 8 * scale, 20 * scale);
      g.fillRect(x + 42 * scale, y - 74 * scale, 8 * scale, 14 * scale);
    }
  }

  private drawAngryTeacher(g: Phaser.GameObjects.Graphics, x: number, y: number, direction: 1 | -1): void {
    const scale = 1.78;
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(x, y + 98, 112, 26);
    g.fillStyle(THEME.colors.teacherSuit, 1);
    g.fillRect(x - 34 * scale, y - 6 * scale, 68 * scale, 86 * scale);
    g.fillStyle(0xf8fafc, 1);
    g.fillRect(x - 14 * scale, y + 2 * scale, 28 * scale, 34 * scale);
    g.fillStyle(THEME.colors.teacherFace, 1);
    g.fillRect(x - 26 * scale, y - 48 * scale, 52 * scale, 42 * scale);
    g.fillStyle(0x292524, 1);
    g.fillRect(x - 28 * scale, y - 62 * scale, 56 * scale, 14 * scale);
    g.fillStyle(0x15101d, 1);
    g.fillRect(x - 19 * scale, y - 35 * scale, 16 * scale, 5 * scale);
    g.fillRect(x + 4 * scale, y - 35 * scale, 16 * scale, 5 * scale);
    g.fillStyle(0x7f1d1d, 1);
    g.fillRect(x - 9 * scale, y - 18 * scale, 18 * scale, 10 * scale);
    g.fillStyle(THEME.colors.teacherSuit, 1);
    g.fillRect(x + direction * 28 * scale, y + 2 * scale, direction * 54 * scale, 14 * scale);
    g.fillStyle(0xffd24a, 1);
    g.fillRect(x - 54, y - 104, 12, 34);
    g.fillRect(x - 65, y - 92, 34, 12);
  }

  private drawSpeechBubble(label: string, x: number, y: number): void {
    const bubble = this.add.rectangle(x, y, 274, 58, 0xfff7d6, 0.98).setStrokeStyle(5, 0x15101d, 0.9);
    const text = this.add
      .text(x, y, label, {
        fontFamily: THEME.font,
        fontSize: '24px',
        color: '#7f1d1d',
        fontStyle: 'bold',
        align: 'center'
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: [bubble, text], scale: { from: 0.82, to: 1 }, duration: 160, ease: 'Back.Out' });
  }

  private drawBell(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0xffd24a, 1);
    g.fillTriangle(x, y - 34, x - 42, y + 26, x + 42, y + 26);
    g.fillRect(x - 34, y + 20, 68, 12);
    g.fillStyle(0x15101d, 0.9);
    g.fillCircle(x, y + 36, 7);
  }

  private drawWaveLines(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.lineStyle(4, 0xfff7d6, 0.65);
    for (let i = 0; i < 4; i += 1) {
      g.strokeCircle(x, y, 18 + i * 18);
      g.strokeCircle(GAME_WIDTH - x, y, 18 + i * 18);
    }
  }

  private drawImpactBackground(g: Phaser.GameObjects.Graphics): void {
    g.lineStyle(6, 0xff4b2e, 0.5);
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      g.lineBetween(GAME_WIDTH / 2, 332, GAME_WIDTH / 2 + Math.cos(angle) * 210, 332 + Math.sin(angle) * 220);
    }
  }

  private drawRedSpeedLines(g: Phaser.GameObjects.Graphics): void {
    g.lineStyle(5, 0xffd24a, 0.62);
    for (let y = 220; y < 560; y += 34) {
      g.lineBetween(24, y, 128, y - 32);
      g.lineBetween(GAME_WIDTH - 24, y, GAME_WIDTH - 128, y - 32);
    }
  }

  private drawBellBackground(g: Phaser.GameObjects.Graphics): void {
    g.lineStyle(4, 0xfff7d6, 0.18);
    for (let x = -20; x < GAME_WIDTH + 50; x += 42) g.lineBetween(x, 112, x + 110, 584);
  }

  private drawConfettiBackground(g: Phaser.GameObjects.Graphics): void {
    const colors = [0xffe66d, 0x69e9ff, 0xffffff, 0xf59e0b];
    for (let i = 0; i < 42; i += 1) {
      g.fillStyle(colors[i % colors.length], 0.78);
      g.fillRect(28 + ((i * 37) % 330), 118 + ((i * 53) % 420), 8, 14);
    }
  }

  private createBadge(x: number, y: number, label: string, index: number): void {
    const width = 112;
    const color = index === 0 ? this.theme.colors.accent : index === 1 ? this.theme.colors.accent2 : 0xffffff;
    this.add.rectangle(x, y, width, 34, color, 0.96).setStrokeStyle(3, 0x15101d, 0.82);
    this.add
      .text(x, y, label, {
        fontFamily: THEME.font,
        fontSize: label.length > 5 ? '13px' : '15px',
        color: color === 0xffffff || this.result.resultKind === 'clear' ? '#2f2418' : '#ffffff',
        fontStyle: 'bold',
        align: 'center'
      })
      .setOrigin(0.5);
  }

  private runEntryAnimation(headline: Phaser.GameObjects.Text): void {
    this.tweens.add({ targets: headline, y: 50, scale: 1, duration: 260, ease: 'Back.Out' });
    if (this.result.resultKind === 'clear') {
      this.tweens.add({ targets: headline, angle: { from: -2, to: 0 }, duration: 260 });
    }
  }

  private async handleShare(): Promise<void> {
    if (this.isSharing) return;
    this.isSharing = true;
    trackEvent('share_tap', this.getAnalyticsParams());
    this.setCaptureMode(true);

    try {
      await this.waitForFrames(2);
      const file = await ScreenshotService.captureCanvasAsFile(this.game.canvas, this.createScreenshotFilename());
      const result = await ShareService.shareImage({
        title: this.createShareTitle(),
        text: this.result.shareText,
        file
      });

      if (result.status === 'shared') {
        trackEvent('share_success', this.getAnalyticsParams());
        this.showToast('共有を開きました');
      } else if (result.status === 'cancelled') {
        trackEvent('share_cancel', this.getAnalyticsParams());
        this.showToast('共有をキャンセルしました');
      } else if (result.status === 'fallback_downloaded') {
        trackEvent('share_fallback_save', this.getAnalyticsParams());
        this.showToast(result.copied ? '画像を保存しました。投稿文もコピー済みです。' : '画像を保存しました。投稿文は画面下からコピーしてください。');
      } else {
        this.showToast('共有に失敗しました');
      }
    } catch (error) {
      this.showToast('スクショ作成に失敗しました');
      trackEvent('share_failed', { ...this.getAnalyticsParams(), error: error instanceof Error ? error.message : 'unknown' });
    } finally {
      this.setCaptureMode(false);
      this.isSharing = false;
    }
  }

  private createScreenshotFilename(): string {
    return `roukadash-${this.result.resultKind}-lv${this.result.levelId}.png`;
  }

  private createShareTitle(): string {
    if (this.result.resultKind === 'clear') return 'RoukaDash - ギリセーフ！';
    if (this.result.resultKind === 'time_up') return 'RoukaDash - チャイム終了';
    return 'RoukaDash - 見つかった！';
  }

  private waitForFrames(count: number): Promise<void> {
    return new Promise((resolve) => {
      const wait = (remaining: number) => {
        if (remaining <= 0) {
          resolve();
          return;
        }
        requestAnimationFrame(() => wait(remaining - 1));
      };
      wait(count);
    });
  }

  private showToast(message: string): void {
    this.toastText?.destroy();
    this.toastText = this.add
      .text(GAME_WIDTH / 2, 704, message, {
        fontFamily: THEME.font,
        fontSize: message.length > 18 ? '14px' : '16px',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#15101d',
        padding: { x: 10, y: 7 },
        wordWrap: { width: 330 }
      })
      .setOrigin(0.5)
      .setDepth(1200)
      .setScrollFactor(0);
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      duration: 260,
      delay: 2000,
      onComplete: () => {
        this.toastText?.destroy();
        this.toastText = undefined;
      }
    });
  }

  private getAnalyticsParams(): Record<string, string | number> {
    return {
      result_kind: this.result.resultKind,
      level_id: this.result.levelId,
      clear_time: Number(this.result.clearTime.toFixed(1)),
      dash_count: this.result.dashCount
    };
  }
}
