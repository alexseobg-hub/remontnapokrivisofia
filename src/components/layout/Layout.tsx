import { useEffect, useRef, type ReactNode } from 'react';
import { TopBar } from './TopBar';
import { Header } from './Header';
import { Footer } from './Footer';
import { StickyCallBar } from './StickyCallBar';
import { CookieBanner } from '@/components/CookieBanner';

export function Layout({ children }: { children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null);

  /**
   * Лентата и менюто се лепят заедно, затова височината им се мери и се подава
   * като --header-h. Мобилното меню и котвите към заглавия стъпват на нея;
   * твърда стойност би се разминала, щом промоцията се пренесе на два реда.
   */
  useEffect(() => {
    const node = bar.current;
    if (!node) return;

    const apply = () => {
      document.documentElement.style.setProperty('--header-h', `${node.offsetHeight}px`);
    };
    apply();

    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <div ref={bar} className="sticky top-0 z-50">
        <TopBar />
        <Header />
      </div>
      {/* Долният отстъп прави място на фиксирания бар с телефона на мобилно. */}
      <main id="main" className="pb-[4.25rem] lg:pb-0">
        {children}
      </main>
      <Footer />
      <StickyCallBar />
      <CookieBanner />
    </>
  );
}
