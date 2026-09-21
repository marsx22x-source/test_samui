import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { toISODate } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Мои объекты' };

export default async function OwnerPropertiesPage() {
  const user = await requireRole(['OWNER']);
  const todayIso = new Date().toISOString().slice(0, 10);

  const properties = await prisma.property.findMany({
    where: { ownerId: user.id },
    orderBy: { title: 'asc' },
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      calendarDays: { where: { date: { gte: new Date(todayIso + 'T00:00:00.000Z') } }, select: { date: true } },
      _count: { select: { leads: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Мои объекты ({properties.length})</h1>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            У вас пока нет объектов. Администратор создаст их и закрепит за вами.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => {
            // считаем ближайшие 30 дней занятости
            const inMonth = new Set(p.calendarDays.map((d) => toISODate(d.date)));
            let busy = 0;
            for (let i = 0; i < 30; i++) {
              const iso = new Date(Date.parse(todayIso + 'T00:00:00.000Z') + i * 86_400_000)
                .toISOString()
                .slice(0, 10);
              if (inMonth.has(iso)) busy++;
            }
            return (
              <Card key={p.id} className="overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">нет фото</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {p.title}
                      {p.isPublished ? <Badge variant="success">На сайте</Badge> : <Badge variant="secondary">Скрыт</Badge>}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      <MapPin className="mr-1 inline h-3.5 w-3.5" />
                      {p.location} · {formatPrice(p.pricePerNight)} ₽/ночь · заявок: {p._count.leads} · занято в 30 дн.: {busy}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/owner/calendar/${p.id}`}>
                      <CalendarDays className="h-4 w-4" /> Календарь
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
