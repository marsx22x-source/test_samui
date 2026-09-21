import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ToggleCalendar } from '@/components/calendar/toggle-calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toISODate } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Календарь объекта' };

export default async function OwnerCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['OWNER']);
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      calendarDays: {
        where: { date: { gte: new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z') } },
      },
    },
  });
  if (!property) notFound();
  if (property.ownerId !== user.id) redirect('/owner');

  const occupied: Record<string, 'BOOKED' | 'BLOCKED'> = {};
  for (const day of property.calendarDays) occupied[toISODate(day.date)] = day.status;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Календарь занятости</h1>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/owner">
            <ArrowLeft className="h-4 w-4" /> Мои объекты
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{property.title}</CardTitle>
          <CardDescription>
            Один тап по дню — переключить «Свободно / Занято». Изменения мгновенно видны на сайте.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleCalendar propertyId={property.id} initialOccupied={occupied} />
        </CardContent>
      </Card>
    </div>
  );
}
