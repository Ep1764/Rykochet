import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cached: Promise<string> | null = null;

export function getFingerprint(): Promise<string> {
  if (!cached) {
    cached = (async (): Promise<string> => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
      } catch {
        return '';
      }
    })();
  }
  return cached;
}
