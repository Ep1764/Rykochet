import type { AvatarLayer, AvatarRecipe } from '@rykochet/shared';

import { findSticker } from './manifest.js';

const CANVAS_SIZE = 512;
const BODY_RADIUS = 180;

// Cache raw SVG text so we don't refetch. Keyed by sticker file.
const svgTextCache = new Map<string, Promise<string>>();
// Cache <img> elements keyed by (stickerId, tintColor).
const imageCache = new Map<string, Promise<HTMLImageElement>>();
// Cache full composed data URLs keyed by hashed recipe.
const compositeCache = new Map<string, string>();

export async function composeAvatarCanvas(recipe: AvatarRecipe): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d unavailable');

  // Base body: solid circle in the recipe's base color.
  ctx.fillStyle = recipe.baseColor;
  ctx.beginPath();
  ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, BODY_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Subtle inner-shadow ring for depth.
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, BODY_RADIUS - 3, 0, Math.PI * 2);
  ctx.stroke();

  // Layers in ORDER. Index 0 draws first (bottom), last index draws last (top).
  for (const layer of recipe.layers) {
    // eslint-disable-next-line no-await-in-loop
    const img = await loadStickerImage(layer);
    if (!img) continue;
    ctx.save();
    ctx.globalAlpha = clamp(layer.opacity, 0, 1);
    ctx.translate(CANVAS_SIZE / 2 + layer.x, CANVAS_SIZE / 2 + layer.y);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scale, layer.scale);
    ctx.drawImage(img, -CANVAS_SIZE / 2, -CANVAS_SIZE / 2, CANVAS_SIZE, CANVAS_SIZE);
    ctx.restore();
  }

  return canvas;
}

export async function composeAvatarDataUrl(recipe: AvatarRecipe): Promise<string> {
  const key = hashRecipe(recipe);
  const cached = compositeCache.get(key);
  if (cached) return cached;
  const canvas = await composeAvatarCanvas(recipe);
  const url = canvas.toDataURL('image/png');
  compositeCache.set(key, url);
  // Cap cache to prevent unbounded growth.
  if (compositeCache.size > 64) {
    const first = compositeCache.keys().next().value as string | undefined;
    if (first !== undefined) compositeCache.delete(first);
  }
  return url;
}

async function loadStickerImage(layer: AvatarLayer): Promise<HTMLImageElement | null> {
  const cacheKey = `${layer.stickerId}|${layer.color ?? 'default'}`;
  const existing = imageCache.get(cacheKey);
  if (existing) return existing;

  const promise = (async (): Promise<HTMLImageElement> => {
    const meta = await findSticker(layer.stickerId);
    if (!meta) throw new Error(`unknown sticker: ${layer.stickerId}`);
    const svgText = await fetchSvg(meta.file);
    const withColor = layer.color && meta.tintable ? injectColor(svgText, layer.color) : svgText;
    const blob = new Blob([withColor], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    try {
      return await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  })();

  imageCache.set(cacheKey, promise);
  try {
    return await promise;
  } catch {
    imageCache.delete(cacheKey);
    return null;
  }
}

function fetchSvg(file: string): Promise<string> {
  const cached = svgTextCache.get(file);
  if (cached) return cached;
  const p = fetch(`/avatar/stickers/${file}`, { cache: 'force-cache' }).then((r) => r.text());
  svgTextCache.set(file, p);
  return p;
}

function injectColor(svg: string, hex: string): string {
  // Set `color` on the root <svg> so `fill="currentColor"` inherits it.
  // Robust to SVGs with or without an existing style attribute.
  return svg.replace(/<svg\b([^>]*)>/, (_full: string, attrs: string) => {
    const styleMatch = /style="([^"]*)"/.exec(attrs);
    if (styleMatch) {
      const cleaned = (styleMatch[1] ?? '').replace(/color\s*:[^;]*;?/g, '').trim();
      const combined = cleaned
        ? `${cleaned}${cleaned.endsWith(';') ? '' : ';'}color:${hex}`
        : `color:${hex}`;
      const newAttrs = attrs.replace(/style="[^"]*"/, `style="${combined}"`);
      return `<svg${newAttrs}>`;
    }
    return `<svg${attrs} style="color:${hex}">`;
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => resolve(img);
    img.onerror = (): void => reject(new Error('image load failed'));
    img.src = src;
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hashRecipe(recipe: AvatarRecipe): string {
  // Cheap-and-fast key. Not cryptographic — just stable across identical recipes.
  return JSON.stringify(recipe);
}

export function invalidateComposite(recipe: AvatarRecipe): void {
  compositeCache.delete(hashRecipe(recipe));
}
