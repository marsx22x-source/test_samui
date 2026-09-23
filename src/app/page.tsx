import Link from 'next/link';
import { Search, MapPin, SlidersHorizontal, CalendarCheck, ShieldCheck, Zap, ChevronDown } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { PropertyCard } from '@/components/property-card';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { AMENITIES, PROPERTY_TYPES } from '@/lib/constants';
import { isIsoDate, toISODate } from '@/lib/dates';
import { computeAvailability, AVAILABILITY_HORIZON_DAYS } from '@/lib/availability';

export const dynamic = 'force-dynamic';

type Filters = {
  q?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  guests?: string;
  dateFrom?: string;
  dateTo?: string;
  amenity?: string | string[];
  pets?: string;
  baths?: string;
  beach?: string;
  sort?: string;
};

const SORT_OPTIONS = [
  { value: 'new', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Цена: сначала дешевле' },
  { value: 'price_desc', label: 'Цена: сначала дороже' },
];

const BEACH_OPTIONS = [
  { value: '', label: 'Любое' },
  { value: '300', label: 'до 300 м' },
  { value: '1000', label: 'до 1 км' },
  { value: '3000', label: 'до 3 км' },
];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const sp = await searchParams;

  const q = sp.q?.trim();
  const amenitiesSel = (Array.isArray(sp.amenity) ? sp.amenity : sp.amenity ? [sp.amenity] : [])
    .filter((a) => (AMENITIES as readonly string[]).includes(a));
  const baths = Number(sp.baths) || 0;
  const beach = Number(sp.beach) || 0;
  const orderBy =
    sp.sort === 'price_asc'
      ? { pricePerNight: 'asc' as const }
      : sp.sort === 'price_desc'
        ? { pricePerNight: 'desc' as const }
        : { createdAt: 'desc' as const };

  const where = {
    isPublished: true as const,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
            { location: { contains: q, mode: 'insensitive' as const } },
            { address: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(sp.type ? { propertyType: sp.type } : {}),
    ...(sp.minPrice || sp.maxPrice
      ? {
          pricePerNight: {
            ...(sp.minPrice ? { gte: Number(sp.minPrice) || 0 } : {}),
            ...(sp.maxPrice ? { lte: Number(sp.maxPrice) || 10_000_000 } : {}),
          },
        }
      : {}),
    ...(sp.guests ? { maxGuests: { gte: Number(sp.guests) || 1 } } : {}),
    ...(baths >= 2 ? { bathrooms: { gte: baths } } : {}),
    ...(beach > 0 ? { distanceToBeach: { lte: beach } } : {}),
    ...(sp.pets === 'on' ? { allowPets: true } : {}),
    ...(amenitiesSel.length > 0 ? { amenities: { hasEvery: amenitiesSel } } : {}),
    // «свободные даты»: исключаем объекты, у которых в диапазоне есть занятые дни
    ...(sp.dateFrom && sp.dateTo && isIsoDate(sp.dateFrom) && isIsoDate(sp.dateTo) && sp.dateFrom < sp.dateTo
      ? {
          calendarDays: {
            none: {
              date: {
                gte: new Date(`${sp.dateFrom}T00:00:00.000Z`),
                lte: new Date(`${sp.dateTo}T00:00:00.000Z`),
              },
            },
          },
        }
      : {}),
  };

  const [properties, totalCount, locations] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      take: 60,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        reviews: { select: { rating: true } },
      },
    }),
    prisma.property.count({ where: { isPublished: true } }),
    prisma.property.findMany({
      where: { isPublished: true },
      select: { location: true },
      distinct: ['location'],
    }),
  ]);

  // Занятость на ближайший горизонт — для индикаторов «Свободно» на карточках
  const todayIso = new Date().toISOString().slice(0, 10);
  const horizonStart = new Date(`${todayIso}T00:00:00.000Z`);
  const horizonEnd = new Date(horizonStart.getTime() + AVAILABILITY_HORIZON_DAYS * 86_400_000);

  const busyRows =
    properties.length > 0
      ? await prisma.calendarDay.findMany({
          where: {
            propertyId: { in: properties.map((p) => p.id) },
            date: { gte: horizonStart, lte: horizonEnd },
          },
          select: { propertyId: true, date: true },
        })
      : [];

  const busyByProperty = new Map<string, Set<string>>();
  for (const row of busyRows) {
    let set = busyByProperty.get(row.propertyId);
    if (!set) {
      set = new Set();
      busyByProperty.set(row.propertyId, set);
    }
    set.add(toISODate(row.date));
  }

  const isNewThreshold = Date.now() - 14 * 86_400_000;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="container flex-1 py-6">
        {/* Hero */}
        <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-teal-700 to-teal-800 px-6 py-10 text-white shadow-lift sm:px-10 sm:py-14">
          <div
            className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 animate-blob rounded-full bg-teal-300/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 right-0 h-64 w-64 animate-blob rounded-full bg-amber-300/20 blur-3xl [animation-delay:4s]"
            aria-hidden
          />
          <div className="relative max-w-2xl animate-fade-in-up">
            <h1 className="text-2xl font-bold leading-tight sm:text-4xl">
              Жильё для отдыха — напрямую от владельцев
            </h1>
            <p className="mt-2 text-sm text-white/85 sm:text-base">
              Онлайн-календарь занятости, честные цены и бронирование за одну минуту.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: Zap, text: `${totalCount} объектов` },
                { icon: MapPin, text: `${locations.length} локаций` },
                { icon: CalendarCheck, text: 'Живой календарь' },
                { icon: ShieldCheck, text: 'Без посредников' },
              ].map((chip, i) => (
                <span
                  key={chip.text}
                  style={{ animationDelay: `${120 + i * 70}ms` }}
                  className="inline-flex animate-fade-in-up items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors hover:bg-white/25"
                >
                  <chip.icon className="h-3.5 w-3.5" /> {chip.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Фильтры */}
        <form
          method="get"
          className="mb-6 animate-fade-in-up rounded-2xl border bg-card p-4 shadow-soft [animation-delay:80ms]"
        >
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-primary" /> Поиск жилья
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="f-q">Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="f-q" name="q" defaultValue={sp.q ?? ''} placeholder="Вилла, бассейн, Чавенг…" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-type">Тип</Label>
              <Select id="f-type" name="type" defaultValue={sp.type ?? ''}>
                <option value="">Любой</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-guests">Гостей</Label>
              <Select id="f-guests" name="guests" defaultValue={sp.guests ?? ''}>
                <option value="">Любое</option>
                {[1, 2, 3, 4, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>{n}+</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-min">Цена от, ₽</Label>
              <Input id="f-min" name="minPrice" type="number" min={0} defaultValue={sp.minPrice ?? ''} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-max">до, ₽</Label>
              <Input id="f-max" name="maxPrice" type="number" min={0} defaultValue={sp.maxPrice ?? ''} placeholder="∞" />
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="f-from">Свободно с</Label>
                <Input id="f-from" name="dateFrom" type="date" defaultValue={sp.dateFrom ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-to">по</Label>
                <Input id="f-to" name="dateTo" type="date" defaultValue={sp.dateTo ?? ''} />
              </div>
            </div>
          </div>

          {/* Дополнительные фильтры (без JS — нативный details) */}
          <details className="group mt-3 rounded-xl border bg-secondary/40 [&[open]]:shadow-inner">
            <summary className="flex cursor-pointer select-none items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
              Ещё фильтры
              {(amenitiesSel.length > 0 || sp.pets === 'on' || baths >= 2 || beach > 0) && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {[...amenitiesSel.length ? [amenitiesSel.length] : [], ...(sp.pets === 'on' ? ['питомцы'] : []), ...(baths >= 2 ? ['ванные'] : []), ...(beach > 0 ? ['пляж'] : [])].join(', ')}
                </span>
              )}
            </summary>
            <div className="space-y-4 border-t px-3 py-3">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Удобства</p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-6">
                  {AMENITIES.map((a) => (
                    <label
                      key={a}
                      className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-2.5 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent/50"
                    >
                      <input
                        type="checkbox"
                        name="amenity"
                        value={a}
                        defaultChecked={amenitiesSel.includes(a)}
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="f-baths">Ванных</Label>
                  <Select id="f-baths" name="baths" defaultValue={sp.baths ?? ''}>
                    <option value="">Любое</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-beach">До пляжа</Label>
                  <Select id="f-beach" name="beach" defaultValue={sp.beach ?? ''}>
                    {BEACH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-pets">Питомцы</Label>
                  <label
                    className="flex h-10 cursor-pointer items-center gap-2 rounded-md border bg-card px-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent/50"
                  >
                    <input
                      type="checkbox"
                      name="pets"
                      defaultChecked={sp.pets === 'on'}
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                    />
                    Можно с животными
                  </label>
                </div>
              </div>
            </div>
          </details>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="submit">
              <Search className="h-4 w-4" /> Найти
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href="/">Сбросить</Link>
            </Button>
            <div className="ml-auto w-full sm:w-56">
                  <Label htmlFor="f-sort" className="sr-only">Сортировка</Label>
                  <Select id="f-sort" name="sort" defaultValue={sp.sort ?? 'new'}>
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </div>
          </div>
        </form>

        {/* Результаты */}
        {properties.length === 0 ? (
          <div className="animate-fade-in rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            По заданным фильтрам ничего не найдено. Попробуйте расширить поиск.
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">Найдено объектов: {properties.length}</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((p, i) => {
                const ratingSum = p.reviews.reduce((acc, r) => acc + r.rating, 0);
                const rating = p.reviews.length > 0 ? Math.round((ratingSum / p.reviews.length) * 10) / 10 : null;
                return (
                  <PropertyCard
                    key={p.id}
                    style={{ animationDelay: `${Math.min(i, 7) * 60}ms` }}
                    className="animate-fade-in-up"
                    property={{
                      id: p.id,
                      title: p.title,
                      slug: p.slug,
                      location: p.location,
                      propertyType: p.propertyType,
                      pricePerNight: p.pricePerNight,
                      maxGuests: p.maxGuests,
                      bedrooms: p.bedrooms,
                      bathrooms: p.bathrooms,
                      area: p.area,
                      amenities: p.amenities,
                      coverUrl: p.images[0]?.url ?? null,
                      isNew: p.createdAt.getTime() > isNewThreshold,
                      availability: computeAvailability(busyByProperty.get(p.id) ?? new Set()),
                      rating,
                      reviewsCount: p.reviews.length,
                    }}
                  />
                );
              })}
            </div>
          </>
        )}
      </main>

      <footer className="border-t bg-gradient-to-b from-card to-secondary/50 py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto mb-3 h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />
        © {new Date().getFullYear()} — аренда недвижимости напрямую от владельцев
      </footer>
    </div>
  );
}
