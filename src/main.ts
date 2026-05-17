import Phaser from 'phaser';
import './style.css';
import { GAME_HEIGHT, GAME_WIDTH } from './config/gameConfig';
import { APP_DESCRIPTION, APP_TITLE } from './config/releaseConfig';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MiniGameScene } from './scenes/MiniGameScene';
import { ResultScene } from './scenes/ResultScene';
import { SchoolMapScene } from './scenes/SchoolMapScene';
import { TitleScene } from './scenes/TitleScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#111827',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  input: {
    activePointers: 3
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  },
  scene: [BootScene, TitleScene, SchoolMapScene, GameScene, ResultScene, MiniGameScene]
};

const mount = document.getElementById('game');
const descriptionMeta = document.querySelector('meta[name="description"]');

document.title = APP_TITLE;
descriptionMeta?.setAttribute('content', APP_DESCRIPTION);

try {
  if (mount) {
    mount.innerHTML = '';
  }
  new Phaser.Game(config);
} catch {
  if (mount) {
    mount.innerHTML = '<div class="fallback">ゲームの読み込みに失敗しました。ブラウザを更新してください。</div>';
  }
}
