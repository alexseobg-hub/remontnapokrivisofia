import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  serviceHubs, childrenOf, districts, projects, projectsInDistrict, projectsForService,
  testimonials, pagesOfType, pages, priceCategories, type ContentPage,
} from '@/lib/content';
import { site, has, telHref, valueOr } from '@/config/site';
import { PricingTable, PriceDisclaimer } from './PricingTable';
import { ProjectCard, PageCard, PostCard } from './cards';
import { TestimonialCarousel } from './TestimonialCarousel';
import { RoofCalculator } from './RoofCalculator';
import { LeadForm } from './LeadForm';
import { CtaLink, Picture, type Tone } from './ui';
import { stockImage } from '@/lib/stock';
import { trackPhoneClick } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/* ================= Разбиване на HTML-а ================= */

interface Chunk {
  kind: 'html' | 'widget';
  html?: string;
  name?: string;
  arg?: string;
  /** Списъкът веднага след маркера, ако компонентът го поглъща. */
  list?: string[];
}

interface Band {
  id: string;
  tone: Tone;
  chunks: Chunk[];
}

const WIDGET = /<div data-widget="([a-z-]+)"(?: data-arg="([^"]*)")?><\/div>/g;
const LIST_EATERS = new Set(['proces', 'karti', 'stapki']);

/** Изважда елементите на първия списък в парчето и връща остатъка. */
function eatList(html: string): { items: string[]; rest: string } {
  const match = html.match(/^\s*<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/);
  if (!match) return { items: [], rest: html };
  const items = [...match[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
  return { items, rest: html.slice(match[0].length) };
}

function toChunks(html: string): Chunk[] {
  const chunks: Chunk[] = [];
  let last = 0;
  WIDGET.lastIndex = 0;

  for (const match of html.matchAll(WIDGET)) {
    const before = html.slice(last, match.index);
    if (before.trim()) chunks.push({ kind: 'html', html: before });
    chunks.push({ kind: 'widget', name: match[1], arg: match[2] || '' });
    last = (match.index ?? 0) + match[0].length;
  }
  const tail = html.slice(last);
  if (tail.trim()) chunks.push({ kind: 'html', html: tail });

  // Компонентите, които рисуват списък, го вземат от следващото парче.
  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const next = chunks[i + 1];
    if (chunk.kind === 'widget' && LIST_EATERS.has(chunk.name ?? '') && next?.kind === 'html') {
      const { items, rest } = eatList(next.html ?? '');
      if (items.length > 0) {
        chunk.list = items;
        next.html = rest;
        if (!rest.trim()) chunks.splice(i + 1, 1);
      }
    }
  }

  return chunks;
}

const TONE_MARKER = /<div data-widget="ton" data-arg="([a-z]+)"><\/div>/;

/**
 * Всяко H2 отваря нова лента. Тоновете се редуват, за да не стоят две еднакви
 * една до друга — иначе страницата изглежда като недовършен документ.
 */
function toBands(html: string, startTone: Tone): Band[] {
  const parts = html.split(/(?=<h2 id=")/);
  const bands: Band[] = [];
  const cycle: Tone[] = startTone === 'sand' ? ['sand', 'white'] : ['white', 'sand'];

  parts.filter((part) => part.trim()).forEach((part, index) => {
    const id = part.match(/^<h2 id="([^"]+)"/)?.[1] ?? `section-${index}`;
    const forced = part.match(TONE_MARKER)?.[1] as Tone | undefined;
    const clean = part.replace(TONE_MARKER, '');
    bands.push({
      id,
      tone: forced && ['white', 'sand', 'dark'].includes(forced) ? forced : cycle[index % 2],
      chunks: toChunks(clean),
    });
  });

  return bands;
}

/* ================= Компонентите ================= */

function Grid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        'my-8 grid gap-4 sm:grid-cols-2',
        cols === 3 && 'lg:grid-cols-3',
        cols === 4 && 'lg:grid-cols-4',
      )}
    >
      {children}
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="my-6 border border-dashed border-graphite-300 bg-sand-50 px-5 py-5 text-graphite-600">{children}</p>
  );
}

/** Номерирани стъпки. Числото е едро и тухлено — то носи ритъма на блока. */
function Steps({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ol className={cn('my-8 grid', CELL_GRID, cellColumns(items.length, 5))}>
      {items.map((item, index) => (
        <li key={index} className={cn(CELL, 'p-5')}>
          <span className="font-display text-3xl font-extrabold leading-none text-brick-500">
            {String(index + 1).padStart(2, '0')}
          </span>
          <p
            className="mt-3 text-[0.9375rem] leading-relaxed text-graphite-700 [&_strong]:block [&_strong]:font-display [&_strong]:text-graphite-900"
            dangerouslySetInnerHTML={{ __html: item }}
          />
        </li>
      ))}
    </ol>
  );
}

/** Списък, превърнат в мрежа от карти. Ползва се за симптомите и за кратките списъци. */
function ListCards({ items }: { items: string[] }) {
  return (
    <div className="my-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <div key={index} className="card card-topline">
          <p
            className="text-[0.9375rem] leading-relaxed text-graphite-700 [&_strong]:mb-1.5 [&_strong]:block [&_strong]:font-display [&_strong]:text-[1.0625rem] [&_strong]:text-graphite-900"
            dangerouslySetInnerHTML={{ __html: item }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Решетката се рисува с рамки по самите клетки, а не с фон под тях. Фонът
 * оцветяваше и празните места на последния ред — оттам идваха сивите блокове.
 * Горният и левият ръб стоят на контейнера, останалите — на всяка клетка.
 */
const CELL_GRID = 'border-t border-l border-graphite-200';
const CELL = 'border-b border-r border-graphite-200 bg-white';

const cellColumns = (count: number, max = 4) => {
  const cols = Math.min(count, max);
  if (cols <= 1) return '';
  if (cols === 2) return 'sm:grid-cols-2';
  if (cols === 3) return 'sm:grid-cols-2 lg:grid-cols-3';
  if (cols === 4) return 'sm:grid-cols-2 lg:grid-cols-4';
  return 'sm:grid-cols-2 lg:grid-cols-5';
};

function ContactFacts() {
  const filled = (['phonePrimary', 'email', 'workingHours', 'streetAddress'] as const).filter((key) => has(key)).length;
  if (filled === 0) return null;

  return (
    <dl className={cn('my-8 grid', CELL_GRID, cellColumns(filled))}>
      {has('phonePrimary') ? (
        <div className={cn(CELL, 'p-5')}>
          <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">Телефон</dt>
          <dd className="mt-1">
            <a
              href={telHref()}
              onClick={() => trackPhoneClick('kontakti')}
              className="font-display text-2xl font-extrabold text-graphite-900 hover:text-brick-600"
            >
              {site.phonePrimary}
            </a>
          </dd>
        </div>
      ) : null}
      {has('email') ? (
        <div className={cn(CELL, 'p-5')}>
          <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">Имейл</dt>
          <dd className="mt-1">
            <a href={`mailto:${site.email}`} className="text-graphite-800 hover:text-brick-600">
              {site.email}
            </a>
          </dd>
        </div>
      ) : null}
      {has('workingHours') ? (
        <div className={cn(CELL, 'p-5')}>
          <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">Работно време</dt>
          <dd className="mt-1 text-graphite-800">{site.workingHours}</dd>
        </div>
      ) : null}
      {has('streetAddress') ? (
        <div className={cn(CELL, 'p-5')}>
          <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">Адрес</dt>
          <dd className="mt-1 text-graphite-800">
            {site.streetAddress}, {has('postalCode') ? `${site.postalCode} ` : ''}София
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function MapEmbed() {
  if (!has('mapEmbed')) return null;
  return (
    <div className="my-8 aspect-[16/9] w-full border border-graphite-200">
      <iframe
        src={site.mapEmbed}
        title="Къде се намираме"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full"
      />
    </div>
  );
}

function renderWidget(chunk: Chunk, page: ContentPage): ReactNode {
  const arg = chunk.arg ?? '';

  switch (chunk.name) {
    case 'uslugi': {
      const items = arg ? childrenOf(arg.startsWith('/') ? arg : `/${arg}`) : serviceHubs();
      if (items.length === 0) return null;
      return (
        <Grid cols={items.length > 6 ? 4 : 3}>
          {items.map((item) => (
            <PageCard key={item.slug} page={item} topline />
          ))}
        </Grid>
      );
    }

    case 'ceni': {
      /*
       * Категория или списък от ключове. Преди се решаваше по това дали има
       * интервал, затова „Ремонт“ и „Улуци“ се търсеха като ключове и таблицата
       * излизаше празна. Сега първо се пита самият ценоразпис какви категории има.
       */
      const parts = arg.split(',').map((part) => part.trim()).filter(Boolean);
      const category = parts.length === 1 && priceCategories().includes(parts[0]) ? parts[0] : undefined;

      return (
        <div className="my-8">
          {category ? (
            <PricingTable category={category} />
          ) : parts.length > 0 ? (
            <PricingTable keys={parts} />
          ) : (
            <PricingTable grouped />
          )}
          <PriceDisclaimer />
        </div>
      );
    }

    case 'proekti': {
      let items = projects;
      if (arg) {
        const byDistrict = projectsInDistrict(arg);
        items = byDistrict.length > 0 ? byDistrict : projectsForService(arg);
      }
      if (items.length === 0) {
        return (
          <EmptyNote>
            Снимките от последните обекти се подготвят. Ако искате да видите наши покриви на живо, кажете при
            обаждането и ще Ви насочим към адрес в квартала.
          </EmptyNote>
        );
      }
      return (
        <>
          <Grid>
            {items.slice(0, 6).map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </Grid>
          {items.length > 6 ? (
            <CtaLink to="/proekti" variant="ghost">
              Всички обекти
            </CtaLink>
          ) : null}
        </>
      );
    }

    case 'rayoni': {
      // София води списъка и сочи към началната страница — тя носи столицата.
      const items = [{ slug: '/', name: 'София' }, ...districts()];
      if (items.length === 1) return null;
      return (
        <ul className={cn('my-8 grid', CELL_GRID, cellColumns(items.length))}>
          {items.map((item) => (
            <li key={item.slug} className={CELL}>
              <Link
                to={item.slug}
                className="block px-5 py-4 font-display text-[0.9375rem] font-bold text-graphite-900 hover:bg-sand-100 hover:text-brick-700"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      );
    }

    case 'karta-na-sayta': {
      // Карта за хора, не за машини. XML картата остава само за търсачките и
      // никъде в сайта не се сочи към нея.
      const groups: { title: string; items: { slug: string; name: string }[] }[] = [
        { title: 'Основни', items: pages.filter((p) => ['Home', 'Page', 'Pricing'].includes(p.type) && !p.noindex) },
        { title: 'Услуги', items: pages.filter((p) => p.type === 'Service hub' || p.type === 'Service') },
        { title: 'Райони', items: pages.filter((p) => p.type === 'District') },
        { title: 'Блог', items: pages.filter((p) => p.type === 'Blog post' || p.type === 'Author') },
        { title: 'Правни', items: pages.filter((p) => p.type === 'Legal') },
      ].filter((group) => group.items.length > 0);

      return (
        <div className="my-8 grid gap-8 sm:grid-cols-2">
          {groups.map((group) => (
            <section key={group.title}>
              <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">
                {group.title}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <Link to={item.slug} className="text-[0.9375rem] text-graphite-700 hover:text-brick-600">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      );
    }

    case 'otzivi': {
      // Празна база значи скрита секция. Измислени отзиви не се пишат.
      if (testimonials.length === 0) return null;
      return <TestimonialCarousel items={testimonials} />;
    }

    case 'blog': {
      const posts = pagesOfType('Blog post');
      if (posts.length === 0) return null;
      return (
        <Grid>
          {posts.map((post) => (
            <PostCard key={post.slug} page={post} />
          ))}
        </Grid>
      );
    }

    case 'proces':
    case 'stapki':
      return chunk.list?.length ? <Steps items={chunk.list} /> : null;

    case 'karti':
      return chunk.list?.length ? <ListCards items={chunk.list} /> : null;

    case 'trust':
      // Ползите вече стоят на всяка страница над футъра, затова маркерът не
      // рисува втори път същото.
      return null;

    case 'kalkulator':
      return (
        <div className="my-8">
          <RoofCalculator />
        </div>
      );

    case 'forma':
      return (
        <div className="my-8 max-w-2xl border border-graphite-200 bg-white p-6 sm:p-8">
          <LeadForm formName={page.slug} />
        </div>
      );

    case 'kontakti':
      return <ContactFacts />;

    case 'karta':
      return <MapEmbed />;

    case 'snimka': {
      const image = stockImage(arg);
      if (!image) return null;
      return (
        <figure className="my-8">
          <div className="aspect-[16/9] overflow-hidden border border-graphite-200 bg-graphite-800">
            <Picture image={image} sizes="(min-width: 1024px) 900px, 100vw" />
          </div>
        </figure>
      );
    }

    case 'garanciya':
      return has('warrantyScope') ? (
        <div className="my-8 border-l-[3px] border-brick-500 bg-sand-100 px-6 py-5">
          <p className="font-display text-lg font-extrabold text-graphite-900">
            Какво покрива гаранцията{has('warrantyYears') ? ` (${site.warrantyYears} години)` : ''}
          </p>
          <p className="mt-2 leading-relaxed text-graphite-700">{site.warrantyScope}</p>
        </div>
      ) : null;

    default:
      return null;
  }
}

/* ================= Тялото ================= */

function ChunkList({ chunks, page }: { chunks: Chunk[]; page: ContentPage }) {
  return (
    <>
      {chunks.map((chunk, index) =>
        chunk.kind === 'html' ? (
          <div key={index} className="prose-roof" dangerouslySetInnerHTML={{ __html: chunk.html ?? '' }} />
        ) : (
          <div key={index}>{renderWidget(chunk, page)}</div>
        ),
      )}
    </>
  );
}

/**
 * Тонът на секцията веднага след тялото. Без него шаблонът може да сложи
 * втора бяла лента до последната бяла и ритъмът се къса.
 */
export function nextToneAfter(page: ContentPage, startTone: Tone = 'white'): Tone {
  if (!page.html) return startTone;
  const bands = toBands(page.html, startTone);
  const last = bands[bands.length - 1];
  if (!last) return startTone;
  return last.tone === 'sand' ? 'white' : 'sand';
}

/** Обратният тон, за да се редуват и следващите секции. */
export const flipTone = (tone: Tone): Tone => (tone === 'sand' ? 'white' : 'sand');

/** Тяло без ленти — за къси страници като правните. */
export function PlainBody({ page }: { page: ContentPage }) {
  if (!page.html) return null;
  return <ChunkList chunks={toChunks(page.html)} page={page} />;
}

/** Тяло, разбито на редуващи се ленти по H2. */
export function BandedBody({ page, startTone = 'white' }: { page: ContentPage; startTone?: Tone }) {
  if (!page.html) return null;
  const bands = toBands(page.html, startTone);

  return (
    <>
      {bands.map((band) => (
        <section
          key={band.id}
          className={cn(
            'band',
            band.tone === 'dark' ? 'band-dark' : band.tone === 'sand' ? 'band-sand' : 'band-white',
          )}
        >
          <div className="shell">
            <ChunkList chunks={band.chunks} page={page} />
          </div>
        </section>
      ))}
    </>
  );
}

export { valueOr };
