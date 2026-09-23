import Link from 'next/link';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ToggleCalendar } from '@/components/calendar/toggle-calendar';
import { RangeBlockForm } from '@/components/crm/range-block-form';
import type { LeadRow } from '@/components/crm/lead-card';
import { LeadStatusBadge } from '@/components/crm/lead-status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatRuDate, toISODate } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Календарь занятости' };

const DAY_MS = 86_400_000;
const STRIP_DAYS = 30;

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const properties = await prisma.property.findMany({
    orderBy: { title: 'asc' },
    select: { id: true, title: true },
  });

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayStart = new Date(`${todayIso}T00:00:00.000Z`);
  const horizonEnd = new Date(todayStart.getTime() + STRIP_DAYS * DAY_MS);

  // Занятость всех объектов на 30 дней — для сводки
  const allBusy =
    properties.length > 0
      ? await prisma.calendarDay.findMany({
          where: { propertyId: { in: properties.map((p) => p.id) }, date: { gte: todayStart, lte: horizonEnd } },
          select: { propertyId: true, date: true },
        })
      : [];

  const busyIsoBy = new Map<string, Set<string>>();
  for (const row of allBusy) {
    let set = busyIsoBy.get(row.propertyId);
    if (!set) {
      set = new Set();
      busyIsoBy.set(row.propertyId, set);
    }
    set.add(toISODate(row.date));
  }

  const selectedId = sp.property && properties.some((p) => p.id === sp.property) ? sp.property : properties[0]?.id;

  // Месяц из URL (?month=YYYY-MM) для шаринга ссылок
  const monthMatch = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(sp.month ?? '');
  const initialYear = monthMatch ? Number(monthMatch[1]) : undefined;
  const initialMonth = monthMatch ? Number(monthMatch[2]) - 1 : undefined;
  const monthParam = monthMatch ? `&month=${sp.month}` : '';

  const selected = selectedId
    ? await prisma.property.findUnique({
        where: { id: selectedId },
        include: {
          calendarDays: {
            where: { date: { gte: todayStart } },
            include: { lead: { select: { guestName: true, guestPhone: true } } },
          },
          leads: {
            where: { dateTo: { gte: todayStart } },
            orderBy: { dateFrom: 'asc' },
            take: 10,
          },
        },
      })
    : null;

  const occupied: Record<string, 'BOOKED' | 'BLOCKED'> = {};
  const dayTitles: Record<string, string> = {};
  if (selected) {
    for (const day of selected.calendarDays) {
      const iso = toISODate(day.date);
      occupied[iso] = day.status;
      if (day.lead) {
        dayTitles[iso] = `Бронь: ${day.lead.guestName} · ${day.lead.guestPhone}`;
      }
    }
  }

  const leadRows: LeadRow[] =
    selected?.leads.map((l) => ({
      id: l.id,
      guestName: l.guestName,
      guestPhone: l.guestPhone,
      messenger: l.messenger,
      dateFrom: l.dateFrom,
      dateTo: l.dateTo,
      guests: l.guests,
      comment: l.comment,
      status: l.status,
      createdAt: l.createdAt,
      propertyTitle: selected.title,
      propertySlug: selected.slug,
    })) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Общий календарь бронирований</h1>

      {properties.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Нет объектов — календарь появится после создания первого объекта
        </div>
      ) : (
        <>
          {/* Сводка занятости всех объектов (30 дней) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" /> Сводка на 30 дней
              </CardTitle>
              <CardDescription>Красные клетки — занятые дни. Клик по объекту открывает его календарь.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((p) => {
                const busySet = busyIsoBy.get(p.id) ?? new Set<string>();
                const count = busySet.size;
                const pct = Math.round((count / STRIP_DAYS) * 100);
                const isActive = p.id === selectedId;
                return (
                  <Link
                    key={p.id}
                    href={`/admin/calendar?property=${p.id}${monthParam}`}
                    className={cn(
                      'rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
                      isActive ? 'border-primary bg-accent/40 shadow-soft' : 'bg-card',
                    )}
                  >
                    <p className="flex items-center justify-between gap-2 text-sm font-semibold">
                      <span className="line-clamp-1">{p.title}</span>
                      <span className={cn('shrink-0 text-xs font-bold', pct >= 70 ? 'text-rose-600' : 'text-muted-foreground')}>
                        {pct}%
                      </span>
                    </p>
                    <div className="mt-2 flex gap-[2px]" title={`Занято ${count} из ${STRIP_DAYS} дней`}>
                      {Array.from({ length: STRIP_DAYS }, (_, i) => {
                        const iso = toISODate(new Date(todayStart.getTime() + i * DAY_MS));
                        return (
                          <span
                            key={i}
                            className={cn(
                              'h-4 flex-1 rounded-[2px]',
                              busySet.has(iso) ? 'bg-rose-500/80' : 'bg-emerald-600/20',
                            )}
                          />
                        );
                      })}
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Календарь выбранного объекта */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> {selected?.title}
                </CardTitle>
                <CardDescription>
                  Тап по дню — переключить «Свободно / Занято». Наведите на красный день — покажет гостя брони.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selected && (
                  <ToggleCalendar
                    propertyId={selected.id}
                    initialOccupied={occupied}
                    dayTitles={dayTitles}
                    initialYear={initialYear}
                    initialMonth={initialMonth}
                  />
                )}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Управление диапазоном</CardTitle>
                  <CardDescription>Закрыть даты (ремонт, личный въезд) или открыть ранее перекрытые</CardDescription>
                </CardHeader>
                <CardContent>
                  {selected && <RangeBlockForm properties={properties} defaultPropertyId={selected.id} />}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Предстоящие заезды</CardTitle>
                  <CardDescription>Заявки по этому объекту, включая текущие проживание</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {leadRows.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Заявок нет</p>
                  ) : (
                    leadRows.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between gap-2 rounded-xl border bg-card p-3 shadow-soft">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{lead.guestName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatRuDate(lead.dateFrom)} — {formatRuDate(lead.dateTo)} · {lead.guests} гост.
                          </p>
                        </div>
                        <LeadStatusBadge status={lead.status} />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
