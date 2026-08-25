import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Връща страницата най-горе при преход към нов адрес.
 *
 * React Router сменя само съдържанието и оставя скрола там, където е бил. Затова
 * кликът върху услуга от средата на страницата отваряше новата страница по
 * средата ѝ.
 *
 * Три случая се пазят:
 * - адрес с котва (#нещо) скача до самия елемент, не до върха;
 * - бутонът „назад“ връща човека там, докъдето е стигнал;
 * - при изключена анимация скокът е мигновен.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Назад и напред: браузърът сам знае къде е бил човекът.
    if (navigationType === 'POP') return;

    // Мигновено, не плавно. При нова страница плавното превъртане през хиляди
    // пиксели се вижда като забавяне, а и CSS правилото scroll-behavior: smooth
    // прави анимацията ненадеждна оттук.
    const behavior = 'instant' as ScrollBehavior;

    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior, block: 'start' });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, hash, navigationType]);

  return null;
}
