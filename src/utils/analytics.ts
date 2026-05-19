type AnalyticsParams = Record<string, string | number | boolean | undefined>;

type WindowWithGtag = Window & {
  gtag?: (command: 'event', eventName: string, params?: AnalyticsParams) => void;
};

export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  const win = window as WindowWithGtag;
  try {
    win.gtag?.('event', eventName, params);
  } catch {
    // Analytics must never affect gameplay.
  }
}
