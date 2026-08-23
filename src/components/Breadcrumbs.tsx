import { Link } from 'react-router-dom';

export interface Crumb {
  name: string;
  slug: string;
}

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  if (trail.length < 2) return null;
  const last = trail[trail.length - 1];

  return (
    <nav aria-label="Пътека" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-graphite-500">
        {trail.slice(0, -1).map((crumb) => (
          <li key={crumb.slug} className="flex items-center gap-2">
            <Link to={crumb.slug} className="hover:text-brick-600 hover:underline underline-offset-4">
              {crumb.name}
            </Link>
            <span aria-hidden="true" className="text-graphite-300">
              /
            </span>
          </li>
        ))}
        <li className="text-graphite-700" aria-current="page">
          {last.name}
        </li>
      </ol>
    </nav>
  );
}
