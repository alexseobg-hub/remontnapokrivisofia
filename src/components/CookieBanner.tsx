import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { has } from '@/config/site';
import { readConsent, writeConsent, initAnalytics } from '@/lib/analytics';

/**
 * Истински избор, не тъмен модел. Двата бутона изглеждат еднакво тежко и
 * отказът не е скрит. Аналитиката тръгва само след „Приемам“.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    initAnalytics();
    // Няма аналитика за настройване, значи няма и какво да питаме.
    if (!has('gaId') && !has('gtmId')) return;
    if (readConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const decide = (consent: 'granted' | 'denied') => {
    writeConsent(consent);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Съгласие за бисквитки"
      className="fixed inset-x-0 bottom-[4.25rem] z-50 border-t border-graphite-700 bg-graphite-900 p-4 text-graphite-200 lg:bottom-0"
    >
      <div className="shell flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed">
          Ползваме бисквитки за анализ на посещенията. Без Вашето съгласие не се зарежда нито един външен скрипт.{' '}
          <Link to="/politika-za-biskvitki" className="underline underline-offset-4 hover:text-white">
            Политика за бисквитките
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button type="button" onClick={() => decide('denied')} className="btn-on-dark">
            Отказвам
          </button>
          <button type="button" onClick={() => decide('granted')} className="btn-primary">
            Приемам
          </button>
        </div>
      </div>
    </div>
  );
}
