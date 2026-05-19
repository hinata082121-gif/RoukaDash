import { ScreenshotService } from './ScreenshotService';

export interface SharePayload {
  title: string;
  text: string;
  file: File;
}

export type ShareResult =
  | { status: 'shared' }
  | { status: 'fallback_downloaded'; copied: boolean }
  | { status: 'cancelled' }
  | { status: 'failed'; error: unknown };

type NavigatorWithShare = Navigator & {
  canShare?: (data?: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
};

export class ShareService {
  static async shareImage(payload: SharePayload): Promise<ShareResult> {
    const nav = navigator as NavigatorWithShare;
    const shareData: ShareData = {
      title: payload.title,
      text: payload.text,
      files: [payload.file]
    };

    try {
      if (typeof nav.share === 'function' && (typeof nav.canShare !== 'function' || nav.canShare(shareData))) {
        await nav.share(shareData);
        return { status: 'shared' };
      }
    } catch (error) {
      if (ShareService.isShareCancelled(error)) {
        return { status: 'cancelled' };
      }
      return ShareService.runFallback(payload);
    }

    return ShareService.runFallback(payload);
  }

  static async copyText(text: string): Promise<void> {
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard API is unavailable.');
    }
    await navigator.clipboard.writeText(text);
  }

  private static async runFallback(payload: SharePayload): Promise<ShareResult> {
    try {
      ScreenshotService.downloadFile(payload.file);
      let copied = false;
      try {
        await ShareService.copyText(payload.text);
        copied = true;
      } catch {
        copied = false;
      }
      return { status: 'fallback_downloaded', copied };
    } catch (error) {
      return { status: 'failed', error };
    }
  }

  private static isShareCancelled(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }
}
