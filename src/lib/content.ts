import raw from '@/data/content.generated.json';

export interface MediaImage {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  sources: { type: string; srcset: string }[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export type PageType =
  | 'Home' | 'Service hub' | 'Service' | 'Pricing' | 'District'
  | 'Project' | 'Blog post' | 'Author' | 'Legal' | 'Page';

export interface ContentPage {
  id: string;
  name: string;
  slug: string;
  h1: string;
  type: PageType;
  metaTitle: string;
  metaDescription: string;
  description: string;
  shortAnswer: string;
  parent: string;
  order: number;
  nav: boolean;
  district: string;
  canonicalUrl: string;
  publishDate: string;
  updated: string;
  tags: string[];
  noindex: boolean;
  html: string;
  toc: { id: string; text: string }[];
  faq: FaqItem[];
  wordCount: number;
}

export interface PriceRow {
  key: string;
  service: string;
  unit: string;
  from: number | null;
  to: number | null;
  category: string;
  note: string;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  district: string;
  services: string[];
  buildingType: string;
  area: number | null;
  duration: string;
  works: string;
  materials: string;
  priceRange: string;
  description: string;
  date: string;
  order: number;
  imageBefore: MediaImage | null;
  imageAfter: MediaImage | null;
  gallery: MediaImage[];
}

export interface Testimonial {
  name: string;
  district: string;
  body: string;
  rating: number | null;
  source: string;
  link: string;
  service: string;
  date: string;
  order: number;
}

interface Content {
  generatedAt: string;
  settings: Record<string, string>;
  pricing: PriceRow[];
  projects: Project[];
  testimonials: Testimonial[];
  pages: ContentPage[];
}

const content = raw as unknown as Content;

export const pages = content.pages ?? [];
export const pricing = content.pricing ?? [];
export const projects = content.projects ?? [];
export const testimonials = content.testimonials ?? [];
export const generatedAt = content.generatedAt ?? '';

/* ---------- Страници ---------- */

export const getPage = (slug: string) => pages.find((page) => page.slug === slug);

export const pagesOfType = (...types: PageType[]) => pages.filter((page) => types.includes(page.type));

/** Преките деца на дадена страница. Ползва явното поле Parent, а не префикса на slug-а. */
export const childrenOf = (slug: string) =>
  pages.filter((page) => page.parent === slug).sort((a, b) => a.order - b.order);

/** Всички потомци, на произволна дълбочина. */
export function descendantsOf(slug: string): ContentPage[] {
  const direct = childrenOf(slug);
  return direct.flatMap((child) => [child, ...descendantsOf(child.slug)]);
}

export function ancestorsOf(slug: string): ContentPage[] {
  const chain: ContentPage[] = [];
  let current = getPage(slug);
  const guard = new Set<string>([slug]);

  while (current?.parent) {
    const parent = getPage(current.parent);
    if (!parent || guard.has(parent.slug)) break;
    guard.add(parent.slug);
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export const districts = () => pagesOfType('District').sort((a, b) => a.order - b.order);

export const serviceHubs = () => pagesOfType('Service hub').sort((a, b) => a.order - b.order);

export const blogPosts = () =>
  pagesOfType('Blog post').sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''));

/** Съседните квартали за вътрешно свързване: следващите в реда, с превъртане. */
export function neighbourDistricts(slug: string, count = 3): ContentPage[] {
  const all = districts();
  const index = all.findIndex((page) => page.slug === slug);
  if (index === -1) return all.slice(0, count);
  return Array.from({ length: Math.min(count, all.length - 1) }, (_, i) => all[(index + i + 1) % all.length]);
}

/** Сестрински услуги за хоризонтално свързване. */
export function siblingServices(page: ContentPage, count = 3): ContentPage[] {
  if (!page.parent) return [];
  return childrenOf(page.parent).filter((item) => item.slug !== page.slug).slice(0, count);
}

/* ---------- Цени ---------- */

export const priceByKey = (key: string) => pricing.find((row) => row.key === key);

export const pricesByKeys = (keys: string[]) =>
  keys.map((key) => priceByKey(key)).filter((row): row is PriceRow => Boolean(row));

export const priceCategories = () => [...new Set(pricing.map((row) => row.category).filter(Boolean))];

export const pricesInCategory = (category: string) => pricing.filter((row) => row.category === category);

/** „от 45 лв./м²“, „45 – 70 лв./м²“ или „По запитване“. Никога измислено число. */
export function formatPrice(row: PriceRow): string {
  if (row.from === null && row.to === null) return 'По запитване';
  if (row.from !== null && row.to !== null) return `${row.from} – ${row.to} ${row.unit}`;
  const single = row.from ?? row.to;
  return `от ${single} ${row.unit}`;
}

/* ---------- Проекти и отзиви ---------- */

export const projectsInDistrict = (district: string) =>
  projects.filter((project) => project.district && project.district === district);

export const projectsForService = (service: string) =>
  projects.filter((project) => project.services.includes(service));

export const getProject = (slug: string) => projects.find((project) => project.slug === slug);

/* ---------- Дребни ---------- */

export const readingMinutes = (words: number) => Math.max(1, Math.round(words / 200));

export function formatDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
