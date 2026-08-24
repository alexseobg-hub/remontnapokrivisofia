/*
 * Адресът на сайта се смята на едно място.
 *
 * Клиентският билд и prerender-ът го четяха поотделно и се разминаваха: страниците
 * излизаха с canonical към www, а sitemap и robots — към голия домейн. Google
 * получаваше противоречиви указания от един и същ билд.
 */

/** Единственият адрес, при който сайтът се индексира. */
export const PRODUCTION_URL = 'https://remontnapokrivisofia.bg';

const strip = (url) => url.replace(/\/+$/, '');

/**
 * Сайтът живее на голия домейн. Ако Vercel подаде варианта с www — а той го прави,
 * когато домейнът е добавен така — свеждаме го до без www, за да не сочат canonical
 * и sitemap към адрес, различен от избрания.
 */
const normalise = (url) => strip(url).replace(/^https:\/\/www\.remontnapokrivisofia\.bg/, PRODUCTION_URL);

/**
 * Редът е нарочен: изрично зададеното бие всичко, после идват адресите, които
 * Vercel подава сам, и накрая — по подразбиране според режима.
 */
export function resolveSiteUrl(mode = process.env.NODE_ENV) {
  const explicit = process.env.VITE_SITE_URL;
  if (explicit) return normalise(explicit);

  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalise(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // Cloudflare не подава собствения домейн на билда — само адреса в pages.dev.
  // Затова продукцията иска изрично зададен VITE_SITE_URL, а всичко останало
  // остава на pages.dev и се маркира с noindex.
  if (process.env.CF_PAGES_URL) return strip(process.env.CF_PAGES_URL);

  return mode === 'production' ? PRODUCTION_URL : 'http://localhost:5173';
}

/** Индексира се само истинският домейн. Всичко останало е демо и стои с noindex. */
export function isIndexable(siteUrl) {
  return siteUrl === PRODUCTION_URL;
}
