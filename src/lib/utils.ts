import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Числата в българския текст се пишат с интервал за хилядите. */
export function bg(n: number): string {
  return new Intl.NumberFormat('bg-BG').format(n);
}
