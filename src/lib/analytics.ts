import { site, has } from '@/config/site';
import { readConsent, writeConsent, anyGranted, type Consent } from '@/lib/consent';

/*
 * Аналитиката се зарежда само след изрично съгласие и точно за категориите,
 * които човекът е приел. Без прието нищо не тръгва нито един скрипт на трета
 * страна и не се записва бисквитка.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export { readConsent } from '@/lib/consent';

/** Съгласието на езика на Google. Оттук GTM и GA4 разбират какво им е позволено. */
function consentSignals(consent: Consent) {
  const yes = 'granted';
  const no = 'denied';
  return {
    ad_storage: consent.marketing ? yes : no,
    ad_user_data: consent.marketing ? yes : no,
    ad_personalization: consent.marketing ? yes : no,
    analytics_storage: consent.statistics ? yes : no,
    functionality_storage: consent.preferences ? yes : no,
    personalization_storage: consent.preferences ? yes : no,
    security_storage: yes,
  };
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  }
}

let loaded = false;

function loadAnalytics(consent: Consent) {
  if (loaded || typeof document === 'undefined') return;
  if (!has('gaId') && !has('gtmId')) return;
  loaded = true;

  ensureGtag();
  window.gtag?.('consent', 'default', consentSignals(consent));

  /*
   * Едно от двете, никога и двете. Контейнерът на Tag Manager почти винаги
   * съдържа и таг за GA4; заредят ли се заедно, всяко посещение се брои
   * два пъти и числата стават безполезни.
   */
  if (has('gtmId')) {
    if (has('gaId')) {
      console.warn('Зададени са и GTM, и GA4. Зарежда се само GTM, за да не се брои двойно.');
    }
    // Събитието gtm.js е това, което пуска задействанията в контейнера.
    window.dataLayer?.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${site.gtmId}`;
    document.head.appendChild(script);
    return;
  }

  window.gtag?.('js', new Date());
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${site.gaId}`;
  document.head.appendChild(script);
  window.gtag?.('config', site.gaId, { anonymize_ip: true });
}

/**
 * Записва избора и го прилага. При първо приемане зарежда скриптовете; при
 * по-късна промяна само обновява сигналите, защото веднъж заредено не се маха.
 */
export function applyConsent(consent: Consent) {
  writeConsent(consent);
  if (typeof window === 'undefined') return;

  if (!loaded) {
    if (anyGranted(consent)) loadAnalytics(consent);
    return;
  }
  ensureGtag();
  window.gtag?.('consent', 'update', consentSignals(consent));
}

/** Стартира аналитиката при зареждане, ако съгласие вече е дадено по-рано. */
export function initAnalytics() {
  const consent = readConsent();
  if (consent && anyGranted(consent)) loadAnalytics(consent);
}

function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', event, params);
}

export const trackPhoneClick = (placement: string) => track('phone_click', { placement });
export const trackViberClick = (placement: string) => track('viber_click', { placement });
export const trackFormSubmit = (form: string) => track('form_submit', { form });
export const trackLead = (form: string) => track('generate_lead', { form, currency: 'EUR' });
export const trackCalculator = (params: Record<string, unknown>) => track('calculator_complete', params);
