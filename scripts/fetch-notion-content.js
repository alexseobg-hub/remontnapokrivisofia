#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  loadEnvFile, makeClient, projectRoot, ensureDir,
  text, bool, list, num, files, normalizeSlug, slugify,
} from './notion-api.js';
import { renderPageBody } from './notion-blocks.js';
import { loadManifest, saveManifest, processImage } from './media.js';

const outputPath = path.join(projectRoot, 'src', 'data', 'content.generated.json');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Липсва ${name}. Копирай .env.example в .env и попълни стойностите.`);
    process.exit(1);
  }
  return value;
}

/* ---------- Настройки ---------- */

async function fetchSettings(api, databaseId) {
  const rows = await api.queryDatabase(databaseId);
  const settings = {};
  for (const row of rows) {
    const key = text(row.properties, 'Key');
    const value = text(row.properties, 'Стойност');
    if (key && value) settings[key] = value;
  }
  return settings;
}

/* ---------- Цени ---------- */

async function fetchPricing(api, databaseId) {
  const rows = await api.queryDatabase(databaseId);
  return rows
    .filter((row) => bool(row.properties, 'Активна'))
    .map((row) => ({
      key: text(row.properties, 'Key') || slugify(text(row.properties, 'Дейност')),
      service: text(row.properties, 'Дейност'),
      unit: text(row.properties, 'Мярка'),
      from: num(row.properties, 'Цена от'),
      to: num(row.properties, 'Цена до'),
      category: text(row.properties, 'Категория'),
      note: text(row.properties, 'Пояснение'),
      order: num(row.properties, 'Ред') ?? 999,
    }))
    .sort((a, b) => a.order - b.order);
}

/* ---------- Проекти ---------- */

async function fetchProjects(api, databaseId) {
  const rows = await api.queryDatabase(databaseId);
  const projects = [];

  for (const row of rows) {
    if (!bool(row.properties, 'Публикуван')) continue;
    const title = text(row.properties, 'Заглавие');
    const district = text(row.properties, 'Квартал');

    const [before] = files(row.properties, 'Снимка преди');
    const [after] = files(row.properties, 'Снимка след');
    const gallery = files(row.properties, 'Галерия');

    projects.push({
      id: row.id,
      title,
      slug: normalizeSlug(`/proekti/${text(row.properties, 'Slug') || slugify(title)}`),
      district,
      services: list(row.properties, 'Тип услуга'),
      buildingType: text(row.properties, 'Тип сграда'),
      area: num(row.properties, 'Площ м2'),
      duration: text(row.properties, 'Срок'),
      works: text(row.properties, 'Извършени дейности'),
      materials: text(row.properties, 'Материали'),
      priceRange: text(row.properties, 'Ценови диапазон'),
      description: text(row.properties, 'Описание'),
      date: text(row.properties, 'Дата'),
      order: num(row.properties, 'Ред') ?? 999,
      imageBefore: before ? await processImage(before.url, `${title} — преди ремонта`) : null,
      imageAfter: after ? await processImage(after.url, `${title} — след ремонта`) : null,
      gallery: (await Promise.all(gallery.map((file) => processImage(file.url, title)))).filter(Boolean),
    });
  }

  return projects.sort((a, b) => a.order - b.order);
}

/* ---------- Отзиви ---------- */

async function fetchTestimonials(api, databaseId) {
  const rows = await api.queryDatabase(databaseId);
  return rows
    .filter((row) => bool(row.properties, 'Публикуван'))
    .map((row) => ({
      name: text(row.properties, 'Име'),
      district: text(row.properties, 'Квартал'),
      body: text(row.properties, 'Отзив'),
      rating: num(row.properties, 'Оценка'),
      source: text(row.properties, 'Източник'),
      link: text(row.properties, 'Линк към отзива'),
      service: text(row.properties, 'Услуга'),
      date: text(row.properties, 'Дата'),
      order: num(row.properties, 'Ред') ?? 999,
    }))
    .filter((item) => item.name && item.body)
    .sort((a, b) => a.order - b.order);
}

/* ---------- Страници ---------- */

async function fetchPages(api, databaseId) {
  const rows = await api.queryDatabase(databaseId);
  const pages = [];

  for (const row of rows) {
    const properties = row.properties;
    if (text(properties, 'Status') !== 'Published') continue;

    const name = text(properties, 'Name', 'Без име');
    const slug = normalizeSlug(text(properties, 'Slug'), name);
    const blocks = await api.blockChildren(row.id);
    const { html, toc, faq, wordCount } = await renderPageBody(blocks, api.blockChildren);

    // Качената снимка бие тематичната. Тематичната е само за начало.
    const [hero] = files(properties, 'Hero image');
    const heroImage = hero ? await processImage(hero.url, name) : null;

    pages.push({
      id: row.id,
      name,
      slug,
      h1: text(properties, 'H1') || name,
      type: text(properties, 'Type', 'Page'),
      metaTitle: text(properties, 'Meta title') || name,
      metaDescription: text(properties, 'Meta description') || text(properties, 'Description'),
      description: text(properties, 'Description'),
      shortAnswer: text(properties, 'Short answer'),
      parent: text(properties, 'Parent') ? normalizeSlug(text(properties, 'Parent')) : '',
      order: num(properties, 'Order') ?? 999,
      nav: bool(properties, 'Nav'),
      district: text(properties, 'District'),
      canonicalUrl: text(properties, 'Canonical URL'),
      publishDate: text(properties, 'Publish date'),
      updated: text(properties, 'Updated'),
      tags: list(properties, 'Tags'),
      noindex: bool(properties, 'Noindex'),
      html,
      toc,
      faq,
      wordCount,
      heroImage,
      heroStock: text(properties, 'Hero stock'),
    });
  }

  return pages.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/* ---------- Главна ---------- */

async function main() {
  loadEnvFile(path.join(projectRoot, '.env'));
  loadManifest();

  const api = makeClient(requireEnv('NOTION_API_KEY'));

  const settings = await fetchSettings(api, requireEnv('NOTION_SETTINGS_DB'));
  console.log(`  настройки:  ${Object.keys(settings).length}`);

  const pricing = await fetchPricing(api, requireEnv('NOTION_PRICING_DB'));
  console.log(`  цени:       ${pricing.length}`);

  const testimonials = await fetchTestimonials(api, requireEnv('NOTION_TESTIMONIALS_DB'));
  console.log(`  отзиви:     ${testimonials.length}`);

  const projects = await fetchProjects(api, requireEnv('NOTION_PROJECTS_DB'));
  console.log(`  проекти:    ${projects.length}`);

  const pages = await fetchPages(api, requireEnv('NOTION_PAGES_DB'));
  console.log(`  страници:   ${pages.length}`);

  saveManifest();
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), settings, pricing, projects, testimonials, pages }, null, 2),
    'utf8',
  );

  const duplicates = pages
    .map((page) => page.slug)
    .filter((slug, index, all) => all.indexOf(slug) !== index);
  if (duplicates.length) {
    console.warn(`  ВНИМАНИЕ: повтарящи се slug-ове: ${[...new Set(duplicates)].join(', ')}`);
  }

  console.log(`Записано в ${path.relative(projectRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
