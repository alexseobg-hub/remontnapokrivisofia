import { site, has } from '@/config/site';

/*
 * Аналитиката се зарежда само след изрично съгласие. Без съгласие не тръгва
 * нито един скрипт на трета страна и не се записва бисквитка.
 */

const CONSENT_KEY = 'rps-consent';

export type Consent = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function readConsent(): Consent | null {
  if (typeof localStorage === 'undefined') return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  return stored === 'granted' || stored === 'denied' ? stored : null;
}

export function writeConsent(consent: Consent) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, consent);
  if (consent === 'granted') loadAnalytics();
}

let loaded = false;

export function loadAnalytics() {
  if (loaded || typeof document === 'undefined') return;
  if (!has('gaId') && !has('gtmId')) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };

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
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${site.gtmId}`;
    document.head.appendChild(script);
    return;
  }

  if (has('gaId')) {
    window.gtag('js', new Date());
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${site.gaId}`;
    document.head.appendChild(script);
    window.gtag('config', site.gaId, { anonymize_ip: true });
  }
}

/** Стартира аналитиката при зареждане, ако съгласието вече е дадено по-рано. */
export function initAnalytics() {
  if (readConsent() === 'granted') loadAnalytics();
}

function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', event, params);
}

export const trackPhoneClick = (placement: string) => track('phone_click', { placement });
export const trackViberClick = (placement: string) => track('viber_click', { placement });
export const trackFormSubmit = (form: string) => track('form_submit', { form });
export const trackLead = (form: string) => track('generate_lead', { form, currency: 'BGN' });
export const trackCalculator = (params: Record<string, unknown>) => track('calculator_complete', params);
