import { Link } from 'react-router-dom';
import {
  type ContentPage, type Project,
  ancestorsOf, siblingServices, neighbourDistricts, projectsInDistrict,
  childrenOf, blogPosts, readingMinutes, formatDate, getPage,
} from '@/lib/content';
import { site, has, telHref, valueOr, absoluteUrl } from '@/config/site';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { FaqAccordion } from '@/components/FaqAccordion';
import { BandedBody, PlainBody } from '@/components/PageBody';
import { CtaBlock } from '@/components/CtaBlock';
import { AuthorBox, PageCard, ProjectCard } from '@/components/cards';
import { CtaLink, ImagePlaceholder, Picture, Section, SectionHead } from '@/components/ui';
import { LeadForm } from '@/components/LeadForm';
import { trackPhoneClick } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/* ================= Общи части ================= */

function trailFor(page: ContentPage): Crumb[] {
  const home: Crumb = { name: 'Начало', slug: '/' };
  const chain = ancestorsOf(page.slug).map((item) => ({ name: item.name, slug: item.slug }));
  const first = chain[0]?.slug === '/' ? chain.slice(1) : chain;
  return [home, ...first, { name: page.name, slug: page.slug }];
}

/** Прекият отговор под H1. Първите изречения, които AI търсачките цитират. */
function ShortAnswer({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className="mt-6 max-w-prose border-l-[3px] border-brick-500 bg-sand-100 py-4 pl-5 pr-4 text-[1.0625rem] leading-relaxed text-graphite-800">
      {text}
    </p>
  );
}

function PhoneCta({ placement, onDark = false }: { placement: string; onDark?: boolean }) {
  if (!has('phonePrimary')) return null;
  return (
    <CtaLink href={telHref()} variant={onDark ? 'onDark' : 'ghost'} large onClick={() => trackPhoneClick(placement)}>
      {site.phonePrimary}
    </CtaLink>
  );
}

function PageHeader({ page, tone = 'sand' }: { page: ContentPage; tone?: 'sand' | 'white' }) {
  return (
    <header className={cn('border-b border-graphite-200 py-10 md:py-14', tone === 'sand' ? 'bg-sand-100' : 'bg-white')}>
      <div className="shell">
        <Breadcrumbs trail={trailFor(page)} />
        <h1 className="text-display-lg">{page.h1}</h1>
        {page.description ? <p className="lede mt-4">{page.description}</p> : null}
        <ShortAnswer text={page.shortAnswer} />
        <div className="mt-8 flex flex-wrap gap-3">
          <CtaLink to="/besplaten-ogled" large>
            Безплатен оглед
          </CtaLink>
          <PhoneCta placement={page.slug} />
        </div>
      </div>
    </header>
  );
}

function FaqSection({ page }: { page: ContentPage }) {
  if (page.faq.length === 0) return null;
  return (
    <Section tone="white" id="chesto-zadavani-vaprosi">
      <SectionHead eyebrow="Въпроси" title="Често задавани въпроси" />
      <div className="max-w-3xl">
        <FaqAccordion items={page.faq} />
      </div>
    </Section>
  );
}

function RelatedLinks({ title, pages }: { title: string; pages: ContentPage[] }) {
  if (pages.length === 0) return null;
  return (
    <Section tone="sand" tight>
      <h2 className="mb-6 font-display text-xl font-extrabold text-graphite-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <PageCard key={page.slug} page={page} />
        ))}
      </div>
    </Section>
  );
}

/* ================= Начална ================= */

export function HomePage({ page }: { page: ContentPage }) {
  return (
    <>
      <section className="relative overflow-hidden bg-graphite-900">
        <div className="absolute inset-0" aria-hidden="true">
          <ImagePlaceholder className="h-full w-full opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-graphite-950 via-graphite-950/90 to-graphite-950/40" />
        </div>

        <div className="shell relative py-16 md:py-24 lg:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow text-brick-300">София и София област</p>
            <h1 className="text-display-xl text-white">{page.h1}</h1>
            {page.description ? (
              <p className="mt-6 max-w-xl text-lg leading-[1.6] text-graphite-200 md:text-xl">{page.description}</p>
            ) : null}

            <div className="mt-9 flex flex-wrap gap-3">
              {has('phonePrimary') ? (
                <CtaLink href={telHref()} large onClick={() => trackPhoneClick('hero')}>
                  Обадете се: {site.phonePrimary}
                </CtaLink>
              ) : null}
              <CtaLink to="/besplaten-ogled" variant="onDark" large>
                Безплатен оглед
              </CtaLink>
            </div>

            {page.shortAnswer ? (
              <p className="mt-10 max-w-xl border-l-[3px] border-brick-500 py-1 pl-5 text-[1.0625rem] leading-relaxed text-graphite-300">
                {page.shortAnswer}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <BandedBody page={page} startTone="white" />
      <FaqSection page={page} />
      <CtaBlock formName="home" />
    </>
  );
}

/* ================= Услуги ================= */

export function ServicePage({ page }: { page: ContentPage }) {
  const children = childrenOf(page.slug);
  const siblings = siblingServices(page, 3);

  return (
    <>
      <PageHeader page={page} />
      <BandedBody page={page} startTone="white" />
      {children.length > 0 ? <RelatedLinks title="Подробно по дейности" pages={children} /> : null}
      <FaqSection page={page} />
      {siblings.length > 0 ? <RelatedLinks title="Свързани услуги" pages={siblings} /> : null}
      <CtaBlock title={`Нуждаете се от ${page.name.toLowerCase()}?`} formName={page.slug} />
    </>
  );
}

/* ================= Квартал ================= */

export function DistrictPage({ page }: { page: ContentPage }) {
  const districtName = page.district || page.name;
  const nearby = neighbourDistricts(page.slug, 3);
  const built = projectsInDistrict(districtName);

  return (
    <>
      <PageHeader page={page} />
      <BandedBody page={page} startTone="white" />

      {built.length > 0 ? (
        <Section tone="sand">
          <SectionHead eyebrow="От практиката" title={`Наши обекти в ${districtName}`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {built.slice(0, 3).map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </Section>
      ) : null}

      <FaqSection page={page} />

      <Section tone="sand" tight>
        <h2 className="mb-6 font-display text-xl font-extrabold text-graphite-900">Работим и в съседните райони</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nearby.map((item) => (
            <PageCard key={item.slug} page={item} />
          ))}
        </div>
        <p className="mt-6 text-graphite-600">
          Вижте{' '}
          <Link to="/rayoni" className="font-medium text-brick-700 underline underline-offset-4">
            цялото покритие
          </Link>{' '}
          или се върнете към{' '}
          <Link to="/" className="font-medium text-brick-700 underline underline-offset-4">
            ремонт на покриви в София
          </Link>
          .
        </p>
      </Section>

      <CtaBlock title={`Ремонт на покрив в ${districtName}?`} formName={page.slug} prefill={{ district: districtName }} />
    </>
  );
}

/* ================= Обекти ================= */

function Fact({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="bg-white p-5">
      <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">{label}</dt>
      <dd className="mt-1 text-graphite-900">{value}</dd>
    </div>
  );
}

export function ProjectPage({ project }: { project: Project }) {
  const trail: Crumb[] = [
    { name: 'Начало', slug: '/' },
    { name: 'Проекти', slug: '/proekti' },
    { name: project.title, slug: project.slug },
  ];
  const districtPage = project.district
    ? getPage(`/rayoni/${project.district.toLowerCase()}`) ??
      neighbourDistricts('/rayoni', 40).find((page) => (page.district || page.name) === project.district)
    : undefined;

  return (
    <>
      <header className="border-b border-graphite-200 bg-sand-100 py-10 md:py-14">
        <div className="shell">
          <Breadcrumbs trail={trail} />
          <h1 className="text-display-lg">{project.title}</h1>
        </div>
      </header>

      <Section tone="white">
        <div className="grid gap-6 lg:grid-cols-2">
          <figure>
            <figcaption className="mb-2 font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">
              Преди
            </figcaption>
            <div className="aspect-[4/3] overflow-hidden border border-graphite-200 bg-graphite-800">
              {project.imageBefore ? (
                <Picture image={project.imageBefore} alt={`${project.title} — преди ремонта`} eager />
              ) : (
                <ImagePlaceholder label="Няма снимка преди" className="h-full w-full" />
              )}
            </div>
          </figure>
          <figure>
            <figcaption className="mb-2 font-display text-xs font-bold uppercase tracking-[0.16em] text-brick-600">
              След
            </figcaption>
            <div className="aspect-[4/3] overflow-hidden border border-graphite-200 bg-graphite-800">
              {project.imageAfter ? (
                <Picture image={project.imageAfter} alt={`${project.title} — след ремонта`} eager />
              ) : (
                <ImagePlaceholder label="Няма снимка след" className="h-full w-full" />
              )}
            </div>
          </figure>
        </div>

        <dl className="mt-10 grid gap-px border border-graphite-200 bg-graphite-200 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Квартал" value={project.district} />
          <Fact label="Тип сграда" value={project.buildingType} />
          <Fact label="Площ" value={project.area ? `${project.area} м²` : ''} />
          <Fact label="Дейности" value={project.services.join(', ') || project.works} />
          <Fact label="Материали" value={project.materials} />
          <Fact label="Срок" value={project.duration} />
          <Fact label="Ценови диапазон" value={project.priceRange} />
          <Fact label="Изпълнен" value={formatDate(project.date)} />
        </dl>

        {project.description ? (
          <div className="prose-roof mt-10">
            <h2>Какъв беше проблемът</h2>
            <p>{project.description}</p>
          </div>
        ) : null}

        {project.gallery.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.gallery.map((image, index) => (
              <div key={index} className="aspect-[4/3] overflow-hidden border border-graphite-200">
                <Picture image={image} alt={`${project.title} — снимка ${index + 1}`} />
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-10 text-graphite-600">
          {districtPage ? (
            <>
              Вижте какво още правим в{' '}
              <Link to={districtPage.slug} className="font-medium text-brick-700 underline underline-offset-4">
                {districtPage.name}
              </Link>
              , или разгледайте{' '}
            </>
          ) : (
            'Разгледайте '
          )}
          <Link to="/" className="font-medium text-brick-700 underline underline-offset-4">
            ремонт на покриви в София
          </Link>
          .
        </p>
      </Section>

      <CtaBlock title="Имате подобен проблем?" formName="proekt" prefill={{ district: project.district }} />
    </>
  );
}

/* ================= Блог ================= */

export function BlogPost({ page }: { page: ContentPage }) {
  const minutes = readingMinutes(page.wordCount);

  return (
    <>
      <header className="border-b border-graphite-200 bg-sand-100 py-10 md:py-14">
        <div className="shell-narrow">
          <Breadcrumbs trail={[{ name: 'Начало', slug: '/' }, { name: 'Блог', slug: '/blog' }, { name: page.name, slug: page.slug }]} />
          <h1 className="text-display-lg">{page.h1}</h1>
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.875rem] text-graphite-500">
            <span>{site.authorName}</span>
            {page.publishDate ? <span>· {formatDate(page.publishDate)}</span> : null}
            {page.updated && page.updated !== page.publishDate ? (
              <span>· обновена {formatDate(page.updated)}</span>
            ) : null}
            <span>· {minutes} мин. четене</span>
          </p>
        </div>
      </header>

      <div className="band-white band">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <article className="min-w-0">
            <PlainBody page={page} />
            {page.faq.length > 0 ? (
              <div className="mt-14">
                <h2 className="mb-6 text-display-md">Често задавани въпроси</h2>
                <FaqAccordion items={page.faq} />
              </div>
            ) : null}
            <div className="mt-14">
              <AuthorBox />
            </div>
          </article>

          {page.toc.length > 2 ? (
            <aside className="order-first lg:order-last">
              <nav aria-label="Съдържание" className="lg:sticky lg:top-24">
                <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">
                  Съдържание
                </p>
                <ol className="space-y-2 border-l border-graphite-200 pl-4 text-[0.875rem]">
                  {page.toc.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="text-graphite-600 hover:text-brick-600">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          ) : null}
        </div>
      </div>

      <CtaBlock title="Строите или ремонтирате покрив?" formName="blog" />
    </>
  );
}

export function AuthorPage({ page }: { page: ContentPage }) {
  const posts = blogPosts();
  return (
    <>
      <PageHeader page={page} />
      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <div className="aspect-square w-full max-w-[14rem] overflow-hidden bg-graphite-800">
            {has('authorPhoto') ? (
              <img src={site.authorPhoto} alt={site.authorName} className="h-full w-full object-cover" width={224} height={224} />
            ) : (
              <ImagePlaceholder className="h-full w-full" />
            )}
          </div>
          <div>
            <PlainBody page={page} />
            {posts.length > 0 ? (
              <div className="mt-10">
                <h2 className="mb-5 font-display text-xl font-extrabold text-graphite-900">Публикации</h2>
                <ul className="space-y-3">
                  {posts.map((post) => (
                    <li key={post.slug}>
                      <Link to={post.slug} className="font-display font-bold text-graphite-900 hover:text-brick-600">
                        {post.name}
                      </Link>
                      {post.publishDate ? (
                        <span className="ml-2 text-[0.8125rem] text-graphite-500">{formatDate(post.publishDate)}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </Section>
      <CtaBlock formName="avtor" />
    </>
  );
}

/* ================= Общи ================= */

export function StandardPage({ page }: { page: ContentPage }) {
  return (
    <>
      <PageHeader page={page} />
      <BandedBody page={page} startTone="white" />
      <FaqSection page={page} />
      <CtaBlock formName={page.slug} />
    </>
  );
}

/** Правните страници: тесен текст, без CTA ленти и без шум. */
export function LegalPage({ page }: { page: ContentPage }) {
  return (
    <>
      <header className="border-b border-graphite-200 bg-sand-100 py-10">
        <div className="shell-narrow">
          <Breadcrumbs trail={trailFor(page)} />
          <h1 className="text-display-md">{page.h1}</h1>
          {page.updated ? (
            <p className="mt-3 text-sm text-graphite-500">Последна редакция: {formatDate(page.updated)}</p>
          ) : null}
        </div>
      </header>
      <div className="band-white band">
        <div className="shell-narrow">
          <PlainBody page={page} />
        </div>
      </div>
    </>
  );
}

/** Конверсионните страници: формата стои горе, отдясно на текста. */
export function LeadPage({ page }: { page: ContentPage }) {
  return (
    <>
      <div className="border-b border-graphite-200 bg-sand-100 py-10 md:py-14">
        <div className="shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16">
          <div>
            <Breadcrumbs trail={trailFor(page)} />
            <h1 className="text-display-lg">{page.h1}</h1>
            {page.description ? <p className="lede mt-4">{page.description}</p> : null}
            <ShortAnswer text={page.shortAnswer} />
            {has('phonePrimary') ? (
              <p className="mt-8 text-graphite-700">
                Предпочитате да говорите?{' '}
                <a
                  href={telHref()}
                  onClick={() => trackPhoneClick(page.slug)}
                  className="font-display text-xl font-extrabold text-graphite-900 hover:text-brick-600"
                >
                  {site.phonePrimary}
                </a>
              </p>
            ) : null}
          </div>
          <div className="border border-graphite-200 bg-white p-6 sm:p-8">
            <h2 className="mb-5 font-display text-xl font-extrabold text-graphite-900">Заявете оглед</h2>
            <LeadForm formName={page.slug} />
          </div>
        </div>
      </div>
      <BandedBody page={page} startTone="white" />
      <FaqSection page={page} />
    </>
  );
}

export function NotFoundPage() {
  return (
    <Section tone="white">
      <p className="eyebrow">Грешка 404</p>
      <h1 className="text-display-lg">Такава страница няма</h1>
      <p className="lede mt-4">
        Адресът е сгрешен или страницата е преместена. Оттук стигате навсякъде.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: '/', label: 'Ремонт на покриви София', note: 'Начална страница' },
          { to: '/uslugi', label: 'Услуги', note: 'Какво извършваме' },
          { to: '/ceni', label: 'Цени', note: 'Ориентировъчен ценоразпис' },
          { to: '/proekti', label: 'Проекти', note: 'Реализирани обекти' },
          { to: '/rayoni', label: 'Райони', note: 'Къде работим' },
          { to: '/kontakti', label: 'Контакти', note: 'Телефон и адрес' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="card-link card-topline group">
            <p className="font-display text-lg font-extrabold text-graphite-900 group-hover:text-brick-700">
              {item.label}
            </p>
            <p className="mt-1 text-[0.9375rem] text-graphite-600">{item.note}</p>
          </Link>
        ))}
      </div>
      <div className="mt-10">
        <CtaLink to="/besplaten-ogled" large>
          Безплатен оглед
        </CtaLink>
      </div>
    </Section>
  );
}

export { absoluteUrl, valueOr };
