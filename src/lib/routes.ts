import { pages, projects } from './content';
import { glossaryRoutes } from './glossary';
import { GLOSSARY_UPDATED } from '@/data/rechnik';

/** Всеки адрес, който трябва да съществува като статичен файл. */
export const routes: string[] = [
  ...pages.filter((page) => !page.noindex || page.slug === '/404').map((page) => page.slug),
  ...pages.filter((page) => page.noindex).map((page) => page.slug),
  ...projects.map((project) => project.slug),
  ...glossaryRoutes(),
];

/** Само адресите, които влизат в sitemap.xml. */
export const indexableRoutes = (): { slug: string; updated: string }[] =>
  pages
    .filter((page) => !page.noindex)
    .map((page) => ({ slug: page.slug, updated: page.updated || page.publishDate || '' }))
    .concat(projects.map((project) => ({ slug: project.slug, updated: project.date || '' })))
    // Хъбът и отделните страници на речника. Котвите в хъба не влизат.
    .concat(glossaryRoutes().map((slug) => ({ slug, updated: GLOSSARY_UPDATED })));
