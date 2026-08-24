import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { resolveSiteUrl, isIndexable } from './scripts/site-url.js';

/**
 * Адресът на сайта захранва canonical, og:url, sitemap и JSON-LD. Сметката живее
 * в scripts/site-url.js, за да е една и съща тук и в prerender-а.
 * Демо адресите и локалните билдове излизат с noindex, за да не се индексират по погрешка.
 */
export default defineConfig(({ mode }) => {
  const siteUrl = resolveSiteUrl(mode);
  const indexable = isIndexable(siteUrl);

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(process.cwd(), 'src') },
    },
    define: {
      __SITE_URL__: JSON.stringify(siteUrl),
      __INDEXABLE__: JSON.stringify(indexable),
      __IS_DEV__: JSON.stringify(mode !== 'production'),
      __FORM_ENDPOINT__: JSON.stringify(process.env.VITE_FORM_ENDPOINT || ''),
    },
    build: {
      target: 'es2020',
      cssCodeSplit: false,
      assetsInlineLimit: 2048,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  };
});
