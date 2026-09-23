import Link from 'next/link';
import { Search, RotateCcw } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Stagger, StaggerItem } from '@/components/stagger';
import { LeadCard, type LeadRow } from '@/components/crm/lead-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatusValue } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Заявки' };

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status = LEAD_STATUSES.includes(sp.status as LeadStatusValue)
    ? (sp.status as LeadStatusValue)
    : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { guestName: { contains: q, mode: 'insensitive' as const } },
            { guestPhone: { contains: q, mode: 'insensitive' as const } },
            { comment: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [leads, counts] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { property: { select: { title: true, slug: true } } },
    }),
    prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const total = counts.reduce((acc, c) => acc + c._count._all, 0);
  const qs = q ? `&q=${encodeURIComponent(q)}` : '';

  const leadRows: LeadRow[] = leads.map((l) => ({
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
    propertyTitle: l.property.title,
    propertySlug: l.property.slug,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Заявки гостей</h1>

      {/* Поиск по гостям */}
      <form method="get" className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3 shadow-soft">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="min-w-56 flex-1 space-y-1.5">
          <label htmlFor="lead-q" className="text-sm font-medium">Поиск</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="lead-q" name="q" defaultValue={sp.q ?? ''} placeholder="Имя, телефон или слово из комментария…" className="pl-9" />
          </div>
        </div>
        <Button type="submit" size="sm">
          <Search className="h-4 w-4" /> Найти
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/admin/leads">
            <RotateCcw className="h-4 w-4" /> Сбросить
          </Link>
        </Button>
      </form>

      {/* Статусы (сохраняют поисковый запрос) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href={`/admin/leads${q ? `?q=${encodeURIComponent(q)}` : ''}`}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            !status ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent',
          )}
        >
          Все ({total})
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/leads?status=${s}${qs}`}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              status === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent',
            )}
          >
            {LEAD_STATUS_LABELS[s]} ({countBy[s] ?? 0})
          </Link>
        ))}
      </div>

      {leadRows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          {q ? 'По этому запросу заявок нет' : 'Заявок нет'}
        </div>
      ) : (
        <Stagger className="space-y-3">
          {leadRows.map((lead) => (
            <StaggerItem key={lead.id}>
              <LeadCard lead={lead} admin />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
