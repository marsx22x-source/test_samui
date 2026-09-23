import { cn } from '@/lib/utils';
import { formatRuDate } from '@/lib/dates';
import { AVAILABILITY_HORIZON_DAYS, type CardAvailability } from '@/lib/availability';

export function availabilityLabel(a: CardAvailability): { text: string; free: boolean } {
  if (a.freeDays === 0) {
    return { text: `Занято на ${AVAILABILITY_HORIZON_DAYS} дн.`, free: false };
  }
  if (a.isFree) {
    return {
      text: a.freeDays >= AVAILABILITY_HORIZON_DAYS ? 'Свободно' : `Свободно · ${a.freeDays} дн.`,
      free: true,
    };
  }
  return { text: `Свободно с ${formatRuDate(a.freeFromIso)}`, free: false };
}

/**
 * Индикатор доступности. Для свободного объекта — зелёный бейдж
 * с «дышащей» точкой (animate-ping), для занятого — нейтральный тёмный.
 * variant="onImage" — поверх фотографии (с тенью и blur).
 */
export function AvailabilityBadge({
  availability,
  variant = 'chip',
  className,
}: {
  availability: CardAvailability;
  variant?: 'chip' | 'onImage';
  className?: string;
}) {
  const { text, free } = availabilityLabel(availability);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-xs font-semibold',
        variant === 'chip' && 'px-3 py-1',
        variant === 'onImage' && 'px-2.5 py-1 shadow-soft backdrop-blur',
        free ? 'bg-emerald-600/95 text-white' : 'bg-stone-800/85 text-white',
        className,
      )}
    >
      {free ? (
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-white/60" aria-hidden />
      )}
      {text}
    </span>
  );
}
