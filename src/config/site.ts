import raw from '@/data/content.generated.json';

/**
 * Едно място за всички фирмени данни.
 *
 * Стойностите по подразбиране са плейсхолдъри във формат {{NAME}}. Всеки от тях
 * се презаписва от базата „Настройки“ в Notion по колоната Key. Докато полето е
 * празно, `has()` връща false и секцията, която зависи от него, не се рендира.
 * Така сайтът изглежда завършен, преди собственикът да е попълнил всичко, и
 * никъде не излиза измислено число.
 *
 * Пълният списък с обяснения е в PLACEHOLDERS.md.
 */

const defaults = {
  // Фирмени данни
  companyName: '{{COMPANY_NAME}}',
  legalName: '{{LEGAL_NAME}}',
  eik: '{{EIK}}',
  vatNumber: '{{VAT_NUMBER}}',
  yearsExperience: '{{YEARS_EXPERIENCE}}',
  foundedYear: '{{FOUNDED_YEAR}}',

  // Контакти
  phonePrimary: '{{PHONE_PRIMARY}}',
  phonePrimaryRaw: '{{PHONE_PRIMARY_RAW}}',
  phoneSecondary: '{{PHONE_SECONDARY}}',
  email: '{{EMAIL}}',
  viber: '{{VIBER_NUMBER}}',
  whatsapp: '{{WHATSAPP_NUMBER}}',

  // Адрес
  streetAddress: '{{STREET_ADDRESS}}',
  addressLocality: 'София',
  postalCode: '{{POSTAL_CODE}}',
  addressCountry: 'BG',
  latitude: '{{LATITUDE}}',
  longitude: '{{LONGITUDE}}',
  mapEmbed: '{{MAP_EMBED_URL}}',

  // Работно време
  workingHours: '{{WORKING_HOURS}}',
  workingHoursSchema: '{{WORKING_HOURS_SCHEMA}}',

  // Профили
  googleBusinessProfile: '{{GBP_URL}}',
  facebook: '{{FACEBOOK_URL}}',
  instagram: '{{INSTAGRAM_URL}}',
  youtube: '{{YOUTUBE_URL}}',

  // Гаранция и оферта
  warrantyYears: '{{WARRANTY_YEARS}}',
  warrantyScope: '{{WARRANTY_SCOPE}}',
  responseTime: '{{RESPONSE_TIME}}',

  // Аналитика
  gaId: '{{GA4_MEASUREMENT_ID}}',
  gtmId: '{{GTM_ID}}',
  gscVerification: '{{GSC_VERIFICATION_TOKEN}}',
  callTrackingScript: '{{CALL_TRACKING_SCRIPT}}',

  // Автор на блога
  authorName: '{{AUTHOR_NAME}}',
  authorRole: '{{AUTHOR_ROLE}}',
  authorBio: '{{AUTHOR_BIO}}',
  authorBioLong: '{{AUTHOR_BIO_LONG}}',
  authorPhoto: '{{AUTHOR_PHOTO_PATH}}',
  authorLinkedin: '{{AUTHOR_LINKEDIN}}',

  // Горна лента
  topBarText: '{{TOP_BAR_TEXT}}',
  topBarLinkLabel: '{{TOP_BAR_LINK_LABEL}}',
  topBarLinkUrl: '{{TOP_BAR_LINK_URL}}',

  // Форма
  formEndpoint: '{{FORM_ENDPOINT}}',
} as const;

export type SiteKey = keyof typeof defaults;

const overrides = (raw as { settings?: Record<string, string> }).settings ?? {};

function resolve() {
  const merged: Record<string, string> = { ...defaults };
  for (const [key, value] of Object.entries(overrides)) {
    if (key in defaults && typeof value === 'string' && value.trim()) merged[key] = value.trim();
  }
  return merged as Record<SiteKey, string>;
}

export const site = resolve();

const PLACEHOLDER = /^\{\{[A-Z0-9_]+\}\}$/;

/** true само когато собственикът наистина е попълнил стойността. */
export function has(key: SiteKey): boolean {
  return !PLACEHOLDER.test(site[key]);
}

/** Стойността, или празен низ докато е плейсхолдър. Никога не показва {{...}} на потребителя. */
export function value(key: SiteKey): string {
  return has(key) ? site[key] : '';
}

/** Стойността, или резервен текст. Ползва се за изречения, които трябва да останат смислени. */
export function valueOr(key: SiteKey, fallback: string): string {
  return has(key) ? site[key] : fallback;
}

export const meta = {
  url: __SITE_URL__.replace(/\/$/, ''),
  indexable: __INDEXABLE__,
  isDev: __IS_DEV__,
  lang: 'bg',
  locale: 'bg_BG',
  domain: 'remontnapokrivisofia.bg',
  areaServed: 'София и София област',
} as const;

export function absoluteUrl(pathname: string): string {
  if (!pathname || pathname === '/') return `${meta.url}/`;
  return `${meta.url}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

/** tel: адрес. Пада обратно към показвания номер, ако суровият не е попълнен. */
export function telHref(): string {
  const rawNumber = has('phonePrimaryRaw') ? site.phonePrimaryRaw : site.phonePrimary;
  return PLACEHOLDER.test(rawNumber) ? '' : `tel:${rawNumber.replace(/[^\d+]/g, '')}`;
}
