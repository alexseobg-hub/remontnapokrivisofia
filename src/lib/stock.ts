import stock from '@/data/stock.json';
import type { ContentPage, MediaImage } from './content';

/*
 * Тематични снимки за начало. Декоративни са и толкова.
 * Никоя от тях не се показва като наш реализиран обект - обектите приемат
 * само истински снимки, а когато няма такива, се рисува графичен блок.
 * Произходът и лицензът на всяка са записани в src/data/stock.json.
 */

type StockEntry = MediaImage & {
  credit: { source: string; id: string; url: string; license: string };
  use: string;
};

const library = stock as unknown as Record<string, StockEntry>;

export const stockImage = (key: string): MediaImage | null => library[key] ?? null;

export const stockKeys = () => Object.keys(library);

/** Снимката за заглавната част: първо качената, после тематичната, после нищо. */
export function heroFor(page: ContentPage): MediaImage | null {
  return page.heroImage ?? (page.heroStock ? stockImage(page.heroStock) : null);
}

/** Списък с източниците, за страницата с кредитите. */
export const stockCredits = () =>
  Object.entries(library).map(([key, entry]) => ({ key, ...entry.credit, alt: entry.alt }));
