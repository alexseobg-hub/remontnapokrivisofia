import type { Testimonial } from '@/lib/content';
import { cn } from '@/lib/utils';
import { Carousel } from './Carousel';

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

/**
 * Отзивите като карусел. Празна база значи скрита секция: измислени отзиви
 * не се рисуват.
 */
export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  return (
    <Carousel
      items={items}
      keyOf={(item, index) => `${item.name}-${index}`}
      renderItem={(item) => <Quote testimonial={item} />}
      labels={{ prev: 'Предишни отзиви', next: 'Следващи отзиви', pages: 'Страници с отзиви' }}
    />
  );
}
