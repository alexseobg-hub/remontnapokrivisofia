import type { FaqItem } from '@/lib/content';

/**
 * Акордеон на <details>. Работи без JavaScript, значи работи и в статичния HTML,
 * и съдържанието се вижда от търсачките без изпълняване на скриптове.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="divide-y divide-graphite-200 border-y border-graphite-200">
      {items.map((item, index) => (
        <details key={item.q} className="group" open={index === 0}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 font-display text-[1.0625rem] font-bold leading-snug text-graphite-900 hover:text-brick-700">
            <span>{item.q}</span>
            <span
              aria-hidden="true"
              className="mt-1 shrink-0 text-brick-600 transition-transform duration-150 group-open:rotate-45"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4">
                <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </span>
          </summary>
          <div
            className="prose-roof pb-6 pr-8 text-[1rem]"
            dangerouslySetInnerHTML={{ __html: item.a }}
          />
        </details>
      ))}
    </div>
  );
}
