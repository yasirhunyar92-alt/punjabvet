/**
 * Serves storage images through the CDN image-transform endpoint so the browser
 * downloads a small, resized, cached (max-age=3600) version instead of the
 * multi-megabyte original. Non-storage URLs are returned untouched.
 */
const OBJECT_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';

export type ImgFit = 'cover' | 'contain';

export function optimizedImage(
  url?: string | null,
  width = 400,
  opts: { quality?: number; fit?: ImgFit } = {},
): string {
  if (!url) return '';
  if (!url.includes(OBJECT_PATH)) return url;
  const { quality = 70, fit = 'contain' } = opts;
  const base = url.split('?')[0].replace(OBJECT_PATH, RENDER_PATH);
  return `${base}?width=${Math.round(width)}&resize=${fit}&quality=${quality}`;
}

/** srcSet for responsive product/banner images. */
export function optimizedSrcSet(url?: string | null, widths: number[] = [200, 400, 800]): string | undefined {
  if (!url || !url.includes(OBJECT_PATH)) return undefined;
  return widths.map((w) => `${optimizedImage(url, w)} ${w}w`).join(', ');
}
