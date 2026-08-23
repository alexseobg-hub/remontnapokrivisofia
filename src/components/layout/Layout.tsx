import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { StickyCallBar } from './StickyCallBar';
import { CookieBanner } from '@/components/CookieBanner';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Към съдържанието
      </a>
      <Header />
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
