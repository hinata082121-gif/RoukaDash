export const ADSENSE_ENABLED = import.meta.env.VITE_ADSENSE_ENABLED === 'true';
export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;
const AD_SLOTS: Record<string, string | undefined> = {
  'content-top': import.meta.env.VITE_ADSENSE_SLOT_CONTENT_TOP,
  'content-mid': import.meta.env.VITE_ADSENSE_SLOT_CONTENT_MID
};

export const AD_ALLOWED_ROUTES = new Set(['/','/how-to-play','/levels','/characters','/school-rules','/strategy','/devlog','/about']);
export const AD_BLOCKED_ROUTES = new Set(['/play','/results','/settings','/error','/404','/privacy','/terms','/contact']);

let adsenseLoaded = false;

export function shouldShowAds(path: string): boolean {
  return AD_ALLOWED_ROUTES.has(path);
}

export function getAdSlot(placement: string): string | undefined {
  return AD_SLOTS[placement];
}

export function loadAdsenseScript(path: string): void {
  if (!ADSENSE_ENABLED || !ADSENSE_CLIENT || !shouldShowAds(path) || adsenseLoaded) return;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
  document.head.appendChild(script);
  adsenseLoaded = true;
}
