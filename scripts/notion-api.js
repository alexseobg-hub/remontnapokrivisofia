import fs from 'node:fs';
import path from 'node:path';

const NOTION_VERSION = '2022-06-28';

export function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

export function makeClient(apiKey) {
  async function request(url, options = {}, attempt = 0) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
    });

    // Notion ограничава до ~3 заявки в секунда. При 429 или 5xx чакаме и пробваме пак.
    if ((response.status === 429 || response.status >= 500) && attempt < 5) {
      const retryAfter = Number(response.headers.get('retry-after')) || 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return request(url, options, attempt + 1);
    }

    if (!response.ok) {
      throw new Error(`Notion API ${response.status} за ${url}\n${await response.text()}`);
    }
    return response.json();
  }

  async function queryDatabase(databaseId, body = {}) {
    const rows = [];
    let cursor;
    do {
      const data = await request(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        body: JSON.stringify({ page_size: 100, ...body, start_cursor: cursor }),
      });
      rows.push(...data.results);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);
    return rows;
  }

  async function blockChildren(blockId) {
    const blocks = [];
    let cursor;
    do {
      const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
      url.searchParams.set('page_size', '100');
      if (cursor) url.searchParams.set('start_cursor', cursor);
      const data = await request(url.toString());
      blocks.push(...data.results);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);
    return blocks;
  }

  return { request, queryDatabase, blockChildren };
}

/* --- Четене на properties --- */

export function prop(properties, name) {
  if (!properties) return null;
  const key = Object.keys(properties).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? properties[key] : null;
}

export function plain(property, fallback = '') {
  if (!property) return fallback;
  switch (property.type) {
    case 'title':
      return property.title.map((t) => t.plain_text).join('').trim() || fallback;
    case 'rich_text':
      return property.rich_text.map((t) => t.plain_text).join('').trim() || fallback;
    case 'select':
      return property.select?.name || fallback;
    case 'status':
      return property.status?.name || fallback;
    case 'multi_select':
      return property.multi_select.map((t) => t.name).join(', ') || fallback;
    case 'date':
      return property.date?.start || fallback;
    case 'url':
      return property.url || fallback;
    case 'email':
      return property.email || fallback;
    case 'phone_number':
      return property.phone_number || fallback;
    case 'number':
      return property.number === null || property.number === undefined ? fallback : String(property.number);
    case 'checkbox':
      return property.checkbox ? 'true' : 'false';
    default:
      return fallback;
  }
}

export const text = (properties, name, fallback = '') => plain(prop(properties, name), fallback);
export const bool = (properties, name) => prop(properties, name)?.checkbox === true;
export const list = (properties, name) => prop(properties, name)?.multi_select?.map((t) => t.name) ?? [];

export function num(properties, name) {
  const value = prop(properties, name)?.number;
  return value === null || value === undefined ? null : value;
}

export function files(properties, name) {
  const property = prop(properties, name);
  if (property?.type !== 'files') return [];
  return property.files
    .map((file) => ({
      name: file.name || '',
      url: file.type === 'external' ? file.external.url : file.file?.url,
    }))
    .filter((file) => Boolean(file.url));
}

export const escapeHtml = (value = '') =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* --- Транслитерация: заглавията са на кирилица, котвите трябва да са на латиница --- */

const CYRILLIC = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
};

export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .split('')
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function normalizeSlug(raw, fallback = '') {
  let slug = String(raw || '').trim();
  if (!slug) slug = `/${slugify(fallback)}`;
  if (!slug.startsWith('/')) slug = `/${slug}`;
  slug = slug.replace(/\/{2,}/g, '/');
  if (slug.length > 1 && slug.endsWith('/')) slug = slug.slice(0, -1);
  return slug;
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
