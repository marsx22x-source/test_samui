import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Users, BedDouble, Bath, Ruler, Waves, Wallet, MapPin, Wifi, Check, X,
  Clock, PawPrint, Cigarette, CalendarDays, MessageSquareQuote,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { computeAvailability } from '@/lib/availability';
import { AvailabilityBadge } from '@/components/availability-badge';
import { SiteHeader } from '@/components/site-header';
import { ImageGallery } from '@/components/image-gallery';
import { BookingForm } from '@/components/booking-form';
import { Stars } from '@/components/stars';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { formatRuDate, toISODate } from '@/lib/dates';

export const dynamic = 'force-dynamic';

async function getProperty(slug: string) {
  return prisma.property.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      reviews: { orderBy: { createdAt: 'desc' } },
      calendarDays: {
        where: { date: { gte: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z') } },
        select: { date: true, status: true },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug).catch(() => null);
  return { title: property?.title ?? 'Объект' };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property || !property.isPublished) notFound();

  const occupied: Record<string, 'BOOKED' | 'BLOCKED'> = {};
  for (const day of property.calendarDays) {
    occupied[toISODate(day.date)] = day.status;
  }

  const ratingSum = property.reviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = property.reviews.length > 0 ? ratingSum / property.reviews.length : null;

  const specs = [
    { icon: Users, value: `до ${property.maxGuests}`, label: 'гостей' },
    { icon: BedDouble, value: String(property.bedrooms), label: 'спален' },
    { icon: Bath, value: String(property.bathrooms), label: 'ванных' },
    { icon: Ruler, value: property.area ? `${property.area} м²` : '—', label: 'площадь' },
    property.distanceToBeach != null
      ? { icon: Waves, value: property.distanceToBeach >= 1000 ? `${(property.distanceToBeach / 1000).toFixed(1)} км` : `${property.distanceToBeach} м`, label: 'до пляжа' }
      : null,
    { icon: Wallet, value: `${formatPrice(property.pricePerNight)} ₽`, label: 'за ночь' },
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="container py-6">
        <div className="mb-4 animate-fade-in-up">
          <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-bold sm:text-3xl">
            {property.title}
            {avgRating != null && (
              <span className="flex items-center gap-1.5 text-base font-semibold">
                <Stars value={avgRating} />
                <span className="text-amber-500">{avgRating.toFixed(1)}</span>
                <span className="font-normal text-muted-foreground">({property.reviews.length})</span>
              </span>
            )}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {property.location}, {property.address}
            </span>
            <Badge variant="secondary">{property.propertyType}</Badge>
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Левая колонка */}
          <div className="min-w-0 space-y-6">
            <div className="animate-fade-in-up [animation-delay:80ms]">
              <ImageGallery images={property.images.map((img) => img.url)} title={property.title} />
            </div>

            <div className="grid animate-fade-in-up grid-cols-2 gap-3 [animation-delay:140ms] sm:grid-cols-3">
              {specs.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border bg-card p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <item.icon className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-1 text-sm font-semibold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            <Card className="animate-fade-in-up [animation-delay:200ms]">
              <CardHeader>
                <CardTitle>Описание</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{property.description}</p>
              </CardContent>
            </Card>

            {property.amenities.length > 0 && (
              <Card className="animate-fade-in-up [animation-delay:260ms]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-primary" /> Удобства
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {property.amenities.map((a) => (
                      <li
                        key={a}
                        className="flex items-center gap-2 rounded-lg bg-secondary/60 px-2.5 py-2 text-sm transition-colors hover:bg-accent/60"
                      >
                        <Check className="h-4 w-4 shrink-0 text-primary" /> {a}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Правила жилья */}
            <Card className="animate-fade-in-up [animation-delay:300ms]">
              <CardHeader>
                <CardTitle>Правила жилья</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {property.checkInTime && (
                    <li className="flex items-center gap-2.5 rounded-lg bg-secondary/50 px-3 py-2.5 text-sm">
                      <Clock className="h-4 w-4 shrink-0 text-primary" />
                      Заезд с {property.checkInTime}
                      {property.checkOutTime ? ` · выезд до ${property.checkOutTime}` : ''}
                    </li>
                  )}
                  {property.minNights > 1 && (
                    <li className="flex items-center gap-2.5 rounded-lg bg-secondary/50 px-3 py-2.5 text-sm">
                      <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                      Минимальный срок — {property.minNights} ноч.
                    </li>
                  )}
                  {property.deposit ? (
                    <li className="flex items-center gap-2.5 rounded-lg bg-secondary/50 px-3 py-2.5 text-sm">
                      <Wallet className="h-4 w-4 shrink-0 text-primary" />
                      Залог {formatPrice(property.deposit)} ₽ (возвращается при выезде)
                    </li>
                  ) : null}
                  <li className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${property.allowPets ? 'bg-emerald-50 text-emerald-800' : 'bg-secondary/50'}`}>
                    <PawPrint className="h-4 w-4 shrink-0 text-primary" />
                    {property.allowPets ? 'Можно с животными' : 'Без животных'}
                    {!property.allowPets && <X className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
                  </li>
                  <li className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${property.allowSmoking ? 'bg-emerald-50 text-emerald-800' : 'bg-secondary/50'}`}>
                    <Cigarette className="h-4 w-4 shrink-0 text-primary" />
                    {property.allowSmoking ? 'Курение разрешено' : 'Курение запрещено'}
                    {!property.allowSmoking && <X className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Отзывы */}
            <Card className="animate-fade-in-up [animation-delay:340ms]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4 text-primary" /> Отзывы гостей
                </CardTitle>
                {avgRating != null && (
                  <CardDescription className="flex items-center gap-2 pt-1">
                    <Stars value={avgRating} size="md" />
                    <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                    <span>· {property.reviews.length} отзывов</span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {property.reviews.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Отзывов пока нет — станьте первым гостем этого объекта
                  </p>
                ) : (
                  property.reviews.slice(0, 6).map((r) => (
                    <div key={r.id} className="rounded-xl border bg-card p-4 shadow-soft">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {r.authorName}
                        <Stars value={r.rating} />
                        <span className="text-xs font-normal text-muted-foreground">
                          {r.stayDate ? `проживание: ${formatRuDate(r.stayDate)}` : formatRuDate(r.createdAt)}
                        </span>
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{r.text}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Правая колонка — форма бронирования (липкая на десктопе) */}
          <aside className="animate-fade-in-up [animation-delay:160ms] lg:sticky lg:top-20 lg:h-fit">
            <Card className="border-primary/15 shadow-lift">
              <CardHeader>
                <CardTitle>Забронировать</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(property.pricePerNight)} ₽ / ночь · выберите даты в календаре
                </p>
                <div className="pt-1">
                  <AvailabilityBadge availability={computeAvailability(new Set(Object.keys(occupied)))} />
                </div>
              </CardHeader>
              <CardContent>
                <BookingForm
                  propertyId={property.id}
                  occupied={occupied}
                  maxGuests={property.maxGuests}
                  pricePerNight={property.pricePerNight}
                  minNights={property.minNights}
                  deposit={property.deposit}
                  checkInTime={property.checkInTime}
                  checkOutTime={property.checkOutTime}
                />
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <footer className="border-t bg-gradient-to-b from-card to-secondary/50 py-6 text-center text-sm text-muted-foreground">
        <div className="mx-auto mb-3 h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />
        © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
