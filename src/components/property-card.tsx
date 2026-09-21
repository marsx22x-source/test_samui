'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, BedDouble, MapPin, ArrowUpRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type PropertyCardData = {
  id: string;
  title: string;
  slug: string;
  location: string;
  propertyType: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  coverUrl: string | null;
};

/**
 * Карточка объекта каталога: hover-подъём через framer-motion (whileHover),
 * зум фото и тени — CSS-переходы.
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
            <div className="flex h-full items-center justify-center text-muted-foreground">Нет фото</div>
          )}
          {/* Градиент и бейджи поверх фото */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80" />
          <Badge className="absolute left-3 top-3 border-transparent bg-white/90 text-foreground shadow-soft backdrop-blur">
            {property.propertyType}
          </Badge>
          <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-primary shadow-soft">
            {formatPrice(property.pricePerNight)} ₽<span className="font-normal text-muted-foreground"> / ночь</span>
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="flex items-start justify-between gap-2 font-semibold leading-snug">
            <span className="line-clamp-1">{property.title}</span>
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
          </h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="line-clamp-1">{property.location}</span>
          </p>
          <p className="mt-auto flex items-center gap-3 pt-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> до {property.maxGuests}
            </span>
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms} спал.
            </span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
