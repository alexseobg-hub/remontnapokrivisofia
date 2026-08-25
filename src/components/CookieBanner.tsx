import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { has } from '@/config/site';
import { applyConsent, initAnalytics } from '@/lib/analytics';
import { readConsent, CATEGORIES, ALL, NONE, type CategoryKey, type Consent } from '@/lib/consent';
import { cn } from '@/lib/utils';

/** Събитието, с което връзката във футъра отваря панела отново. */
export const OPEN_PREFERENCES = 'rps:open-consent';

function Toggle({
  checked,
  disabled = false,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-brick-600' : 'bg-graphite-600',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

/**
 * Изборът е истински, не тъмен модел. „Приемам“ и „Предпочитания“ изглеждат
 * еднакво тежко, а в панела отказът стои наравно с приемането. Никоя категория
 * извън задължителните не е включена предварително.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [panel, setPanel] = useState(false);
  const [draft, setDraft] = useState<Consent>(NONE);

  useEffect(() => {
    initAnalytics();
    // Няма аналитика за настройване, значи няма и какво да питаме.
    if (!has('gaId') && !has('gtmId')) return;

    const stored = readConsent();
    if (stored === null) setVisible(true);
    else setDraft(stored);

    const open = () => {
      setDraft(readConsent() ?? NONE);
      setPanel(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_PREFERENCES, open);
    return () => window.removeEventListener(OPEN_PREFERENCES, open);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = panel ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [panel]);

  if (!visible) return null;

  const decide = (consent: Consent) => {
    applyConsent(consent);
    setPanel(false);
    setVisible(false);
  };

  const flip = (key: CategoryKey, next: boolean) => setDraft((current) => ({ ...current, [key]: next }));

  if (panel) {
    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-graphite-950/70 p-0 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-title"
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-graphite-700 bg-graphite-900 text-graphite-200"
        >
          <div className="flex items-start justify-between gap-4 border-b border-graphite-700 p-6">
            <h2 id="consent-title" className="font-display text-xl font-extrabold text-white">
              Изберете кои бисквитки приемате
            </h2>
            <button
              type="button"
              onClick={() => setPanel(false)}
              aria-label="Затвори"
              className="-mr-2 -mt-1 p-2 text-graphite-400 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm leading-relaxed text-graphite-300">
              Задължителните са винаги включени. Останалите избирате Вие и може да ги смените по всяко време от
              връзката „Бисквитки“ във футъра.
            </p>

            <div className="mt-6 space-y-5">
              <div className="border-t border-graphite-700 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-base font-bold text-white">Задължителни</h3>
                  <Toggle checked disabled label="Задължителни бисквитки, винаги включени" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-graphite-400">
                  Без тях сайтът не работи. Тук влиза само бисквитката, която помни избора Ви оттук, за да не Ви пита
                  при всяко отваряне. За тях не се иска съгласие.
                </p>
              </div>

              {CATEGORIES.map((category) => (
                <div key={category.key} className="border-t border-graphite-700 pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-base font-bold text-white">{category.title}</h3>
                    <Toggle
                      checked={draft[category.key]}
                      onChange={(next) => flip(category.key, next)}
                      label={category.title}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-graphite-400">{category.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-graphite-700 pt-6 sm:flex-row">
              <button type="button" onClick={() => decide(draft)} className="btn-on-dark flex-1">
                Запази избора
              </button>
              <button type="button" onClick={() => decide(NONE)} className="btn-on-dark flex-1">
                Отхвърли всички
              </button>
              <button type="button" onClick={() => decide(ALL)} className="btn-primary flex-1">
                Приемам всички
              </button>
            </div>

            <p className="mt-5 text-[0.8125rem] text-graphite-500">
              Подробностите са в{' '}
              <Link to="/politika-za-biskvitki" className="underline underline-offset-4 hover:text-graphite-300">
                политиката за бисквитките
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          <button type="button" onClick={() => setPanel(true)} className="btn-on-dark">
            Предпочитания
          </button>
          <button type="button" onClick={() => decide(ALL)} className="btn-primary">
            Приемам
          </button>
        </div>
      </div>
    </div>
  );
}
