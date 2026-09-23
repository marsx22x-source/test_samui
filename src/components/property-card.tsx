'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, BedDouble, MapPin, ArrowUpRight, Ruler } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { AvailabilityBadge } from '@/components/availability-badge';
import type { CardAvailability } from '@/lib/availability';

export type PropertyCardData = {
  id: string;
  title: string;
  slug: string;
  location: string;
  propertyType: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  area?: number | null;
  amenities: string[];
  coverUrl: string | null;
  isNew?: boolean;
  availability?: CardAvailability;
};

/**
 * Карточка объекта в каталоге: индикатор доступности, ключевые удобства,
 * площадь и цена на фото. Hover — пружинный подъём (framer-motion).
 */
export function PropertyCard({
  property,
  className,
  style,
}: {
  property: PropertyCardData;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 350, damping: 24 }}
      style={style}
      className={className}
    >
      <Link
        href={`/property/${property.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow duration-300 hover:shadow-lift"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {property.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.coverUrl}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Фотография добавляется</div>
          )}

          {/* Бейджи поверх фото */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-soft backdrop-blur">
              {property.propertyType}
            </span>
            {property.isNew && (
              <span className="rounded-full bg-amber-400/95 px-2.5 py-1 text-xs font-semibold text-stone-900 shadow-soft">
                Новое
              </span>
            )}
          </div>
          {property.availability && (
            <AvailabilityBadge availability={property.availability} variant="onImage" className="absolute right-3 top-3" />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
          <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-primary shadow-soft">
            {formatPrice(property.pricePerNight)} ₽<span className="font-normal text-muted-foreground"> / ночь</span>
          </span>
          <span className="absolute bottom-3 left-3 flex items-center gap-1 text-xs font-medium text-white/95 drop-shadow">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{property.location}</span>
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="flex items-start justify-between gap-2 font-semibold leading-snug">
            <span className="line-clamp-1">{property.title}</span>
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
          </h3>

          <p className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> до {property.maxGuests}
            </span>
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms} спал.
            </span>
            {property.area ? (
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" /> {property.area} м²
              </span>
            ) : null}
          </p>

          {property.amenities.length > 0 && (
            <p className={cn('line-clamp-1 text-xs text-muted-foreground/90')}>
              {property.amenities.slice(0, 4).join(' · ')}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
