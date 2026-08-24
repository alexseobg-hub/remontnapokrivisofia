import { useCallback, useEffect, useRef, useState } from 'react';
import type { Testimonial } from '@/lib/content';
import { cn } from '@/lib/utils';

/** Пет звезди. Рисуват се, а не се смятат — оценката идва от самия отзив. */
function Stars({ rating }: { rating: number }) {
  const filled = Math.round(Math.min(Math.max(rating, 0), 5));
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${filled} от 5 звезди`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          className={cn('h-4 w-4', index < filled ? 'text-brick-500' : 'text-graphite-300')}
          aria-hidden="true"
        >
          <path
            d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

function Quote({ testimonial }: { testimonial: Testimonial }) {
  const place = [testimonial.district, testimonial.service].filter(Boolean).join(' · ');

  return (
    <figure className="flex h-full flex-col border border-graphite-200 bg-white p-6 sm:p-7">
      <Stars rating={testimonial.rating ?? 5} />
      <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-graphite-700">
        {testimonial.body}
      </blockquote>
      <figcaption className="mt-5 border-t border-graphite-200 pt-4">
        <p className="font-display text-[0.9375rem] font-bold text-graphite-900">{testimonial.name}</p>
        {place ? <p className="mt-0.5 text-[0.8125rem] text-graphite-500">{place}</p> : null}
        {testimonial.source ? (
          <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-graphite-400">
            {testimonial.link ? (
              <a href={testimonial.link} target="_blank" rel="noopener noreferrer" className="hover:text-brick-600">
                {testimonial.source}
              </a>
            ) : (
              testimonial.source
            )}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}

function Arrow({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Предишни отзиви' : 'Следващи отзиви'}
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
 * Отзивите като карусел. Плъзгането е нативно (scroll-snap), затова работи и
 * без JavaScript — стрелките и точките само помагат. Празна база значи скрита
 * секция: измислени отзиви не се рисуват.
 */
export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const total = Math.max(1, Math.ceil(node.scrollWidth / node.clientWidth));
    setPages(total);
    setPage(Math.round(node.scrollLeft / node.clientWidth));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const goTo = (index: number) => {
    const node = track.current;
    if (!node) return;
    const target = Math.min(Math.max(index, 0), pages - 1);
    node.scrollTo({ left: target * node.clientWidth, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div>
      <ul
        ref={track}
        onScroll={measure}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <li
            key={`${item.name}-${index}`}
            className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
          >
            <Quote testimonial={item} />
          </li>
        ))}
      </ul>

      {pages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-1.5" role="tablist" aria-label="Страници с отзиви">
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
            <Arrow direction="prev" onClick={() => goTo(page - 1)} />
            <Arrow direction="next" onClick={() => goTo(page + 1)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
