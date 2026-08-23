import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Адресът на сайта захранва canonical, og:url, sitemap и JSON-LD.
 * Демо адресите и локалните билдове излизат с noindex, за да не се индексират по погрешка.
 */
function resolveSiteUrl(mode: string) {
  const explicit = process.env.VITE_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return mode === 'production' ? 'https://remontnapokrivisofia.bg' : 'http://localhost:5173';
}

export default defineConfig(({ mode }) => {
  const siteUrl = resolveSiteUrl(mode);
  const indexable = siteUrl === 'https://remontnapokrivisofia.bg';

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
