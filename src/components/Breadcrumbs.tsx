import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface Crumb {
  name: string;
  slug: string;
}

export function Breadcrumbs({ trail, onDark = false }: { trail: Crumb[]; onDark?: boolean }) {
  if (trail.length < 2) return null;
  const last = trail[trail.length - 1];

  return (
    <nav aria-label="Пътека" className="mb-6">
      <ol
        className={cn(
          'flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem]',
          onDark ? 'text-graphite-400' : 'text-graphite-500',
        )}
      >
        {trail.slice(0, -1).map((crumb) => (
          <li key={crumb.slug} className="flex items-center gap-2">
            <Link
              to={crumb.slug}
              className={cn('underline-offset-4 hover:underline', onDark ? 'hover:text-brick-300' : 'hover:text-brick-600')}
            >
              {crumb.name}
            </Link>
            <span aria-hidden="true" className={onDark ? 'text-graphite-600' : 'text-graphite-300'}>
              /
            </span>
          </li>
        ))}
        <li className={onDark ? 'text-graphite-200' : 'text-graphite-700'} aria-current="page">
          {last.name}
        </li>
      </ol>
    </nav>
  );
}
