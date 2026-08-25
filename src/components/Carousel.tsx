import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

function Arrow({ direction, label, onClick }: { direction: 'prev' | 'next'; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center border border-graphite-300 bg-white text-graphite-700 transition-colors hover:border-graphite-900 hover:bg-graphite-900 hover:text-white"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
        <path
          d={direction === 'prev' ? 'M10 2L4 8l6 6' : 'M6 2l6 6-6 6'}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}

/**
 * Плъзгаща се лента с карти.
 *
 * Самото плъзгане е нативно (scroll-snap), затова работи и без JavaScript —
 * стрелките и точките само помагат. Когато картите се събират на един екран,
 * управлението изчезва: няма смисъл от стрелки, които не водят никъде.
 */
export function Carousel<T>({
  items,
  renderItem,
  keyOf,
  itemClass = 'w-[85%] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]',
  labels,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyOf: (item: T, index: number) => string;
  /** Ширината на една карта. Тя решава колко се виждат наведнъж. */
  itemClass?: string;
  labels: { prev: string; next: string; pages: string };
}) {
  const track = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const total = Math.max(1, Math.ceil(node.scrollWidth / node.clientWidth));
    setPages(total);
    // Последната страница рядко е цяла. Стигне ли се дъното, тя е активната —
    // иначе последната точка никога не светва.
    const atEnd = node.scrollLeft >= node.scrollWidth - node.clientWidth - 2;
    setPage(atEnd ? total - 1 : Math.round(node.scrollLeft / node.clientWidth));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  /*
   * Скокът е наведнъж. Плавното превъртане не оцелява тук: лентата залепва
   * задължително (`snap-mandatory`) и връща всяка междинна позиция към най-
   * близката карта, така че анимацията се бореше със залепването и стрелките
   * не мърдаха нищо. Плъзгането с пръст и мишка си остава нативно и плавно.
   */
  const goTo = (index: number) => {
    const node = track.current;
    if (!node) return;
    const target = Math.min(Math.max(index, 0), pages - 1);
    node.scrollTo({ left: target * node.clientWidth, behavior: 'instant' });
    // Моменталният скок не поражда събитие `scroll` навсякъде, а без него
    // измерването не се обажда и броячът остава на нула — стрелката тогава
    // води все към една и съща страница. Затова се записва тук.
    setPage(target);
  };

  if (items.length === 0) return null;

  return (
    <div>
      <ul
        ref={track}
        onScroll={measure}
        /* Без scroll-smooth: CSS-ът застива и пречи на движението по-горе. */
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <li key={keyOf(item, index)} className={cn('shrink-0 snap-start', itemClass)}>
            {renderItem(item, index)}
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-1.5" role="tablist" aria-label={labels.pages}>
            {Array.from({ length: pages }, (_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === page}
                aria-label={`Страница ${index + 1}`}
                onClick={() => goTo(index)}
                className={cn(
                  'h-1.5 transition-all',
                  index === page ? 'w-7 bg-brick-600' : 'w-3 bg-graphite-300 hover:bg-graphite-400',
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Arrow direction="prev" label={labels.prev} onClick={() => goTo(page - 1)} />
            <Arrow direction="next" label={labels.next} onClick={() => goTo(page + 1)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
