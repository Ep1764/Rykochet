export interface StickerMeta {
  id: string;
  name: string;
  file: string;
  tintable: boolean;
}

export interface StickerManifest {
  version: number;
  canvas: { width: number; height: number };
  stickers: StickerMeta[];
}

let cached: Promise<StickerManifest> | null = null;

export function loadManifest(): Promise<StickerManifest> {
  if (!cached) {
    cached = fetch('/avatar/manifest.json', { cache: 'force-cache' })
      .then((r) => r.json() as Promise<StickerManifest>);
  }
  return cached;
}

export async function findSticker(stickerId: string): Promise<StickerMeta | null> {
  const m = await loadManifest();
  return m.stickers.find((s) => s.id === stickerId) ?? null;
}
