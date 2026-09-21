import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ToggleCalendar } from '@/components/calendar/toggle-calendar';
import { RangeBlockForm } from '@/components/crm/range-block-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toISODate } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Календарь занятости' };

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const sp = await searchParams;
  const properties = await prisma.property.findMany({
    orderBy: { title: 'asc' },
    select: { id: true, title: true },
  });

  const selectedId = sp.property && properties.some((p) => p.id === sp.property) ? sp.property : properties[0]?.id;
  const selected = selectedId
    ? await prisma.property.findUnique({
        where: { id: selectedId },
        include: {
          calendarDays: {
            where: { date: { gte: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z') } },
          },
        },
      })
    : null;

  const occupied: Record<string, 'BOOKED' | 'BLOCKED'> = {};
  if (selected) {
    for (const day of selected.calendarDays) occupied[toISODate(day.date)] = day.status;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Общий календарь бронирований</h1>

      {properties.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Нет объектов — календарь появится после создания первого объекта
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {properties.map((p) => (
              <Link
                key={p.id}
                href={`/admin/calendar?property=${p.id}`}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  p.id === selectedId ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent',
                )}
              >
                {p.title}
              </Link>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> {selected?.title}
                </CardTitle>
                <CardDescription>
                  Тап по дню — переключить «Свободно / Занято». Дни подтверждённых броней (кроме принудительного снятия) не удаляются владельцем.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selected && <ToggleCalendar propertyId={selected.id} initialOccupied={occupied} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Принудительное перекрытие диапазона</CardTitle>
                <CardDescription>Мгновенно закрывает все дни диапазона (например, ремонт или личный въезд владельца)</CardDescription>
              </CardHeader>
              <CardContent>
                {selected && <RangeBlockForm properties={properties} defaultPropertyId={selected.id} />}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
