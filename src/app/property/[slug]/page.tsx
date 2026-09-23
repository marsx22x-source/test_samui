import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Users, BedDouble, Ruler, MapPin, Wifi, Check } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { computeAvailability } from '@/lib/availability';
import { AvailabilityBadge } from '@/components/availability-badge';
import { SiteHeader } from '@/components/site-header';
import { ImageGallery } from '@/components/image-gallery';
import { BookingForm } from '@/components/booking-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { toISODate } from '@/lib/dates';

export const dynamic = 'force-dynamic';

async function getProperty(slug: string) {
  return prisma.property.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="container py-6">
        <div className="mb-4 animate-fade-in-up">
          <h1 className="text-2xl font-bold sm:text-3xl">{property.title}</h1>
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

            <div className="grid animate-fade-in-up grid-cols-2 gap-3 [animation-delay:140ms] sm:grid-cols-4">
              {[
                { icon: Users, value: `до ${property.maxGuests}`, label: 'гостей' },
                { icon: BedDouble, value: String(property.bedrooms), label: 'спален' },
                { icon: Ruler, value: property.area ? `${property.area} м²` : '—', label: 'площадь' },
                { icon: Wifi, value: `${formatPrice(property.pricePerNight)} ₽`, label: 'за ночь' },
              ].map((item) => (
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
