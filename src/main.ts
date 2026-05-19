import Phaser from 'phaser';
import './style.css';
import { ADSENSE_CLIENT, ADSENSE_ENABLED, loadAdsenseScript, shouldShowAds } from './config/ads';
import { GAME_HEIGHT, GAME_WIDTH } from './config/gameConfig';
import { APP_DESCRIPTION, APP_TITLE } from './config/releaseConfig';
import { SiteLayout } from './components/SiteLayout';
import { applySeo } from './components/Seo';
import { pages } from './pages/pageData';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MiniGameScene } from './scenes/MiniGameScene';
import { ResultScene } from './scenes/ResultScene';
import { SchoolMapScene } from './scenes/SchoolMapScene';
import { TitleScene } from './scenes/TitleScene';

const app = document.getElementById('app');
let phaserGame: Phaser.Game | undefined;

const phaserConfig: Phaser.Types.Core.GameConfig = {
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

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname || '/';
}

function destroyGame(): void {
  if (!phaserGame) return;
  phaserGame.destroy(true);
  phaserGame = undefined;
}

function startGame(): void {
  const mount = document.getElementById('game');
  if (!mount || phaserGame) return;

  try {
    mount.innerHTML = '';
    phaserGame = new Phaser.Game(phaserConfig);
  } catch {
    mount.innerHTML =
      '<div class="fallback">ゲームの読み込みに失敗しました。ブラウザを更新してください。</div>';
  }
}

function pushAds(): void {
  if (!ADSENSE_ENABLED || !ADSENSE_CLIENT) return;
  window.setTimeout(() => {
    document.querySelectorAll('.adsbygoogle').forEach(() => {
      try {
        const adsbygoogle = ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle ??= []);
        adsbygoogle.push({});
      } catch {
        // AdSense may reject duplicate or unapproved slots; never block the page.
      }
    });
  }, 0);
}

function renderPlayPage(): void {
  if (!app) return;

  document.body.className = 'game-page';
  applySeo({
    title: `${APP_TITLE} | プレイ`,
    description: APP_DESCRIPTION,
    path: '/play',
    noindex: true
  });
  app.innerHTML = '<main id="game" class="game-root"><div class="fallback">読み込み中...</div></main>';
  startGame();
}

function renderContentPage(path: string): void {
  if (!app) return;
  const page = pages[path];
  if (!page) {
    renderNotFound();
    return;
  }

  destroyGame();
  document.body.className = 'content-page-body';
  applySeo(page);
  app.innerHTML = SiteLayout(page, path);
  if (shouldShowAds(path)) {
    loadAdsenseScript(path);
    pushAds();
  }
}

function renderNotFound(): void {
  if (!app) return;

  destroyGame();
  document.body.className = 'content-page-body';
  applySeo({
    title: 'ページが見つかりません | RoukaDash',
    description: '指定されたページは見つかりませんでした。RoukaDashのトップページまたはプレイ画面へ戻ってください。',
    path: '/404',
    noindex: true
  });
  app.innerHTML = `
    <main class="site-shell not-found">
      <section class="article-card">
        <p class="eyebrow">404</p>
        <h1>ページが見つかりません</h1>
        <p>URLが変更されたか、ページが存在しません。ゲーム本体はプレイページから起動できます。</p>
        <div class="button-row">
          <a class="primary-link" href="/" data-link>トップへ</a>
          <a class="secondary-link" href="/play" data-link>プレイする</a>
        </div>
      </section>
    </main>
  `;
}

function renderRoute(): void {
  const path = normalizePath(window.location.pathname);
  if (path === '/play') {
    renderPlayPage();
    return;
  }
  renderContentPage(path);
}

document.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-link]');
  if (!link) return;
  const url = new URL(link.href);
  if (url.origin !== window.location.origin) return;

  event.preventDefault();
  const nextPath = normalizePath(url.pathname);
  if (nextPath !== normalizePath(window.location.pathname)) {
    window.history.pushState({}, '', `${nextPath}${url.search}${url.hash}`);
  }
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'auto' });
});

window.addEventListener('popstate', renderRoute);
renderRoute();
