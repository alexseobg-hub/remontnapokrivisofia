import { Link } from 'react-router-dom';
import {
  type ContentPage, type Project,
  ancestorsOf, siblingServices, neighbourDistricts, projectsInDistrict,
  childrenOf, blogPosts, authorPage, readingMinutes, formatDate, getPage, testimonials,
} from '@/lib/content';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import { Benefits } from '@/components/Benefits';
import { site, has, telHref, value, valueOr, absoluteUrl } from '@/config/site';
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs';
import { FaqAccordion } from '@/components/FaqAccordion';
import { BandedBody, PlainBody, nextToneAfter, flipTone } from '@/components/PageBody';
import { CtaBlock } from '@/components/CtaBlock';
import { AuthorBox, PageCard, ProjectCard } from '@/components/cards';
import { CtaLink, ImagePlaceholder, PhoneButton, Picture, Section, SectionHead, type Tone } from '@/components/ui';
import { LeadForm } from '@/components/LeadForm';
import { trackPhoneClick } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { heroFor } from '@/lib/stock';

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
      ☎ {site.phonePrimary}
    </CtaLink>
  );
}

/** Разделителят и бутонът за обаждане, които вървят точно под формата. */
function PhoneUnderForm({ placement, onDark = false }: { placement: string; onDark?: boolean }) {
  return (
    <div className={cn('mt-5 border-t pt-5', onDark ? 'border-graphite-700' : 'border-graphite-200')}>
      <p className={cn('mb-3 text-center text-[0.8125rem]', onDark ? 'text-graphite-400' : 'text-graphite-500')}>
        Или се обадете направо
      </p>
      <PhoneButton
        phone={value('phonePrimary')}
        href={telHref()}
        onClick={() => trackPhoneClick(placement)}
      />
    </div>
  );
}

/**
 * Тънък ред с доверие точно под H1. Конкурентите го показват веднага, преди
 * посетителят да е стигнал до текста — тук е автоматичен, не изисква ръчен
 * маркер в Notion, за да се вижда на всяка money страница.
 */
function TrustStrip({ onDark = false }: { onDark?: boolean }) {
  const items = [
    has('yearsExperience') ? `${site.yearsExperience} години опит` : '',
    has('warrantyYears') ? `Гаранция до ${site.warrantyYears} години` : '',
    'Безплатен оглед на място',
    has('responseTime') ? `Отговор ${site.responseTime}` : '',
  ].filter(Boolean);
  if (items.length === 0) return null;

  return (
    <ul
      className={cn(
        'mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t pt-5 text-[0.8125rem] font-medium',
        onDark ? 'border-graphite-700 text-graphite-300' : 'border-graphite-200 text-graphite-600',
      )}
    >
      {items.map((item) => (
        <li key={item} className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" className={cn('h-3.5 w-3.5 shrink-0', onDark ? 'text-brick-300' : 'text-brick-600')} aria-hidden="true">
            <path d="M2 8.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
          </svg>
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Заглавната част на всяка money страница: H1 и уводен текст отляво,
 * компактна форма за запитване с бутон за изпращане отдясно, телефонът стои
 * под текста. Формата се вижда без скрол на десктоп; на мобилно идва веднага
 * след бутоните, преди останалото съдържание.
 */
function PageHeader({ page }: { page: ContentPage }) {
  const image = heroFor(page);
  // Услугите винаги носят заглавна снимка. Докато няма истинска, стои графичният
  // блок — същият, който пази началната страница от празно място.
  const wantsHero = page.type === 'Service' || page.type === 'Service hub';

  if (image || wantsHero) {
    return (
      <>
      <header className="relative overflow-hidden bg-graphite-900">
        <div className="absolute inset-0" aria-hidden="true">
          {image ? (
            <Picture image={image} sizes="100vw" eager className="opacity-35" />
          ) : (
            <ImagePlaceholder className="h-full w-full opacity-35" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-graphite-950 via-graphite-950/92 to-graphite-950/70" />
        </div>
        <div className="shell relative grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
          <div>
            <Breadcrumbs trail={trailFor(page)} onDark />
            <h1 className="text-display-lg text-white">{page.h1}</h1>
            {page.description ? <p className="mt-4 max-w-prose text-lg leading-[1.6] text-graphite-200">{page.description}</p> : null}
            {page.shortAnswer ? (
              <p className="mt-6 max-w-prose border-l-[3px] border-brick-500 py-1 pl-5 text-[1.0625rem] leading-relaxed text-graphite-300">
                {page.shortAnswer}
              </p>
            ) : null}
            <TrustStrip onDark />
          </div>
          <div className="border border-graphite-700 bg-graphite-800 p-6 sm:p-7 lg:self-start">
            <h2 className="mb-4 font-display text-lg font-extrabold text-white">Заявете безплатен оглед</h2>
            <LeadForm onDark compact formName={page.slug} />
            <PhoneUnderForm placement={page.slug} onDark />
          </div>
        </div>
        </header>
        <Benefits />
      </>
    );
  }

  return (
    <>
      <header className="border-b border-graphite-200 bg-sand-100 py-10 md:py-14">
        <div className="shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
          <div>
            <Breadcrumbs trail={trailFor(page)} />
            <h1 className="text-display-lg">{page.h1}</h1>
            {page.description ? <p className="lede mt-4">{page.description}</p> : null}
            <ShortAnswer text={page.shortAnswer} />
            <TrustStrip />
          </div>
          <div className="border border-graphite-200 bg-white p-6 sm:p-7 lg:self-start">
            <h2 className="mb-4 font-display text-lg font-extrabold text-graphite-900">Заявете безплатен оглед</h2>
            <LeadForm compact formName={page.slug} />
            <PhoneUnderForm placement={page.slug} />
          </div>
        </div>
      </header>
      <Benefits />
    </>
  );
}

/**
 * Тънка тъмна лента, повтаряща поканата за действие между секциите на
 * дълга страница. Конкурентите не чакат до края — искат телефона на всеки
 * екран-два, не само горе и долу.
 */
function MidPageCta({ placement, text = 'Готови сте за оглед?' }: { placement: string; text?: string }) {
  return (
    <div className="band-dark band-tight">
      <div className="shell flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-display text-lg font-extrabold text-white sm:text-xl">{text}</p>
          <p className="mt-1 text-graphite-300">Безплатен, на място, без ангажимент.</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-center gap-3">
          <PhoneCta placement={`${placement}-mid`} onDark />
          <CtaLink to="/besplaten-ogled" large>
            Безплатен оглед
          </CtaLink>
        </div>
      </div>
    </div>
  );
}

/**
 * Отзивите на всяка страница с услуга. Не иска маркер в Notion — щом базата има
 * редове, секцията излиза сама. Празна база значи, че тук няма нищо.
 */
function TestimonialSection({ tone = 'sand' }: { tone?: Tone }) {
  if (testimonials.length === 0) return null;
  return (
    <Section tone={tone}>
      <SectionHead eyebrow="Отзиви" title="Какво казват клиентите ни" />
      <TestimonialCarousel items={testimonials} />
    </Section>
  );
}

function FaqSection({ page, tone = 'white' }: { page: ContentPage; tone?: Tone }) {
  if (page.faq.length === 0) return null;
  return (
    <Section tone={tone} id="chesto-zadavani-vaprosi">
      <SectionHead eyebrow="Въпроси" title="Често задавани въпроси" />
      <div className="max-w-3xl">
        <FaqAccordion items={page.faq} />
      </div>
    </Section>
  );
}

function RelatedLinks({ title, pages, tone = 'sand' }: { title: string; pages: ContentPage[]; tone?: Tone }) {
  if (pages.length === 0) return null;
  return (
    <Section tone={tone} tight>
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
  const heroImage = heroFor(page);

  return (
    <>
      <section className="relative overflow-hidden bg-graphite-900">
        <div className="absolute inset-0" aria-hidden="true">
          {heroImage ? (
            <Picture image={heroImage} sizes="100vw" eager className="opacity-45" />
          ) : (
            <ImagePlaceholder className="h-full w-full opacity-45" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-graphite-950 via-graphite-950/90 to-graphite-950/40" />
        </div>

        <div className="shell relative grid gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-14 lg:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow text-brick-300">София и София област</p>
            <h1 className="text-display-xl text-white">{page.h1}</h1>
            {page.description ? (
              <p className="mt-6 max-w-xl text-lg leading-[1.6] text-graphite-200 md:text-xl">{page.description}</p>
            ) : null}

            {page.shortAnswer ? (
              <p className="mt-8 max-w-xl border-l-[3px] border-brick-500 py-1 pl-5 text-[1.0625rem] leading-relaxed text-graphite-300">
                {page.shortAnswer}
              </p>
            ) : null}

            <TrustStrip onDark />
          </div>

          <div className="border border-graphite-700 bg-graphite-800 p-6 sm:p-7">
            <h2 className="mb-4 font-display text-lg font-extrabold text-white">Заявете безплатен оглед</h2>
            <LeadForm onDark compact formName="home" />
            <PhoneUnderForm placement="hero" onDark />
          </div>
        </div>
      </section>

      <Benefits />
      <BandedBody page={page} startTone="white" />
      <MidPageCta placement="home" />
      <FaqSection page={page} tone={nextToneAfter(page, 'white')} />
      <CtaBlock formName="home" />
    </>
  );
}

/* ================= Услуги ================= */

export function ServicePage({ page }: { page: ContentPage }) {
  const children = childrenOf(page.slug);
  const siblings = siblingServices(page, 3);

  // Тоновете продължават оттам, докъдето е стигнало тялото. Всяка секция, която
  // наистина се рендира, обръща тона за следващата.
  const toneChildren = nextToneAfter(page, 'white');
  const toneReviews = children.length > 0 ? flipTone(toneChildren) : toneChildren;
  const toneFaq = testimonials.length > 0 ? flipTone(toneReviews) : toneReviews;
  const toneSiblings = page.faq.length > 0 ? flipTone(toneFaq) : toneFaq;

  return (
    <>
      <PageHeader page={page} />
      <BandedBody page={page} startTone="white" />
      <MidPageCta placement={page.slug} text={`Нуждаете се от ${page.name.toLowerCase()}?`} />
      {children.length > 0 ? <RelatedLinks title="Подробно по дейности" pages={children} tone={toneChildren} /> : null}
      <TestimonialSection tone={toneReviews} />
      <FaqSection page={page} tone={toneFaq} />
      {siblings.length > 0 ? <RelatedLinks title="Свързани услуги" pages={siblings} tone={toneSiblings} /> : null}
      <CtaBlock title={`Нуждаете се от ${page.name.toLowerCase()}?`} formName={page.slug} />
    </>
  );
}

/* ================= Квартал ================= */

export function DistrictPage({ page }: { page: ContentPage }) {
  const districtName = page.district || page.name;
  const nearby = neighbourDistricts(page.slug, 3);
  const built = projectsInDistrict(districtName);

  const toneA = nextToneAfter(page, 'white');
  const toneB = built.length > 0 ? flipTone(toneA) : toneA;

  return (
    <>
      <PageHeader page={page} />
      <BandedBody page={page} startTone="white" />
      <MidPageCta placement={page.slug} text={`Ремонт на покрив в ${districtName}?`} />

      {built.length > 0 ? (
        <Section tone={toneA}>
          <SectionHead eyebrow="От практиката" title={`Наши обекти в ${districtName}`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {built.slice(0, 3).map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </Section>
      ) : null}

      <FaqSection page={page} tone={toneB} />

      <Section tone={page.faq.length > 0 ? flipTone(toneB) : toneB} tight>
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

/**
 * Клетките рисуват решетката с фон отдолу, затова броят колони следва броя на
 * попълнените факти. Иначе празните места излизат като сиви правоъгълници.
 */
function FactGrid({ facts }: { facts: [string, string][] }) {
  const filled = facts.filter(([, value]) => value);
  if (filled.length === 0) return null;

  const cols =
    filled.length === 1 ? '' : filled.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <dl className={cn('mt-10 grid border-l border-t border-graphite-200', cols)}>
      {filled.map(([label, value]) => (
        <div key={label} className="border-b border-r border-graphite-200 bg-white p-5">
          <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">{label}</dt>
          <dd className="mt-1 text-graphite-900">{value}</dd>
        </div>
      ))}
    </dl>
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
      <Benefits />

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

        <FactGrid
          facts={[
            ['Квартал', project.district],
            ['Тип сграда', project.buildingType],
            ['Площ', project.area ? `${project.area} м²` : ''],
            ['Дейности', project.services.join(', ') || project.works],
            ['Материали', project.materials],
            ['Срок', project.duration],
            ['Ценови диапазон', project.priceRange],
            ['Изпълнен', formatDate(project.date)],
          ]}
        />

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
  const author = authorPage();
  const authorName = valueOr('authorName', author?.name ?? '');
  const cover = heroFor(page);

  return (
    <>
      <header className="border-b border-graphite-200 bg-sand-100 py-10 md:py-14">
        <div className="shell-narrow">
          <Breadcrumbs trail={[{ name: 'Начало', slug: '/' }, { name: 'Блог', slug: '/blog' }, { name: page.name, slug: page.slug }]} />
          <h1 className="text-display-lg">{page.h1}</h1>
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.875rem] text-graphite-500">
            {authorName ? (
              author ? (
                <Link to={author.slug} className="font-medium text-graphite-700 hover:text-brick-600">
                  {authorName}
                </Link>
              ) : (
                <span>{authorName}</span>
              )
            ) : null}
            {page.publishDate ? <span>· {formatDate(page.publishDate)}</span> : null}
            {page.updated && page.updated !== page.publishDate ? (
              <span>· обновена {formatDate(page.updated)}</span>
            ) : null}
            <span>· {minutes} мин. четене</span>
          </p>
          {/* Главната снимка на статията. Плейсхолдър, докато няма истинска. */}
          <figure className="mt-8 aspect-[16/9] w-full overflow-hidden border border-graphite-200">
            {cover ? (
              <Picture image={cover} sizes="(min-width: 768px) 48rem, 100vw" eager className="h-full w-full" />
            ) : (
              <ImagePlaceholder label="Снимка към статията" className="h-full w-full" />
            )}
          </figure>
        </div>
      </header>
      <Benefits />

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
              <img src={site.authorPhoto} alt={page.name} className="h-full w-full object-cover" width={224} height={224} />
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
      <MidPageCta placement={page.slug} />
      <FaqSection page={page} tone={nextToneAfter(page, 'white')} />
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
      <Benefits />
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
            <TrustStrip />
          </div>
          <div className="border border-graphite-200 bg-white p-6 sm:p-8">
            <h2 className="mb-5 font-display text-xl font-extrabold text-graphite-900">Заявете оглед</h2>
            <LeadForm formName={page.slug} />
            <PhoneUnderForm placement={page.slug} />
          </div>
        </div>
      </div>
      <Benefits />
      <BandedBody page={page} startTone="white" />
      <FaqSection page={page} tone={nextToneAfter(page, 'white')} />
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
