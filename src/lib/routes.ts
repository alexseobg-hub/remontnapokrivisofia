import { pages, projects } from './content';

/** Всеки адрес, който трябва да съществува като статичен файл. */
export const routes: string[] = [
  ...pages.filter((page) => !page.noindex || page.slug === '/404').map((page) => page.slug),
  ...pages.filter((page) => page.noindex).map((page) => page.slug),
  ...projects.map((project) => project.slug),
];

/** Само адресите, които влизат в sitemap.xml. */
export const indexableRoutes = (): { slug: string; updated: string }[] =>
  pages
    .filter((page) => !page.noindex)
    .map((page) => ({ slug: page.slug, updated: page.updated || page.publishDate || '' }))
    .concat(projects.map((project) => ({ slug: project.slug, updated: project.date || '' })));
