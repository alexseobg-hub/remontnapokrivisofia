import { Link } from 'react-router-dom';
import type { Project, Testimonial, ContentPage } from '@/lib/content';
import { formatDate } from '@/lib/content';
import { site, has, valueOr } from '@/config/site';
import { Picture, ImagePlaceholder } from './ui';
import { cn } from '@/lib/utils';

/* ---------- Обект ---------- */

export function ProjectCard({ project }: { project: Project }) {
  const facts = [
    project.district,
    project.area ? `${project.area} м²` : '',
    project.buildingType,
  ].filter(Boolean);

  return (
    <Link to={project.slug} className="group block border border-graphite-200 bg-white transition-colors hover:border-graphite-900">
      <div className="aspect-[4/3] overflow-hidden bg-graphite-800">
        {project.imageAfter ? (
          <Picture image={project.imageAfter} alt={`${project.title} — след ремонта`} sizes="(min-width: 768px) 380px, 100vw" />
        ) : (
          <ImagePlaceholder label="Снимки от обекта скоро" className="h-full w-full" />
        )}
      </div>
      <div className="p-5">
        {project.services.length > 0 ? (
          <p className="mb-2 font-display text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brick-600">
            {project.services[0]}
          </p>
        ) : null}
        <h3 className="font-display text-lg font-extrabold leading-snug text-graphite-900 group-hover:text-brick-700">
          {project.title}
        </h3>
        {facts.length > 0 ? <p className="mt-2 text-sm text-graphite-500">{facts.join(' · ')}</p> : null}
      </div>
    </Link>
  );
}

/* ---------- Отзив ---------- */

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const meta = [testimonial.district, testimonial.service, formatDate(testimonial.date)].filter(Boolean);

  return (
    <figure className="card card-topline flex h-full flex-col">
      <blockquote className="flex-1 text-[0.9375rem] leading-relaxed text-graphite-700">
        {testimonial.body}
      </blockquote>
      <figcaption className="mt-5 border-t border-graphite-200 pt-4">
        <p className="font-display text-[0.9375rem] font-bold text-graphite-900">{testimonial.name}</p>
        {meta.length > 0 ? <p className="mt-0.5 text-[0.8125rem] text-graphite-500">{meta.join(' · ')}</p> : null}
        {testimonial.source ? (
          <p className="mt-1 text-[0.75rem] uppercase tracking-[0.1em] text-graphite-400">
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

/* ---------- Страница като карта ---------- */

export function PageCard({ page, topline = false }: { page: ContentPage; topline?: boolean }) {
  return (
    <Link
      to={page.slug}
      className={cn(
        'group relative block border border-graphite-200 bg-white p-6 transition-colors hover:border-graphite-900',
        topline && 'card-topline',
      )}
    >
      <h3 className="font-display text-lg font-extrabold leading-snug text-graphite-900 group-hover:text-brick-700">
        {page.name}
      </h3>
      {page.description ? (
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite-600">{page.description}</p>
      ) : null}
      <span aria-hidden="true" className="mt-4 inline-block font-display text-sm font-bold text-brick-600">
        Виж повече →
      </span>
    </Link>
  );
}

/* ---------- Автор ---------- */

export function AuthorBox({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={cn('border border-graphite-200 bg-sand-50 p-6', compact ? 'flex gap-4' : 'sm:flex sm:gap-6')}>
      <div className={cn('shrink-0 overflow-hidden bg-graphite-800', compact ? 'h-14 w-14' : 'h-20 w-20')}>
        {has('authorPhoto') ? (
          <img src={site.authorPhoto} alt={site.authorName} width={80} height={80} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <ImagePlaceholder className="h-full w-full" />
        )}
      </div>
      <div className={compact ? '' : 'mt-4 sm:mt-0'}>
        <p className="font-display text-base font-extrabold text-graphite-900">{site.authorName}</p>
        <p className="text-[0.8125rem] text-brick-700">{valueOr('authorRole', 'Автор')}</p>
        {has('authorBio') ? (
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite-600">{site.authorBio}</p>
        ) : null}
        <Link
          to="/avtori/aleksandar-ivanov"
          className="mt-3 inline-block font-display text-sm font-bold text-brick-600 hover:text-brick-700"
        >
          Повече за автора →
        </Link>
      </div>
    </aside>
  );
}
