import { useEffect } from 'react';
import { meta, absoluteUrl, has, site } from '@/config/site';

export interface Head {
  title: string;
  description: string;
  canonical: string;
  ogType: 'website' | 'article';
  ogImage?: string;
  noindex: boolean;
  jsonLd?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface HeadInput {
  title: string;
  description?: string;
  slug: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

/** Изрязва по последната цяла дума, за да не се къса описанието по средата. */
function trim(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

export function buildHead(input: HeadInput): Head {
  return {
    title: trim(input.title, 65),
    description: trim(input.description ?? '', 165),
    canonical: input.canonicalUrl || absoluteUrl(input.slug),
    ogType: input.ogType ?? 'website',
    ogImage: input.ogImage,
    // Демо адресите и билдовете извън продукция не се индексират.
    noindex: Boolean(input.noindex) || !meta.indexable,
    jsonLd: input.jsonLd,
    publishedTime: input.publishedTime,
    modifiedTime: input.modifiedTime,
  };
}

/*
 * При сървърното рендиране събираме head данните в този приемник и
 * prerender.js ги записва в готовия HTML. В браузъра същите данни се
 * прилагат върху document при навигация.
 */
export const headSink: { current: Head | null } = { current: null };

const isServer = typeof document === 'undefined';

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!content) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function useHead(head: Head) {
  if (isServer) headSink.current = head;

  useEffect(() => {
    if (isServer) return;

    document.title = head.title;
    setMeta('meta[name="description"]', 'name', 'description', head.description);
    setMeta('meta[name="robots"]', 'name', 'robots', head.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = head.canonical;

    setMeta('meta[property="og:title"]', 'property', 'og:title', head.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', head.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', head.canonical);
    setMeta('meta[property="og:type"]', 'property', 'og:type', head.ogType);
    setMeta('meta[property="og:image"]', 'property', 'og:image', head.ogImage ?? '');
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', head.ogImage ? 'summary_large_image' : 'summary');

    let script = document.head.querySelector<HTMLScriptElement>('script[data-jsonld]');
    if (head.jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.dataset.jsonld = '';
        document.head.appendChild(script);
      }
      script.textContent = head.jsonLd;
    } else {
      script?.remove();
    }
  }, [head]);
}

/** Разметката за <head>, която prerender.js вгражда в статичния HTML. */
export function renderHeadTags(head: Head): string {
  const escape = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const siteName = has('companyName') ? site.companyName : 'Ремонт на покриви София';

  const tags = [
    `<title>${escape(head.title)}</title>`,
    `<meta name="description" content="${escape(head.description)}" />`,
    `<meta name="robots" content="${head.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`,
    `<link rel="canonical" href="${escape(head.canonical)}" />`,
    `<meta property="og:site_name" content="${escape(siteName)}" />`,
    `<meta property="og:locale" content="bg_BG" />`,
    `<meta property="og:type" content="${head.ogType}" />`,
    `<meta property="og:title" content="${escape(head.title)}" />`,
    `<meta property="og:description" content="${escape(head.description)}" />`,
    `<meta property="og:url" content="${escape(head.canonical)}" />`,
  ];

  if (head.ogImage) {
    tags.push(`<meta property="og:image" content="${escape(head.ogImage)}" />`);
    tags.push('<meta name="twitter:card" content="summary_large_image" />');
  } else {
    tags.push('<meta name="twitter:card" content="summary" />');
  }

  if (head.publishedTime) tags.push(`<meta property="article:published_time" content="${escape(head.publishedTime)}" />`);
  if (head.modifiedTime) tags.push(`<meta property="article:modified_time" content="${escape(head.modifiedTime)}" />`);
  if (has('gscVerification')) tags.push(`<meta name="google-site-verification" content="${escape(site.gscVerification)}" />`);
  if (head.jsonLd) tags.push(`<script type="application/ld+json" data-jsonld>${head.jsonLd.replace(/</g, '\\u003c')}</script>`);

  return tags.join('\n    ');
}
