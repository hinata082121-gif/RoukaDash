import { AdBanner } from './AdBanner';
import type { PageDefinition } from '../pages/pageData';

const navItems = [
  ['/', 'トップ'],
  ['/play', 'プレイ'],
  ['/how-to-play', '遊び方'],
  ['/levels', 'レベル'],
  ['/strategy', '攻略'],
  ['/devlog', '開発ログ']
];

export function SiteLayout(page: PageDefinition, currentPath: string): string {
  const topAd = page.allowAds ? AdBanner(currentPath, 'content-top') : '';
  const midAd = page.allowAds ? AdBanner(currentPath, 'content-mid') : '';
  return `
    <header class="site-header">
      <div class="site-header-inner">
        <a class="brand" href="/" data-link>RoukaDash</a>
        <nav class="site-nav" aria-label="主要ナビゲーション">
          ${navItems.map(([href, label]) => `<a href="${href}" data-link class="${href === currentPath ? 'active' : ''}">${label}</a>`).join('')}
        </nav>
      </div>
    </header>
    <div class="site-shell">
      <main class="content-page">
        <section class="hero-band">
          <p class="eyebrow">平成学校あるある廊下ダッシュゲーム</p>
          <h1>${page.h1}</h1>
          <p class="lead">${page.lead}</p>
          ${page.path === '/' ? '<div class="button-row"><a class="primary-link" href="/play" data-link>プレイ開始</a><a class="secondary-link" href="/how-to-play" data-link>遊び方を見る</a></div>' : ''}
        </section>
        ${topAd}
        <article class="article-card">
          ${page.sections
            .map(
              (section, index) => `
                <section class="article-section">
                  <h2>${section.heading}</h2>
                  ${section.body.map((paragraph) => `<p>${paragraph}</p>`).join('')}
                  ${index === 1 ? midAd : ''}
                </section>
              `
            )
            .join('')}
        </article>
      </main>
      <footer class="site-footer">
        <a href="/about" data-link>About</a>
        <a href="/contact" data-link>Contact</a>
        <a href="/privacy" data-link>Privacy</a>
        <a href="/terms" data-link>Terms</a>
      </footer>
    </div>
  `;
}
