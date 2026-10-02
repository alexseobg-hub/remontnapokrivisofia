import { GLOSSARY_INTRO, GLOSSARY_META_DESCRIPTION, GLOSSARY_META_TITLE } from '@/data/rechnik';
import { has, site } from '@/config/site';
import { buildHead } from './seo';
import * as schema from './schema';
import { GLOSSARY_SLUG, getGlossaryPage, getTerm, glossaryPageTitle, pagePath } from './glossary';

const brand = () => (has('companyName') ? site.companyName : 'Ремонт на покриви София');
const HOME = { name: 'Начало', slug: '/' };
const HUB = { name: 'Речник', slug: GLOSSARY_SLUG };

export function glossaryHubHead() {
  return buildHead({
    title: GLOSSARY_META_TITLE,
    description: GLOSSARY_META_DESCRIPTION,
    slug: GLOSSARY_SLUG,
    jsonLd: schema.graph(
      schema.organization(),
      schema.website(),
      schema.breadcrumbs([HOME, HUB]),
      schema.definedTermSet(GLOSSARY_INTRO),
    ),
  });
}

export function glossaryTermHead(slug: string) {
  const page = getGlossaryPage(slug);
  const term = getTerm(slug);
  if (!page || !term) return undefined;
  return buildHead({
    title: glossaryPageTitle(term.term, brand()),
    description: page.metaDescription,
    slug: pagePath(slug),
    jsonLd: schema.graph(
      schema.organization(),
      schema.website(),
      schema.breadcrumbs([HOME, HUB, { name: term.term, slug: pagePath(slug) }]),
      schema.definedTerm(slug),
    ),
  });
}
