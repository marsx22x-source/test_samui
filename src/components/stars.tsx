import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Ряд из 5 звёзд: закрашенных по значению rating (0–5). */
export function Stars({ value, className, size = 'sm' }: { value: number; className?: string; size?: 'sm' | 'md' }) {
  const full = Math.round(Math.max(0, Math.min(5, value)));
  const dim = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`Оценка ${value} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(dim, i < full ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted')}
        />
      ))}
    </span>
  );
}
