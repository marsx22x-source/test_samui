import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Stagger, StaggerItem } from '@/components/stagger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PropertyRowActions } from '@/components/crm/property-row-actions';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Объекты' };

export default async function AdminPropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { name: true } },
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      _count: { select: { leads: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Объекты недвижимости ({properties.length})</h1>
        <Button asChild size="sm">
          <Link href="/admin/properties/new">
            <Plus className="h-4 w-4" /> Добавить объект
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Пока нет ни одного объекта.{' '}
            <Link href="/admin/properties/new" className="text-primary underline">Создайте первый</Link>.
          </CardContent>
        </Card>
      ) : (
        <Stagger className="space-y-3">
          {properties.map((p) => (
            <StaggerItem key={p.id}>
              <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
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
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {p.location} · {p.propertyType} · {formatPrice(p.pricePerNight)} ₽/ночь · владелец: {p.owner.name} · заявок: {p._count.leads}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/properties/${p.id}`}>
                      <Pencil className="h-4 w-4" /> <span className="hidden sm:inline">Править</span>
                    </Link>
                  </Button>
                  <PropertyRowActions id={p.id} isPublished={p.isPublished} />
                </div>
              </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
