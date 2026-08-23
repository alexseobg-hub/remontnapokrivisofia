#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { projectRoot, ensureDir } from './notion-api.js';

/*
 * Тематични снимки за начало, докато няма собствени.
 *
 * Източник: Pexels. Лицензът позволява търговска употреба, промяна и
 * използване без посочване на автора. Всяка снимка е записана по номер, за да
 * може произходът ѝ да се провери и да се смени с една дума.
 *
 * ВАЖНО: тези снимки са само декоративни. Никоя от тях не се показва като
 * наш реализиран обект. Обектите в базата „Проекти“ приемат единствено
 * истински снимки; когато няма такива, се рисува неутрален графичен блок.
 *
 * Пуска се веднъж: node scripts/prepare-stock.js
 */

const STOCK = [
  { key: 'keremidi-pokriv', id: '29114658', alt: 'Керемиден покрив на фона на синьо небе', use: 'Начална страница, основна снимка' },
  { key: 'narezhdane-keremidi', id: '31763541', alt: 'Нареждане на керамични керемиди по скат', use: 'Ремонт на покриви, пренареждане' },
  { key: 'bitumni-keremidi', id: '12001528', alt: 'Покрив от битумни керемиди отблизо', use: 'Покривни покрития' },
  { key: 'nov-pokriv', id: '30580640', alt: 'Новопостроени къщи с готови покриви', use: 'Изграждане на покриви' },
  { key: 'toploizolaciya', id: '6124239', alt: 'Полагане на минерална вата в подпокривно пространство', use: 'Топлоизолация' },
  { key: 'instrumenti', id: '37663438', alt: 'Ръчни инструменти върху дървена повърхност', use: 'Процес, за нас' },
  { key: 'kashta-keremidi', id: '8336130', alt: 'Тухлена къща с керемиден покрив', use: 'Градове и райони' },
  { key: 'tenekedzhiyski', id: '5691518', alt: 'Захващане на метален профил с винтоверт', use: 'Тенекеджийски услуги' },
  { key: 'komini', id: '13543563', alt: 'Тухлени комини над покрив', use: 'Обшивка на комин' },
  { key: 'star-pokriv', id: '17587644', alt: 'Стара сграда с износена фасада и покрив', use: 'Признаци за ремонт' },
  { key: 'shindli', id: '20296321', alt: 'Къща с покрив от шиндли', use: 'Навеси, покривни покрития' },
];

const WIDTHS = [640, 1024, 1600];
const outDir = path.join(projectRoot, 'public', 'stock');
const manifestPath = path.join(projectRoot, 'src', 'data', 'stock.json');

async function main() {
  const { default: sharp } = await import('sharp');
  ensureDir(outDir);
  const manifest = {};

  for (const item of STOCK) {
    const url = `https://images.pexels.com/photos/${item.id}/pexels-photo-${item.id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  ${item.key}: HTTP ${response.status}, пропуснато`);
      continue;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const meta = await sharp(buffer).metadata();
    const targets = WIDTHS.filter((w) => w <= (meta.width || 1600));
    if (targets.length === 0) targets.push(meta.width || 1600);

    const sources = [];
    for (const format of ['avif', 'webp']) {
      const parts = [];
      for (const width of targets) {
        const file = `${item.key}-${width}.${format}`;
        const pipeline = sharp(buffer).resize({ width, withoutEnlargement: true });
        await (format === 'avif' ? pipeline.avif({ quality: 52 }) : pipeline.webp({ quality: 76 })).toFile(
          path.join(outDir, file),
        );
        parts.push(`/stock/${file} ${width}w`);
      }
      sources.push({ type: `image/${format}`, srcset: parts.join(', ') });
    }

    const widest = targets[targets.length - 1];
    const fallback = `${item.key}-${widest}.jpg`;
    await sharp(buffer).resize({ width: widest, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(outDir, fallback));

    manifest[item.key] = {
      src: `/stock/${fallback}`,
      width: widest,
      height: meta.height && meta.width ? Math.round((meta.height / meta.width) * widest) : null,
      alt: item.alt,
      sources,
      credit: { source: 'Pexels', id: item.id, url: `https://www.pexels.com/photo/${item.id}/`, license: 'Pexels License' },
      use: item.use,
    };
    console.log(`  ${item.key.padEnd(22)} ${widest}px`);
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Записани ${Object.keys(manifest).length} снимки в public/stock и src/data/stock.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
