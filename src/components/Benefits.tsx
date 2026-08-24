import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/*
 * Ползите на фирмата. Иконите се рисуват на място, за да няма външен пакет и
 * заявка към чужд сървър. Всяка е с една линия и същата дебелина, за да върви
 * с шрифта, а не да се бие с него.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Лупа над покрив: огледът. */
function IconInspection() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M3 16 16 5l13 11" {...stroke} />
      <path d="M6.5 19v8h19v-8" {...stroke} />
      <circle cx="15" cy="19.5" r="4" {...stroke} />
      <path d="M18 22.5 21.5 26" {...stroke} />
    </svg>
  );
}

/** Щит с отметка: гаранцията. */
function IconWarranty() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3.5 27 7v9c0 6.4-4.5 10.9-11 12.5C9.5 26.9 5 22.4 5 16V7z" {...stroke} />
      <path d="m11.5 16.2 3.2 3.2 6.2-6.6" {...stroke} />
    </svg>
  );
}

/** Часовник със стрелка: бързото започване. */
function IconSpeed() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M28 16a12 12 0 1 1-4.2-9.1" {...stroke} />
      <path d="M28 4.5V11h-6.4" {...stroke} />
      <path d="M16 9.5V16l4.5 2.8" {...stroke} />
    </svg>
  );
}

/** Документ с редове и печат: офертата и фактурата. */
function IconDocument() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 4h12l6 6v18H7z" {...stroke} />
      <path d="M19 4v6h6" {...stroke} />
      <path d="M11.5 15h9M11.5 19h9M11.5 23h5.5" {...stroke} />
    </svg>
  );
}

const BENEFITS: { title: string; note: string; icon: ReactNode }[] = [
  {
    title: 'Безплатен оглед',
    note: 'На място, без ангажимент и без такса за посещение.',
    icon: <IconInspection />,
  },
  {
    title: 'Ремонт с гаранция',
    note: 'Писмена гаранция за изпълнението, вписана в договора.',
    icon: <IconWarranty />,
  },
  {
    title: 'Бързо започване на работа',
    note: 'Казваме честно кога сме свободни, още при първото обаждане.',
    icon: <IconSpeed />,
  },
  {
    title: 'Писмена оферта и фактура',
    note: 'Разбивка по дейности и количества, с материалите по име.',
    icon: <IconDocument />,
  },
];

/**
 * Лентата с ползите. Стои на всяка страница, точно над футъра.
 * Тонът се подава отвън, за да продължи редуването на лентите.
 */
export function Benefits({ tone = 'sand' }: { tone?: 'white' | 'sand' }) {
  return (
    <section className={cn('band-tight', tone === 'sand' ? 'band-sand' : 'band-white')} aria-label="Защо да ни изберете">
      <ul className="shell grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((item) => (
          <li key={item.title} className="flex gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-brick-200 bg-brick-50 text-brick-600 [&>svg]:h-6 [&>svg]:w-6"
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="font-display text-[1.0625rem] font-extrabold leading-tight text-graphite-900">
                {item.title}
              </p>
              <p className="mt-1.5 text-[0.875rem] leading-relaxed text-graphite-600">{item.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
