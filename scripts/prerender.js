#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { projectRoot, ensureDir } from './notion-api.js';
import { resolveSiteUrl, isIndexable } from './site-url.js';

const distDir = path.join(projectRoot, 'dist');
const ssrEntry = path.join(projectRoot, '.ssr', 'entry-server.js');
const templatePath = path.join(distDir, 'index.html');

const SITE_URL = resolveSiteUrl('production');
const INDEXABLE = isIndexable(SITE_URL);

function readTemplate() {
  if (!fs.existsSync(templatePath)) {
    throw new Error('Липсва dist/index.html. Пусни първо `npm run build:client`.');
  }
  return fs.readFileSync(templatePath, 'utf8');
}

/** Слага заглавието и meta таговете в готовия шаблон на мястото на служебните. */
function compose(template, rendered) {
  return template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace('</head>', `  ${rendered.head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${rendered.html}</div>`);
}

/**
 * Плосък файл, а не папка с index.html.
 *
 * `uslugi/index.html` се сервира на адрес с наклонена черта накрая и хостингът
 * пренасочва `/uslugi` към `/uslugi/`. Тогава всеки canonical и всяка вътрешна
 * връзка минават през излишен скок. `uslugi.html` се сервира направо на
 * `/uslugi` — точно адреса, който сайтът обявява за свой.
 */
function outputFor(slug) {
  if (slug === '/') return path.join(distDir, 'index.html');
  return path.join(distDir, `${slug.replace(/^\//, '')}.html`);
}

function sitemap(entries) {
  const urls = entries
    .map(({ slug, updated }) => {
      const loc = slug === '/' ? `${SITE_URL}/` : `${SITE_URL}${slug}`;
      const lastmod = updated ? `\n    <lastmod>${updated.slice(0, 10)}</lastmod>` : '';
      // Началната страница е целта; услугите и кварталите я следват.
      const priority = slug === '/' ? '1.0' : slug.split('/').length <= 2 ? '0.8' : '0.6';
      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
    .replace('www.sitemap.org', 'www.sitemaps.org');
}

function robots() {
  if (!INDEXABLE) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

function llms(settings, hubs) {
  const company = settings.companyName || 'Ремонт на покриви София';
  const lines = [
    `# ${company}`,
    '',
    'Фирма за ремонт и изграждане на покриви в София и София област.',
    '',
    '## Услуги',
    ...hubs.map((hub) => `- ${hub.name}: ${SITE_URL}${hub.slug}`),
    '',
    '## Цени',
    `- Ценоразпис: ${SITE_URL}/ceni`,
    `- Калкулатор: ${SITE_URL}/kalkulator`,
    '',
    '## Контакт',
  ];
  if (settings.phonePrimary) lines.push(`Телефон: ${settings.phonePrimary}`);
  if (settings.workingHours) lines.push(`Работно време: ${settings.workingHours}`);
  lines.push('Обслужвана територия: София и София област', '');
  return lines.join('\n');
}

async function main() {
  const template = readTemplate();
  const server = await import(pathToFileURL(ssrEntry).href);
  const content = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src', 'data', 'content.generated.json'), 'utf8'));

  const seen = new Set();
  const routes = [...server.routes, '/404'].filter((slug) => {
    if (seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });

  let written = 0;
  for (const slug of routes) {
    const rendered = server.render(slug);
    const file = outputFor(slug);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, compose(template, rendered), 'utf8');
    written += 1;
  }

  // Статичните хостинги търсят 404.html в корена. При плоския изход страницата
  // вече се пише точно там, затова копие не трябва — само проверяваме, че я има.
  if (!fs.existsSync(path.join(distDir, '404.html'))) {
    console.warn('  ВНИМАНИЕ: липсва 404.html — грешните адреси ще падат на хостинга.');
  }

  const indexable = content.pages
    .filter((page) => !page.noindex)
    .map((page) => ({ slug: page.slug, updated: page.updated || page.publishDate || '' }))
    .concat(content.projects.map((project) => ({ slug: project.slug, updated: project.date || '' })));

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap(indexable), 'utf8');
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots(), 'utf8');
  fs.writeFileSync(
    path.join(distDir, 'llms.txt'),
    llms(content.settings || {}, content.pages.filter((page) => page.type === 'Service hub')),
    'utf8',
  );

  console.log(`Изписани ${written} страници, ${indexable.length} адреса в sitemap.xml`);
  if (!INDEXABLE) console.log('Билдът е с noindex, защото адресът не е продукционният.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
