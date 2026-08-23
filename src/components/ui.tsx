import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { MediaImage } from '@/lib/content';

/* ---------- Ленти ---------- */

export type Tone = 'white' | 'sand' | 'dark';

const toneClass: Record<Tone, string> = {
  white: 'band-white',
  sand: 'band-sand',
  dark: 'band-dark',
};

/**
 * Всяка секция е лента по цялата ширина. Тоновете се редуват бяло → пясък → графит,
 * за да има ритъм по страницата вместо плосък бял фон с откъснати блокчета.
 */
export function Section({
  tone = 'white',
  tight = false,
  id,
  className,
  children,
}: {
  tone?: Tone;
  tight?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn(tone === 'dark' ? 'band-dark' : toneClass[tone], tight ? 'band-tight' : 'band', className)}>
      <div className="shell">{children}</div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lede,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: 'left' | 'center';
}) {
  return (
    <header className={cn('mb-10', align === 'center' && 'mx-auto max-w-2xl text-center')}>
      {eyebrow ? <p className={cn('eyebrow', align === 'center' && 'justify-center')}>{eyebrow}</p> : null}
      <h2 className="text-display-lg">{title}</h2>
      {lede ? <p className={cn('lede mt-4', align === 'center' && 'mx-auto')}>{lede}</p> : null}
    </header>
  );
}

/* ---------- Бутони ---------- */

type ButtonVariant = 'primary' | 'ghost' | 'onDark';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  onDark: 'btn-on-dark',
};

export function CtaLink({
  to,
  href,
  variant = 'primary',
  large = false,
  className,
  children,
  ...rest
}: {
  to?: string;
  href?: string;
  variant?: ButtonVariant;
  large?: boolean;
  className?: string;
  children: ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const classes = cn(variantClass[variant], large && 'btn-lg', className);
  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  );
}

/* ---------- Карти ---------- */

export function Card({
  to,
  topline = false,
  className,
  children,
}: {
  to?: string;
  topline?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const classes = cn(to ? 'card-link' : 'card', topline && 'card-topline', className);
  if (to) {
    return (
      <Link to={to} className={cn(classes, 'group block')}>
        {children}
      </Link>
    );
  }
  return <article className={classes}>{children}</article>;
}

/* ---------- Проза от Notion ---------- */

export function Prose({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  return <div className={cn('prose-roof', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ---------- Изображения ---------- */

/**
 * Когато няма истинска снимка, рисуваме геометричен блок с покривен мотив.
 * Никога сток фотография на чужд покрив, представена като наш обект.
 */
export function ImagePlaceholder({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden bg-graphite-800', className)} aria-hidden="true">
      <svg viewBox="0 0 400 260" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="260" fill="#1C2128" />
        <g stroke="#2A3038" strokeWidth="1">
          {Array.from({ length: 14 }, (_, row) =>
            Array.from({ length: 22 }, (__, col) => (
              <path
                key={`${row}-${col}`}
                d={`M${col * 20 + (row % 2 ? 10 : 0)} ${row * 20} h20 v14 a10 6 0 0 1 -20 0 z`}
                fill={row % 3 === 0 && col % 5 === 0 ? '#232A32' : 'none'}
              />
            )),
          )}
        </g>
        <path d="M0 210 200 96l200 114v50H0z" fill="#14181D" />
        <path d="M186 104h28l6 10h-40z" fill="#C74A17" opacity="0.85" />
      </svg>
      {label ? (
        <span className="relative z-10 px-4 text-center font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-400">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function Picture({
  image,
  alt,
  className,
  sizes = '(min-width: 1024px) 560px, 100vw',
  eager = false,
}: {
  image: MediaImage | null | undefined;
  alt?: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  if (!image?.src) return <ImagePlaceholder className={className} />;
  return (
    <picture>
      {image.sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcset} sizes={sizes} />
      ))}
      <img
        src={image.src}
        alt={alt ?? image.alt ?? ''}
        width={image.width ?? undefined}
        height={image.height ?? undefined}
        loading={eager ? 'eager' : 'lazy'}
        // React 18 не разпознава camelCase варианта, затова се подава като обикновен атрибут.
        {...(eager ? { fetchpriority: 'high' } : {})}
        decoding="async"
        className={cn('h-full w-full object-cover', className)}
      />
    </picture>
  );
}

/* ---------- Дребни ---------- */

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-extrabold leading-none text-white">{value}</p>
      <p className="mt-2 text-sm text-graphite-300">{label}</p>
    </div>
  );
}

export function Hairline({ className }: { className?: string }) {
  return <hr className={cn('hairline my-0', className)} />;
}

/** Показва плейсхолдъра само в dev, за да се вижда кое още не е попълнено. */
export function DevPlaceholder({ name }: { name: string }) {
  if (!__IS_DEV__) return null;
  return (
    <span className="mx-1 inline-block border border-dashed border-brick-400 bg-brick-50 px-1.5 py-0.5 align-middle font-mono text-[0.7rem] text-brick-700">
      {name}
    </span>
  );
}
