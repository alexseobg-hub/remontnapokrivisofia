import { Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ScrollToTop } from '@/components/ScrollToTop';
import {
  HomePage, ServicePage, DistrictPage, ProjectPage, BlogPost, AuthorPage,
  StandardPage, LegalPage, LeadPage, NotFoundPage,
} from '@/templates';
import { getPage, getProject, ancestorsOf, type ContentPage } from '@/lib/content';
import { buildHead, useHead } from '@/lib/seo';
import * as schema from '@/lib/schema';
import { has, site } from '@/config/site';

/** Страниците, на които формата стои горе вдясно, а не само в дъното. */
const LEAD_PAGES = new Set(['/besplaten-ogled', '/kontakti']);

function headFor(page: ContentPage): ReturnType<typeof buildHead> {
  // Началната страница няма пътека - тя е коренът ѝ.
  const trail =
    page.slug === '/'
      ? []
      : [
          { name: 'Начало', slug: '/' },
          ...ancestorsOf(page.slug).filter((item) => item.slug !== '/').map((item) => ({ name: item.name, slug: item.slug })),
          { name: page.name, slug: page.slug },
        ];

  const common = [schema.organization(), schema.website(), schema.breadcrumbs(trail), schema.faqPage(page.faq)];

  let nodes = common;
  if (page.type === 'Service' || page.type === 'Service hub' || page.type === 'Pricing') {
    nodes = [...common, schema.service(page)];
  } else if (page.type === 'District') {
    nodes = [...common, schema.service(page, `${page.district || page.name}, София`)];
  } else if (page.type === 'Blog post') {
    nodes = [...common, schema.article(page), schema.person()];
  } else if (page.type === 'Author') {
    nodes = [...common, schema.person(), schema.profilePage()];
  } else if (page.slug === '/kontakti') {
    nodes = [...common, schema.contactPage()];
  }

  return buildHead({
    title: page.metaTitle || page.h1,
    description: page.metaDescription || page.description,
    slug: page.slug,
    canonicalUrl: page.canonicalUrl,
    ogType: page.type === 'Blog post' ? 'article' : 'website',
    noindex: page.noindex,
    jsonLd: schema.graph(...nodes),
    publishedTime: page.publishDate || undefined,
    modifiedTime: page.updated || undefined,
  });
}

function renderPage(page: ContentPage) {
  if (page.slug === '/') return <HomePage page={page} />;
  if (LEAD_PAGES.has(page.slug)) return <LeadPage page={page} />;

  switch (page.type) {
    case 'Home':
      return <HomePage page={page} />;
    case 'Service':
    case 'Service hub':
    case 'Pricing':
      return <ServicePage page={page} />;
    case 'District':
      return <DistrictPage page={page} />;
    case 'Blog post':
      return <BlogPost page={page} />;
    case 'Author':
      return <AuthorPage page={page} />;
    case 'Legal':
      return <LegalPage page={page} />;
    default:
      return <StandardPage page={page} />;
  }
}

function PageView() {
  const { pathname } = useLocation();
  const slug = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  const page = getPage(slug);
  const project = page ? undefined : getProject(slug);

  const head = page
    ? headFor(page)
    : project
      ? buildHead({
          title: `${project.title} — реализиран обект`,
          description:
            project.description ||
            `${project.title}. ${[project.district, project.area ? `${project.area} м²` : '', project.duration].filter(Boolean).join(' · ')}`,
          slug: project.slug,
          ogImage: project.imageAfter ? `${__SITE_URL__}${project.imageAfter.src}` : undefined,
          jsonLd: schema.graph(
            schema.organization(),
            schema.website(),
            schema.breadcrumbs([
              { name: 'Начало', slug: '/' },
              { name: 'Проекти', slug: '/proekti' },
              { name: project.title, slug: project.slug },
            ]),
            schema.projectWork(project),
          ),
        })
      : buildHead({
          title: `Страницата не е намерена | ${has('companyName') ? site.companyName : 'Ремонт на покриви София'}`,
          description: 'Такава страница няма. Вижте услугите, цените и районите, в които работим.',
          slug,
          noindex: true,
        });

  useHead(head);

  if (page) return renderPage(page);
  if (project) return <ProjectPage project={project} />;
  return <NotFoundPage />;
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="*" element={<PageView />} />
      </Routes>
    </Layout>
  );
}
