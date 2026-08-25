import { Link } from 'react-router-dom';
import { site, has, telHref } from '@/config/site';
import { trackPhoneClick } from '@/lib/analytics';

/**
 * Фиксираният бар долу на телефон. Над 70% от търсенията за спешен ремонт са мобилни,
 * а човек с течащ покрив иска да звънне, не да чете.
 */
export function StickyCallBar() {
  if (!has('phonePrimary')) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-graphite-800 bg-graphite-900 p-3 lg:hidden">
        <Link to="/bezplaten-ogled" className="btn-primary w-full">
          Получи оферта
        </Link>
      </div>
    );
  }

  return (
    /* Две половини, два ясни бутона. Досега лявата беше само бял текст върху
       фона на лентата и не се четеше като нещо, което може да се натисне. */
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-graphite-800 lg:hidden">
      <a
        href={telHref()}
        onClick={() => trackPhoneClick('sticky-bar')}
        className="flex items-center justify-center gap-2 bg-white px-3 py-4 font-display text-[0.9375rem] font-bold text-brick-700 active:bg-brick-50"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="currentColor">
          <path d="M4.2 2h3l1.5 3.8-2 1.4a10 10 0 004.9 4.9l1.4-2L16.8 12v3a1.7 1.7 0 01-1.9 1.7A14 14 0 012.5 4.5 1.7 1.7 0 014.2 2z" />
        </svg>
        Обади се
      </a>
      <Link
        to="/bezplaten-ogled"
        className="flex items-center justify-center bg-brick-600 px-3 py-4 font-display text-[0.9375rem] font-bold text-white active:bg-brick-700"
      >
        Получи оферта
      </Link>
      <span className="sr-only">Телефон: {site.phonePrimary}</span>
    </div>
  );
}
