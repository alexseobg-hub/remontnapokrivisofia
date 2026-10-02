import { CLUSTERS, PAGES, TERMS, type ClusterKey, type GlossaryPage, type GlossaryTerm } from '@/data/rechnik';

export const GLOSSARY_SLUG = '/rechnik';

const collator = new Intl.Collator('bg');
const byTerm = (a: GlossaryTerm, b: GlossaryTerm) => collator.compare(a.term, b.term);

const termMap = new Map(TERMS.map((term) => [term.slug, term]));
const pageMap = new Map(PAGES.map((page) => [page.slug, page]));

export const getTerm = (slug: string) => termMap.get(slug);
export const getGlossaryPage = (slug: string) => pageMap.get(slug);
export const glossaryPages = () => PAGES;

export const pagePath = (slug: string) => `${GLOSSARY_SLUG}/${slug}`;
export const anchorPath = (slug: string) => `${GLOSSARY_SLUG}#${slug}`;

/** Термините на един кластер, по азбучен ред. */
export const termsIn = (cluster: ClusterKey) => TERMS.filter((term) => term.cluster === cluster).sort(byTerm);

export const clusters = () => CLUSTERS;

/** Котвата на кластера. С представка, за да не се бие със slug на термин. */
export const clusterAnchor = (key: ClusterKey) => `klaster-${key}`;

/**
 * Накъде води терминът — за връзката под определението.
 * Терминът със страница води към нея. Термин на услуга или публикувана статия
 * води към собственика. Всичко останало няма връзка: собственикът още не
 * съществува или терминът живее само в хъба.
 */
export function ownerLink(term: GlossaryTerm): { label: string; href: string } | null {
  const { owner } = term;
  if (owner.kind === 'page') {
    return pageMap.has(term.slug) ? { label: 'Прочетете повече', href: pagePath(term.slug) } : null;
  }
  if (owner.kind === 'service' && owner.href) return { label: `Подробно: ${owner.name}`, href: owner.href };
  if (owner.kind === 'blog' && owner.href) return { label: `Подробно: ${owner.title}`, href: owner.href };
  return null;
}

/**
 * Адресът на термина в JSON-LD. Правилото е от спецификацията: отделна страница,
 * иначе собственикът, иначе котвата в хъба.
 */
export function termUrlPath(term: GlossaryTerm): string {
  if (pageMap.has(term.slug)) return pagePath(term.slug);
  const { owner } = term;
  if (owner.kind === 'service' && owner.href) return owner.href;
  if (owner.kind === 'blog' && owner.href) return owner.href;
  return anchorPath(term.slug);
}

/** Връзка към свързан термин: към страницата му, ако има, иначе към котвата. */
export function relatedLink(slug: string): { label: string; href: string } | null {
  const term = termMap.get(slug);
  if (!term) return null;
  return { label: term.term, href: pageMap.has(slug) ? pagePath(slug) : anchorPath(slug) };
}

/**
 * Заглавие до 60 знака. Ако пълното не се побира, отпада „и за какво служи“,
 * както казва спецификацията.
 */
export function glossaryPageTitle(term: string, brand: string): string {
  const full = `${term} – какво е и за какво служи | ${brand}`;
  return full.length <= 60 ? full : `${term} – какво е | ${brand}`;
}

/** Азбучен указател: кирилицата първо, латиницата (PVC, XPS…) накрая. */
export function alphabetIndex(): { letter: string; terms: GlossaryTerm[] }[] {
  const groups = new Map<string, GlossaryTerm[]>();
  for (const term of [...TERMS].sort(byTerm)) {
    const letter = term.term.charAt(0).toLocaleUpperCase('bg');
    groups.set(letter, [...(groups.get(letter) ?? []), term]);
  }
  const cyrillic = (letter: string) => /\p{Script=Cyrillic}/u.test(letter);
  return [...groups.entries()]
    .sort(([a], [b]) => (cyrillic(a) === cyrillic(b) ? collator.compare(a, b) : cyrillic(a) ? -1 : 1))
    .map(([letter, terms]) => ({ letter, terms }));
}

export const glossaryRoutes = () => [GLOSSARY_SLUG, ...PAGES.map((page) => pagePath(page.slug))];

/* ---------- Връзки от услугите и статиите към речника ---------- */

/*
 * Първото споменаване на термин със собствена страница става връзка към нея.
 * Нищо друго в текста не се пипа: думата остава същата, само се обвива.
 *
 * Пропускат се заглавията и текстът, който вече е връзка. H1, title и прекият
 * отговор под H1 изобщо не са в това HTML — те идват от отделни полета.
 */
export function linkGlossaryMentions(html: string, pages: GlossaryPage[] = PAGES): string {
  if (!html) return html;

  const pending = new Map(pages.map((page) => [page.slug, page.mention]));
  const parts = html.split(/(<[^>]+>)/);
  let insideLink = 0;
  let insideHeading = 0;

  for (let i = 0; i < parts.length && pending.size > 0; i += 1) {
    const part = parts[i];
    if (part.startsWith('<')) {
      if (/^<a[\s>]/i.test(part)) insideLink += 1;
      else if (/^<\/a>/i.test(part)) insideLink = Math.max(0, insideLink - 1);
      else if (/^<h[1-6][\s>]/i.test(part)) insideHeading += 1;
      else if (/^<\/h[1-6]>/i.test(part)) insideHeading = Math.max(0, insideHeading - 1);
      continue;
    }
    if (!part || insideLink || insideHeading) continue;

    // Всички попадения в този откъс, по ред, без застъпване.
    const hits: { start: number; end: number; slug: string }[] = [];
    for (const [slug, pattern] of pending) {
      const match = new RegExp(pattern.source, pattern.flags.replace('g', '')).exec(part);
      if (match) hits.push({ start: match.index, end: match.index + match[0].length, slug });
    }
    if (hits.length === 0) continue;

    hits.sort((a, b) => a.start - b.start);
    let out = '';
    let cursor = 0;
    for (const hit of hits) {
      if (hit.start < cursor) continue;
      out += `${part.slice(cursor, hit.start)}<a href="${pagePath(hit.slug)}">${part.slice(hit.start, hit.end)}</a>`;
      cursor = hit.end;
      pending.delete(hit.slug);
    }
    parts[i] = out + part.slice(cursor);
  }

  return parts.join('');
}

/* ---------- Списък за проверка ---------- */

/** rechnik-verify.md: всичко, маркирано с VERIFY, на едно място. */
export function verifyMarkdown(): string {
  const lines = [
    '# Речник: определения за проверка',
    '',
    'Значенията по-долу са регионални или несигурни. Прегледайте ги, преди фазата да се публикува.',
    'Поправките се правят в `src/data/rechnik.ts`. Този файл се създава наново при всеки билд.',
    '',
    '## Термини в хъба',
    '',
  ];

  for (const term of TERMS.filter((item) => item.verify)) {
    lines.push(`### ${term.term} (\`${term.slug}\`)`, '', term.definition, '');
    if (term.synonyms?.length) lines.push(`Още: ${term.synonyms.join(', ')}`, '');
    if (term.verifyNote) lines.push(`> Въпрос: ${term.verifyNote}`, '');
  }

  const pages = PAGES.filter((page) => page.verify);
  if (pages.length > 0) {
    lines.push('## Отделни страници', '');
    for (const page of pages) {
      const term = termMap.get(page.slug);
      lines.push(`### ${term?.term ?? page.slug} (\`${pagePath(page.slug)}\`)`, '');
      for (const section of page.sections) {
        lines.push(`**${section.heading}**`, '', ...section.paragraphs.flatMap((text) => [text, '']));
      }
    }
  }

  return `${lines.join('\n').trim()}\n`;
}
