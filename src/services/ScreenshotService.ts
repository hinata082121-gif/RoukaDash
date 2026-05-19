export class ScreenshotService {
  static async captureCanvasAsFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (!value) {
          reject(new Error('Canvas capture failed.'));
          return;
        }
        resolve(value);
      }, 'image/png');
    });

    return new File([blob], filename, { type: 'image/png', lastModified: Date.now() });
  }

  static downloadFile(file: File): void {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
