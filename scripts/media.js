import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ensureDir, projectRoot } from './notion-api.js';

/*
 * Notion раздава снимките през подписани S3 адреси, които изтичат за час.
 * Затова ги сваляме при билда, преобразуваме ги в AVIF и WebP и ги сервираме от нашия домейн.
 * Записваме и размерите, за да няма скок на оформлението (CLS).
 */

const mediaDir = path.join(projectRoot, 'public', 'media');
const manifestPath = path.join(mediaDir, 'manifest.json');
const WIDTHS = [640, 1024, 1600];

let sharp = null;
let manifest = {};

async function getSharp() {
  if (sharp === null) {
    try {
      ({ default: sharp } = await import('sharp'));
    } catch {
      sharp = false;
      console.warn('  sharp липсва — снимките се копират без преобразуване');
    }
  }
  return sharp;
}

export function loadManifest() {
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      manifest = {};
    }
  }
  return manifest;
}

export function saveManifest() {
  ensureDir(mediaDir);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

/** Ключът пренебрегва подписа в адреса — иначе всеки билд сваля всичко наново. */
function keyFor(url) {
  const stable = url.split('?')[0];
  return crypto.createHash('sha1').update(stable).digest('hex').slice(0, 16);
}

export async function processImage(url, altHint = '') {
  if (!url) return null;
  if (url.startsWith('/')) return { src: url, alt: altHint, width: null, height: null, sources: [] };

  const key = keyFor(url);
  if (manifest[key]) return { ...manifest[key], alt: altHint || manifest[key].alt };

  let buffer;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    buffer = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.warn(`  снимката не се сваля (${error.message}): ${url.slice(0, 80)}`);
    return null;
  }

  ensureDir(mediaDir);
  const lib = await getSharp();

  if (!lib) {
    const ext = (url.split('?')[0].match(/\.(jpe?g|png|webp|avif|gif|svg)$/i)?.[1] || 'jpg').toLowerCase();
    fs.writeFileSync(path.join(mediaDir, `${key}.${ext}`), buffer);
    const record = { src: `/media/${key}.${ext}`, width: null, height: null, alt: altHint, sources: [] };
    manifest[key] = record;
    return record;
  }

  const image = lib(buffer);
  const meta = await image.metadata();
  const baseWidth = meta.width || WIDTHS[WIDTHS.length - 1];
  const targets = WIDTHS.filter((w) => w <= baseWidth);
  if (targets.length === 0) targets.push(baseWidth);

  const sources = [];
  for (const format of ['avif', 'webp']) {
    const parts = [];
    for (const width of targets) {
      const file = `${key}-${width}.${format}`;
      const pipeline = lib(buffer).resize({ width, withoutEnlargement: true });
      const output = format === 'avif' ? pipeline.avif({ quality: 55 }) : pipeline.webp({ quality: 78 });
      await output.toFile(path.join(mediaDir, file));
      parts.push(`/media/${file} ${width}w`);
    }
    sources.push({ type: `image/${format}`, srcset: parts.join(', ') });
  }

  // Резервният JPEG хваща старите браузъри и имейл клиентите.
  const widest = targets[targets.length - 1];
  const fallback = `${key}-${widest}.jpg`;
  await lib(buffer).resize({ width: widest, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(mediaDir, fallback));

  const height = meta.height && meta.width ? Math.round((meta.height / meta.width) * widest) : null;
  const record = {
    src: `/media/${fallback}`,
    width: widest,
    height,
    alt: altHint,
    sources,
  };
  manifest[key] = record;
  return record;
}
