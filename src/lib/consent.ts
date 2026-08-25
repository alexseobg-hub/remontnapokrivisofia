/*
 * Съгласие по категории.
 *
 * Задължителните бисквитки не се питат — без тях сайтът не работи и законът
 * не иска съгласие за тях. Останалите три категории се включват поотделно.
 *
 * Докато нито една категория извън задължителните не е приета, не се зарежда
 * нито един скрипт на трета страна. Това е обещанието в политиката за
 * бисквитките и кодът го спазва буквално.
 */

export type CategoryKey = 'statistics' | 'marketing' | 'preferences';

export type Consent = Record<CategoryKey, boolean>;

export interface Category {
  key: CategoryKey;
  title: string;
  body: string;
}

export const CATEGORIES: Category[] = [
  {
    key: 'statistics',
    title: 'Статистика',
    body: 'Броят посещения и кои страници се четат. Данните са обобщени и по тях не се разпознава отделен човек. Помагат ни да видим кое обяснение върши работа и кое не.',
  },
  {
    key: 'marketing',
    title: 'Маркетинг',
    body: 'Измерват дали реклама е довела до запитване и позволяват да Ви покажем обява по-късно. Не ги ползваме в момента; ако започнем, изборът Ви важи отсега.',
  },
  {
    key: 'preferences',
    title: 'Предпочитания',
    body: 'Запомнят Ваши настройки при следващо посещение. В момента сайтът няма такива, освен самия Ви избор оттук, който е задължителен.',
  },
];

export const NONE: Consent = { statistics: false, marketing: false, preferences: false };
export const ALL: Consent = { statistics: true, marketing: true, preferences: true };

/** Версията се вдига, когато категориите се променят, за да се пита наново. */
const KEY = 'rps-consent-v2';

/**
 * Шест месеца. Съгласието не бива да важи вечно — човек забравя какво е избрал
 * преди две години, а надзорните органи очакват да бъде подновявано. След срока
 * записът се смята за липсващ и лентата пита наново.
 */
const MAX_AGE_DAYS = 180;

interface Stored extends Consent {
  at?: number;
}

export function readConsent(): Consent | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored>;

    const age = Date.now() - (parsed.at ?? 0);
    if (age > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return null;
    }

    return {
      statistics: parsed.statistics === true,
      marketing: parsed.marketing === true,
      preferences: parsed.preferences === true,
    };
  } catch {
    return null;
  }
}

export function writeConsent(consent: Consent) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify({ ...consent, at: Date.now() } satisfies Stored));
}

/** Има ли изобщо нещо прието извън задължителните. */
export const anyGranted = (consent: Consent) => Object.values(consent).some(Boolean);
