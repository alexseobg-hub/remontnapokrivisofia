import { site, meta, has, valueOr, absoluteUrl } from '@/config/site';
import type { ContentPage, FaqItem, Project } from './content';
import { districts, pricing, formatPrice, authorPage } from './content';

/*
 * JSON-LD за целия сайт, генериран от базата „Настройки“.
 * Полета, които още са плейсхолдъри, просто не влизат в изхода — по-добре липсващо
 * свойство, отколкото невярно.
 *
 * Съзнателно НЕ се произвежда AggregateRating, Review или Offer с конкретна цена.
 * Те изискват потвърдени данни; измислени оценки са нарушение на ЗЗП.
 */

type Json = Record<string, unknown>;

const ORG_ID = `${meta.url}/#organization`;
const SITE_ID = `${meta.url}/#website`;

/** Маха празните стойности, за да не излизат null-ове в JSON-LD. */
function clean<T extends Json>(input: T): T {
  const out: Json = {};
  for (const [key, val] of Object.entries(input)) {
    if (val === undefined || val === null || val === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;
    out[key] = val;
  }
  return out as T;
}

const socialProfiles = () =>
  (['googleBusinessProfile', 'facebook', 'instagram', 'youtube', 'x'] as const)
    .filter((key) => has(key))
    .map((key) => site[key]);

export function organization(): Json {
  const address = clean({
    '@type': 'PostalAddress',
    streetAddress: has('streetAddress') ? site.streetAddress : undefined,
    addressLocality: site.addressLocality,
    postalCode: has('postalCode') ? site.postalCode : undefined,
    addressCountry: site.addressCountry,
  });

  const geo =
    has('latitude') && has('longitude')
      ? { '@type': 'GeoCoordinates', latitude: site.latitude, longitude: site.longitude }
      : undefined;

  return clean({
    '@type': 'RoofingContractor',
    '@id': ORG_ID,
    name: has('companyName') ? site.companyName : 'Ремонт на покриви София',
    legalName: has('legalName') ? site.legalName : undefined,
    url: `${meta.url}/`,
    telephone: has('phonePrimary') ? site.phonePrimary : undefined,
    email: has('email') ? site.email : undefined,
    vatID: has('vatNumber') ? site.vatNumber : undefined,
    taxID: has('eik') ? site.eik : undefined,
    foundingDate: has('foundedYear') ? site.foundedYear : undefined,
    address: Object.keys(address).length > 2 ? address : undefined,
    geo,
    openingHours: has('workingHoursSchema') ? site.workingHoursSchema : undefined,
    priceRange: '$$',
    currenciesAccepted: 'BGN',
    areaServed: [
      { '@type': 'City', name: 'София' },
      ...districts().map((district) => ({
        '@type': 'Place',
        name: district.district || district.name,
      })),
    ],
    sameAs: socialProfiles(),
    hasOfferCatalog: offerCatalog(),
  });
}

function offerCatalog(): Json | undefined {
  if (pricing.length === 0) return undefined;
  return {
    '@type': 'OfferCatalog',
    name: 'Покривни услуги в София',
    itemListElement: pricing.map((row) => ({
      '@type': 'OfferCatalog',
      name: row.service,
      description: row.note || `${row.service} — ${formatPrice(row)}`,
    })),
  };
}

export function website(): Json {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: `${meta.url}/`,
    name: has('companyName') ? site.companyName : 'Ремонт на покриви София',
    inLanguage: 'bg-BG',
    publisher: { '@id': ORG_ID },
  };
}

export function breadcrumbs(trail: { name: string; slug: string }[]): Json | undefined {
  if (trail.length < 2) return undefined;
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.slug),
    })),
  };
}

export function faqPage(items: FaqItem[]): Json | undefined {
  if (items.length === 0) return undefined;
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      },
    })),
  };
}

export function service(page: ContentPage, areaName = 'София'): Json {
  return clean({
    '@type': 'Service',
    name: page.h1,
    description: page.metaDescription || page.description,
    serviceType: page.name,
    url: absoluteUrl(page.slug),
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Place', name: areaName },
  });
}

/** Адресът на авторската страница, докато има такава в Notion. */
const authorUrl = () => {
  const page = authorPage();
  return page ? absoluteUrl(page.slug) : '';
};

/** Името на автора: първо от Настройки, после от заглавието на авторската страница. */
const authorFullName = () => valueOr('authorName', authorPage()?.name ?? '');

export function person(): Json | undefined {
  const url = authorUrl();
  const name = authorFullName();
  // Без авторска страница и без име няма кого да опишем. По-добре нищо, отколкото празен Person.
  if (!url || !name) return undefined;

  return clean({
    '@type': 'Person',
    '@id': `${url}#person`,
    name,
    jobTitle: has('authorRole') ? site.authorRole : undefined,
    description: has('authorBio') ? site.authorBio : undefined,
    image: has('authorPhoto') ? absoluteUrl(site.authorPhoto) : undefined,
    url,
    worksFor: { '@id': ORG_ID },
    sameAs: has('authorLinkedin') ? [site.authorLinkedin] : undefined,
  });
}

export function article(page: ContentPage): Json {
  const url = authorUrl();
  const name = authorFullName();

  return clean({
    '@type': 'Article',
    headline: page.h1,
    description: page.metaDescription || page.description,
    url: absoluteUrl(page.slug),
    datePublished: page.publishDate || undefined,
    dateModified: page.updated || page.publishDate || undefined,
    inLanguage: 'bg-BG',
    author: url && name ? { '@id': `${url}#person` } : undefined,
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(page.slug) },
  });
}

export function projectWork(project: Project): Json {
  return clean({
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description || undefined,
    url: absoluteUrl(project.slug),
    dateCreated: project.date || undefined,
    creator: { '@id': ORG_ID },
    contentLocation: project.district
      ? { '@type': 'Place', name: `${project.district}, София`, address: { '@type': 'PostalAddress', addressLocality: 'София', addressCountry: 'BG' } }
      : undefined,
    image: [project.imageAfter?.src, project.imageBefore?.src].filter(Boolean).map((src) => absoluteUrl(src as string)),
  });
}

export function contactPage(): Json {
  return {
    '@type': 'ContactPage',
    url: `${meta.url}/kontakti`,
    name: 'Контакти',
    mainEntity: { '@id': ORG_ID },
  };
}

export function profilePage(): Json | undefined {
  const url = authorUrl();
  if (!url || !authorFullName()) return undefined;
  return {
    '@type': 'ProfilePage',
    url,
    mainEntity: { '@id': `${url}#person` },
  };
}

/** Опакова всички обекти за страницата в един @graph. */
export function graph(...nodes: (Json | undefined)[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': nodes.filter((node): node is Json => Boolean(node)),
  });
}
