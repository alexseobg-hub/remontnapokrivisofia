import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { site, has, telHref } from '@/config/site';
import { serviceHubs, childrenOf, navPages } from '@/lib/content';
import { cn } from '@/lib/utils';
import { trackPhoneClick } from '@/lib/analytics';

/** Всичко с отметнато Nav в Notion, без хъба на услугите — той е падащото меню. */
const primaryLinks = () => navPages().filter((page) => page.slug !== '/uslugi');

function Logo() {
  return (
    /*
     * Без aria-label. Видимият текст е "Ремонт на покриви София", а етикетът
     * казваше "Начало" — който управлява с глас и прочете написаното, не
     * улучва връзката. Сега достъпното име е самият текст.
     */
    <Link to="/" className="flex items-center gap-3">
      <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="32" height="32" fill="#14181D" />
        <path d="M4 18 16 8l12 10v2h-3.2L16 12.6 7.2 20H4z" fill="#C74A17" />
        <path d="M7.2 21.4h17.6V26H7.2z" fill="#F4F1EA" />
      </svg>
      <span className="font-display text-[0.9375rem] font-extrabold leading-[1.15] tracking-tight text-graphite-900">
        Ремонт на покриви
        <span className="block text-brick-600">София</span>
      </span>
    </Link>
  );
}

function PhoneLink({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  if (!has('phonePrimary')) return null;
  return (
    <a
      href={telHref()}
      onClick={() => trackPhoneClick('header')}
      className={cn(
        // Дълъг номер не бива да се пренася на два реда и да разваля лентата.
        'whitespace-nowrap font-display text-[0.9375rem] font-bold tracking-tight',
        onDark ? 'text-white hover:text-brick-300' : 'text-graphite-900 hover:text-brick-600',
        className,
      )}
    >
      {site.phonePrimary}
    </a>
  );
}

function ServicesMenu() {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const hubs = serviceHubs();

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (hubs.length === 0) {
    return (
      <NavLink to="/uslugi" className="nav-link">
        Услуги
      </NavLink>
    );
  }

  return (
    <div ref={wrapper} className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="nav-link inline-flex items-center gap-1.5"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
      >
        Услуги
        <svg viewBox="0 0 10 6" className={cn('h-1.5 w-2.5 transition-transform', open && 'rotate-180')} aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-50 w-[min(56rem,90vw)] -translate-x-1/2 pt-3">
          <div className="border border-graphite-200 bg-white p-6 shadow-[0_18px_50px_-20px_rgba(20,24,29,0.35)]">
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {hubs.map((hub) => {
                const children = childrenOf(hub.slug).slice(0, 5);
                return (
                  <div key={hub.slug}>
                    <Link
                      to={hub.slug}
                      onClick={() => setOpen(false)}
                      className="font-display text-sm font-extrabold tracking-tight text-graphite-900 hover:text-brick-600"
                    >
                      {hub.name}
                    </Link>
                    {children.length > 0 ? (
                      <ul className="mt-2 space-y-1.5">
                        {children.map((child) => (
                          <li key={child.slug}>
                            <Link
                              to={child.slug}
                              onClick={() => setOpen(false)}
                              className="text-[0.8125rem] leading-snug text-graphite-600 hover:text-brick-600"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 border-t border-graphite-200 pt-4">
              <Link to="/uslugi" onClick={() => setOpen(false)} className="font-display text-sm font-bold text-brick-600 hover:text-brick-700">
                Всички услуги →
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hubs = serviceHubs();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 top-[var(--header-h,4.5rem)] z-40 overflow-y-auto bg-white lg:hidden">
      <nav className="shell py-6" aria-label="Основна навигация">
        <p className="eyebrow">Услуги</p>
        <ul className="mb-6 space-y-3">
          {hubs.map((hub) => (
            <li key={hub.slug}>
              <Link to={hub.slug} onClick={onClose} className="font-display text-lg font-bold text-graphite-900">
                {hub.name}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/uslugi" onClick={onClose} className="font-display text-base font-bold text-brick-600">
              Всички услуги →
            </Link>
          </li>
        </ul>
        <hr className="hairline" />
        <ul className="mt-6 space-y-3">
          {primaryLinks().map((item) => (
            <li key={item.slug}>
              <Link to={item.slug} onClick={onClose} className="font-display text-lg font-bold text-graphite-900">
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-3">
          <CtaRow onClose={onClose} />
        </div>
      </nav>
    </div>
  );
}

function CtaRow({ onClose }: { onClose: () => void }) {
  return (
    <>
      {has('phonePrimary') ? (
        <a href={telHref()} onClick={() => trackPhoneClick('mobile-menu')} className="btn-ghost btn-lg">
          {site.phonePrimary}
        </a>
      ) : null}
      <Link to="/bezplaten-ogled" onClick={onClose} className="btn-primary btn-lg">
        Получи оферта
      </Link>
    </>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    /*
     * Менюто стои извън <header> нарочно. Хедърът е с `backdrop-blur`, а
     * `backdrop-filter` прави елемента контейнер за наследниците си с
     * `position: fixed`. Вътре панелът се мереше спрямо хедъра — висок 73px —
     * вместо спрямо екрана, и излизаше с височина нула: отваряше се и не се
     * виждаше нищо.
     */
    <>
    <header className="border-b border-graphite-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="shell flex h-[4.5rem] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Основна навигация">
          <ServicesMenu />
          {primaryLinks().map((item) => (
            <NavLink key={item.slug} to={item.slug} className="nav-link">
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <PhoneLink className="hidden sm:block" />
          <Link to="/bezplaten-ogled" className="btn-primary hidden md:inline-flex">
            Получи оферта
          </Link>
          <button
            type="button"
            className="-mr-2 p-2 lg:hidden"
            aria-label={menuOpen ? 'Затвори менюто' : 'Отвори менюто'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
              {menuOpen ? (
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              )}
            </svg>
          </button>
        </div>
      </div>

    </header>

    <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
