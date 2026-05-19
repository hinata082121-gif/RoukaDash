import { ADSENSE_CLIENT, ADSENSE_ENABLED, getAdSlot, shouldShowAds } from '../config/ads';

export function AdBanner(path: string, placement: string): string {
  if (!shouldShowAds(path)) return '';
  const adSlot = getAdSlot(placement);

  if (!ADSENSE_ENABLED || !ADSENSE_CLIENT || !adSlot) {
    return `
      <aside class="ad-slot ad-placeholder" aria-label="広告枠">
        <span class="ad-label">スポンサーリンク</span>
        <div class="ad-placeholder-box">広告枠予定地（ゲーム画面・操作ボタン付近には表示しません）</div>
      </aside>
    `;
  }

  return `
    <aside class="ad-slot" aria-label="スポンサーリンク">
      <span class="ad-label">スポンサーリンク</span>
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="${escapeHtml(ADSENSE_CLIENT)}"
        data-ad-slot="${escapeHtml(adSlot)}"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
    </aside>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}
