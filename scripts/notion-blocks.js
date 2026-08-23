import { escapeHtml, slugify } from './notion-api.js';
import { processImage } from './media.js';

const SITE_HOSTS = ['remontnapokrivisofia.bg', 'www.remontnapokrivisofia.bg'];
const NOTION_HOSTS = ['app.notion.com', 'www.notion.so', 'notion.so'];

/** Истинска препратка към страница в Notion: пътят е 32 шестнайсетични знака. */
const NOTION_PAGE_PATH = /^\/(p\/)?[0-9a-f]{32}/i;

/**
 * Вътрешните линкове остават относителни и се отварят в същия таб.
 *
 * Notion записва относителния markdown линк (/uslugi) като абсолютен към своя
 * домейн. Без тази обработка всяка вътрешна връзка сочи към app.notion.com.
 */
function normalizeHref(href = '') {
  try {
    const url = new URL(href);
    if (SITE_HOSTS.includes(url.hostname)) return { href: url.pathname + url.search + url.hash, internal: true };
    if (NOTION_HOSTS.includes(url.hostname) && !NOTION_PAGE_PATH.test(url.pathname)) {
      return { href: url.pathname + url.search + url.hash, internal: true };
    }
    return { href, internal: false };
  } catch {
    return { href, internal: href.startsWith('/') || href.startsWith('#') };
  }
}

function richText(items = []) {
  return items
    .map((item) => {
      let out = escapeHtml(item.plain_text ?? '');
      const a = item.annotations || {};
      if (a.code) out = `<code>${out}</code>`;
      if (a.bold) out = `<strong>${out}</strong>`;
      if (a.italic) out = `<em>${out}</em>`;
      if (a.strikethrough) out = `<s>${out}</s>`;
      if (a.underline) out = `<u>${out}</u>`;
      if (item.href) {
        const { href, internal } = normalizeHref(item.href);
        const attrs = internal ? '' : ' target="_blank" rel="noopener noreferrer"';
        out = `<a href="${escapeHtml(href)}"${attrs}>${out}</a>`;
      }
      return out;
    })
    .join('');
}

const plainOf = (block) => (block[block.type]?.rich_text || []).map((t) => t.plain_text).join('').trim();

const HEADINGS = { heading_1: 2, heading_2: 2, heading_3: 3 };

/** Гарантира уникални котви, дори когато две заглавия се четат еднакво. */
function makeIdFactory() {
  const used = new Map();
  return (label) => {
    const base = slugify(label) || 'section';
    const seen = used.get(base) || 0;
    used.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  };
}

const NUMERIC_CELL = /^[\d\s.,–—-]+/;

async function renderTable(block, ctx) {
  const rows = await ctx.children(block.id);
  if (rows.length === 0) return '';
  const hasHeaderRow = block.table?.has_column_header;
  const hasHeaderCol = block.table?.has_row_header;

  const cellsOf = (row) => row.table_row?.cells || [];
  let html = '<div class="table-wrap"><table class="table-roof">';

  if (hasHeaderRow) {
    const head = cellsOf(rows[0]).map((cell) => `<th scope="col">${richText(cell)}</th>`).join('');
    html += `<thead><tr>${head}</tr></thead>`;
  }

  html += '<tbody>';
  for (const row of hasHeaderRow ? rows.slice(1) : rows) {
    html += '<tr>';
    cellsOf(row).forEach((cell, index) => {
      const content = richText(cell);
      // Числата с мерна единица подравняваме и не ги пречупваме на нов ред.
      const numeric = NUMERIC_CELL.test(cell.map((c) => c.plain_text).join('').trim());
      if (index === 0 && hasHeaderCol) html += `<th scope="row">${content}</th>`;
      else html += `<td${numeric && index > 0 ? ' class="num"' : ''}>${content}</td>`;
    });
    html += '</tr>';
  }
  return `${html}</tbody></table></div>`;
}

async function renderRun(blocks, ctx) {
  let html = '';
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    const type = block.type;

    if (type === 'bulleted_list_item' || type === 'numbered_list_item') {
      const tag = type === 'bulleted_list_item' ? 'ul' : 'ol';
      let items = '';
      while (i < blocks.length && blocks[i].type === type) {
        const item = blocks[i];
        let inner = richText(item[type].rich_text);
        if (item.has_children) inner += await renderRun(await ctx.children(item.id), ctx);
        items += `<li>${inner}</li>`;
        i += 1;
      }
      html += `<${tag}>${items}</${tag}>`;
      continue;
    }

    if (type === 'to_do') {
      let items = '';
      while (i < blocks.length && blocks[i].type === 'to_do') {
        items += `<li>${richText(blocks[i].to_do.rich_text)}</li>`;
        i += 1;
      }
      html += `<ul class="checklist">${items}</ul>`;
      continue;
    }

    if (HEADINGS[type]) {
      const level = HEADINGS[type];
      const label = plainOf(block);
      const id = ctx.makeId(label);
      if (level === 2) ctx.toc.push({ id, text: label });
      let out = `<h${level} id="${id}">${richText(block[type].rich_text)}</h${level}>`;
      if (block.has_children) out += await renderRun(await ctx.children(block.id), ctx);
      html += out;
      i += 1;
      continue;
    }

    if (type === 'table') {
      html += await renderTable(block, ctx);
      i += 1;
      continue;
    }

    if (type === 'toggle') {
      const summary = richText(block.toggle.rich_text);
      const body = block.has_children ? await renderRun(await ctx.children(block.id), ctx) : '';
      html += `<details><summary>${summary}</summary>${body}</details>`;
      i += 1;
      continue;
    }

    let out = '';

    switch (type) {
      case 'paragraph': {
        const raw = plainOf(block);
        // Абзац, който съдържа само [[име]] или [[име:аргумент]], става място за компонент.
        const widget = raw.match(/^\[\[([a-z-]+)(?::([^\]]*))?\]\]$/i);
        if (widget) {
          out = `<div data-widget="${widget[1].toLowerCase()}"${widget[2] ? ` data-arg="${escapeHtml(widget[2].trim())}"` : ''}></div>`;
          break;
        }
        out = block.paragraph.rich_text.length ? `<p>${richText(block.paragraph.rich_text)}</p>` : '';
        break;
      }
      case 'quote':
        out = `<blockquote>${richText(block.quote.rich_text)}</blockquote>`;
        break;
      case 'callout':
        out = `<aside class="callout">${richText(block.callout.rich_text)}</aside>`;
        break;
      case 'divider':
        out = '<hr />';
        break;
      case 'code':
        out = `<pre><code>${escapeHtml(block.code.rich_text.map((t) => t.plain_text).join(''))}</code></pre>`;
        break;
      case 'image': {
        const src = block.image.type === 'external' ? block.image.external.url : block.image.file?.url;
        const caption = block.image.caption?.map((t) => t.plain_text).join('') || '';
        const media = await processImage(src, caption);
        if (media) {
          const sources = (media.sources || [])
            .map((s) => `<source type="${s.type}" srcset="${s.srcset}" sizes="(min-width: 768px) 720px, 100vw" />`)
            .join('');
          const dims = media.width && media.height ? ` width="${media.width}" height="${media.height}"` : '';
          out =
            `<figure><picture>${sources}` +
            `<img src="${media.src}" alt="${escapeHtml(caption)}"${dims} loading="lazy" decoding="async" /></picture>` +
            (caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '') +
            '</figure>';
        }
        break;
      }
      default:
        out = '';
    }

    if (out && block.has_children) {
      out += await renderRun(await ctx.children(block.id), ctx);
    }
    html += out;
    i += 1;
  }

  return html;
}

const FAQ_HEADING = /^(често задавани въпроси|въпроси и отговори|чзв)/i;

/**
 * Вади FAQ секцията от тялото. Въпросите са H3, отговорът е всичко до следващия H3.
 * Шаблонът я рендира като акордеон и генерира FAQPage schema, затова я махаме от прозата.
 */
async function extractFaq(blocks, ctx) {
  const start = blocks.findIndex((b) => HEADINGS[b.type] && FAQ_HEADING.test(plainOf(b)));
  if (start === -1) return { faq: [], rest: blocks };

  let end = blocks.length;
  for (let i = start + 1; i < blocks.length; i += 1) {
    if (blocks[i].type === 'heading_2' || blocks[i].type === 'heading_1') {
      end = i;
      break;
    }
  }

  const faq = [];
  let current = null;
  for (const block of blocks.slice(start + 1, end)) {
    if (block.type === 'heading_3') {
      if (current) faq.push(current);
      current = { q: plainOf(block), a: '' };
    } else if (current) {
      current.a += await renderRun([block], ctx);
    }
  }
  if (current) faq.push(current);

  const rest = [...blocks.slice(0, start), ...blocks.slice(end)];
  return { faq: faq.filter((item) => item.q && item.a), rest };
}

/** Обхожда тялото на една Notion страница и връща готовия HTML, съдържанието и FAQ-а. */
export async function renderPageBody(blocks, children) {
  const ctx = { children, toc: [], makeId: makeIdFactory() };
  const { faq, rest } = await extractFaq(blocks, ctx);
  const html = await renderRun(rest, ctx);

  const wordCount = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return { html, toc: ctx.toc, faq, wordCount };
}
