import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GLOSSARY_INTRO, GLOSSARY_TITLE, TERMS, type GlossaryTerm } from '@/data/rechnik';
import {
  GLOSSARY_SLUG, alphabetIndex, clusterAnchor, clusters, getGlossaryPage, getTerm, ownerLink, relatedLink, termsIn,
} from '@/lib/glossary';
import { Breadcrumbs } from './Breadcrumbs';
import { CtaBlock } from './CtaBlock';
import { Section } from './ui';

const HOME = { name: 'Начало', slug: '/' };
const HUB = { name: 'Речник', slug: GLOSSARY_SLUG };

/** Светлата заглавна лента, същата като на обикновените страници, без формата. */
function GlossaryHeader({ trail, title, lede, children }: {
  trail: { name: string; slug: string }[];
  title: string;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-graphite-200 bg-sand-100 py-10 md:py-14">
      <div className="shell">
        <Breadcrumbs trail={trail} />
        <h1 className="text-display-lg">{title}</h1>
        <p className="lede mt-4">{lede}</p>
        {children}
      </div>
    </header>
  );
}

/** Един термин в хъба: заглавие с котва, определение, синоними, връзка към собственика. */
function TermBlock({ term }: { term: GlossaryTerm }) {
  const link = ownerLink(term);
  return (
    <article id={term.slug} className="border-t border-graphite-200 py-5">
      <h3 className="font-display text-lg font-extrabold text-graphite-900">{term.term}</h3>
      <p className="mt-2 leading-relaxed text-graphite-700">{term.definition}</p>
      {term.synonyms?.length ? (
        <p className="mt-2 text-sm text-graphite-500">Още: {term.synonyms.join(', ')}</p>
      ) : null}
      {link ? (
        <p className="mt-3">
          <Link to={link.href} className="font-display text-sm font-bold text-brick-700 hover:text-brick-800">
            {link.label} →
          </Link>
        </p>
      ) : null}
    </article>
  );
}

/**
 * Лентата с темите. Лепи се под хедъра, за да не се превърта през 96 термина
 * на телефон: всяка тема е на едно докосване. На тесен екран се плъзга настрани.
 */
function ClusterNav() {
  return (
    <nav aria-label="Теми в речника" className="sticky top-[var(--header-h,7rem)] z-30 border-b border-graphite-200 bg-white">
      <ul className="shell flex gap-2 overflow-x-auto overscroll-x-contain py-3 [scrollbar-width:none] lg:flex-wrap [&::-webkit-scrollbar]:hidden">
        {clusters().map((cluster) => (
          <li key={cluster.key} className="shrink-0">
            <a
              href={`#${clusterAnchor(cluster.key)}`}
              className="inline-flex h-9 items-center whitespace-nowrap border border-graphite-200 px-3 font-display text-[0.8125rem] font-bold text-graphite-800 hover:border-graphite-900"
            >
              {cluster.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Азбучният указател. Свит по подразбиране, за да не избутва темите надолу. */
function AlphabetIndex() {
  return (
    <details className="border border-graphite-200 bg-white">
      <summary className="cursor-pointer px-5 py-4 font-display font-bold text-graphite-900">
        Азбучен указател: всички {TERMS.length} термина
      </summary>
      <div className="space-y-3 border-t border-graphite-200 px-5 py-5">
        {alphabetIndex().map(({ letter, terms }) => (
          <div key={letter} className="flex gap-4">
            <span className="w-6 shrink-0 font-display font-extrabold text-brick-700">{letter}</span>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.9375rem]">
              {terms.map((term) => (
                <li key={term.slug}>
                  <a href={`#${term.slug}`} className="text-graphite-700 underline-offset-4 hover:text-brick-700 hover:underline">
                    {term.term}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

export function GlossaryHub() {
  return (
    <>
      <GlossaryHeader trail={[HOME, HUB]} title={GLOSSARY_TITLE} lede={GLOSSARY_INTRO} />

      {/* Обвивката е нарочна: лентата с темите се лепи само докато трае речникът. */}
      <div>
        <ClusterNav />
        <div className="band-white band-tight">
          <div className="shell">
            <AlphabetIndex />
          </div>
        </div>

        {clusters().map((cluster, index) => (
          <Section key={cluster.key} id={clusterAnchor(cluster.key)} tone={index % 2 === 0 ? 'sand' : 'white'}>
            <h2 className="text-display-md">{cluster.title}</h2>
            <p className="lede mt-3">{cluster.intro}</p>
            <div className="mt-8 grid gap-x-10 lg:grid-cols-2">
              {termsIn(cluster.key).map((term) => (
                <TermBlock key={term.slug} term={term} />
              ))}
            </div>
          </Section>
        ))}
      </div>

      <CtaBlock formName="rechnik" />
    </>
  );
}

export function GlossaryTermPage({ slug }: { slug: string }) {
  const page = getGlossaryPage(slug);
  const term = getTerm(slug);
  if (!page || !term) return null;

  const related = [
    ...page.related.map(relatedLink).filter((link): link is { label: string; href: string } => Boolean(link)),
    ...(page.extraLinks ?? []),
  ];

  return (
    <>
      <GlossaryHeader
        trail={[HOME, HUB, { name: term.term, slug: `${GLOSSARY_SLUG}/${slug}` }]}
        title={`${term.term}: какво е`}
        lede={term.definition}
      >
        {term.synonyms?.length ? <p className="mt-3 text-sm text-graphite-500">Още: {term.synonyms.join(', ')}</p> : null}
      </GlossaryHeader>

      <Section tone="white">
        <div className="prose-roof [&>h2:first-child]:mt-0">
          {page.sections.map((section) => (
            <Fragment key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </Fragment>
          ))}
        </div>
      </Section>

      <Section tone="sand" tight>
        <h2 className="font-display text-xl font-extrabold text-graphite-900">Свързани термини</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {related.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className="inline-flex items-center border border-graphite-200 bg-white px-3 py-2 font-display text-sm font-bold text-graphite-800 hover:border-graphite-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {page.service.href ? (
          <div className="mt-8 border-l-[3px] border-brick-500 bg-white px-6 py-5">
            <p className="eyebrow">Свързана услуга</p>
            <Link to={page.service.href} className="font-display text-lg font-extrabold text-graphite-900 hover:text-brick-700">
              {page.service.name} →
            </Link>
          </div>
        ) : null}

        <p className="mt-6">
          <Link to={GLOSSARY_SLUG} className="font-display text-sm font-bold text-brick-700 hover:text-brick-800">
            ← Всички термини в речника
          </Link>
        </p>
      </Section>

      <CtaBlock formName={`rechnik-${slug}`} />
    </>
  );
}
