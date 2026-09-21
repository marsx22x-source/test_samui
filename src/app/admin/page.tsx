import Link from 'next/link';
import { Building2, Inbox, CalendarX2, TrendingUp } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { AnimatedNumber } from '@/components/animated-number';
import { LeadCard, type LeadRow } from '@/components/crm/lead-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [propertiesCount, newLeadsCount, ownersCount, recentLeads] = await Promise.all([
    prisma.property.count(),
    prisma.lead.count({ where: { status: 'NEW' } }),
    prisma.user.count({ where: { role: 'OWNER' } }),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { property: { select: { title: true, slug: true } } },
    }),
  ]);

  // Заполненность календаря на ближайшие 30 дней
  const from = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
  const to = new Date(from.getTime() + 30 * 86_400_000);
  const [busyDays, totalDays] = await Promise.all([
    prisma.calendarDay.count({ where: { date: { gte: from, lte: to } } }),
    propertiesCount > 0 ? Promise.resolve(propertiesCount * 30) : Promise.resolve(0),
  ]);
  const occupancy = totalDays > 0 ? Math.round((busyDays / totalDays) * 100) : 0;

  const stats = [
    { label: 'Объектов', num: propertiesCount, suffix: '', icon: Building2, href: '/admin/properties' },
    { label: 'Новых заявок', num: newLeadsCount, suffix: '', icon: Inbox, href: '/admin/leads' },
    { label: 'Владельцев', num: ownersCount, suffix: '', icon: TrendingUp, href: '/admin/owners' },
    { label: 'Занятость 30 дн.', num: occupancy, suffix: '%', icon: CalendarX2, href: '/admin/calendar' },
  ];

  const leadRows: LeadRow[] = recentLeads.map((l) => ({
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Дашборд</h1>
        <Button asChild size="sm">
          <Link href="/admin/properties/new">+ Новый объект</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Link key={s.label} href={s.href} className="group">
            <Card
              style={{ animationDelay: `${i * 70}ms` }}
              className="animate-fade-in-up transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lift"
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-gradient-to-br from-primary/15 to-teal-600/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-110">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">
                    <AnimatedNumber value={s.num} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="animate-fade-in-up [animation-delay:280ms]">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Последние заявки</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/leads">Все заявки →</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {leadRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Заявок пока нет</p>
          ) : (
            leadRows.map((lead, i) => (
              <div key={lead.id} style={{ animationDelay: `${320 + i * 60}ms` }} className="animate-fade-in-up">
                <LeadCard lead={lead} admin />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
