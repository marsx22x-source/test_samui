import Link from 'next/link';
import { Pencil, Plus, Search, RotateCcw } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Stagger, StaggerItem } from '@/components/stagger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { PropertyRowActions } from '@/components/crm/property-row-actions';
import { formatPrice } from '@/lib/utils';
import { PROPERTY_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Объекты' };

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; owner?: string; status?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();

  const where = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { location: { contains: q, mode: 'insensitive' as const } },
            { address: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(sp.owner ? { ownerId: sp.owner } : {}),
    ...(sp.type ? { propertyType: sp.type } : {}),
    ...(sp.status === 'published' ? { isPublished: true } : sp.status === 'hidden' ? { isPublished: false } : {}),
  };

  const [properties, owners] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        _count: { select: { leads: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: 'OWNER' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

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

      {/* Фильтры */}
      <form method="get" className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-3 shadow-soft md:grid-cols-5">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="pq">Поиск</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="pq" name="q" defaultValue={sp.q ?? ''} placeholder="Название, локация, адрес…" className="pl-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-owner">Владелец</Label>
          <Select id="p-owner" name="owner" defaultValue={sp.owner ?? ''}>
            <option value="">Все</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-type">Тип</Label>
          <Select id="p-type" name="type" defaultValue={sp.type ?? ''}>
            <option value="">Любой</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-status">Статус</Label>
          <Select id="p-status" name="status" defaultValue={sp.status ?? ''}>
            <option value="">Все</option>
            <option value="published">На сайте</option>
            <option value="hidden">Скрытые</option>
          </Select>
        </div>
        <div className="col-span-2 flex gap-2 md:col-span-5">
          <Button type="submit" size="sm">
            <Search className="h-4 w-4" /> Найти
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/admin/properties">
              <RotateCcw className="h-4 w-4" /> Сбросить
            </Link>
          </Button>
        </div>
      </form>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            {q || sp.owner || sp.type || sp.status
              ? 'По заданным фильтрам ничего не найдено.'
              : 'Пока нет ни одного объекта.'}{' '}
            <Link href="/admin/properties/new" className={cn('text-primary underline')}>Создайте первый</Link>.
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
                      {p.ratingAvg != null && (
                        <Badge variant="warning">{p.ratingAvg.toFixed(1)} ★ ({p.ratingCount})</Badge>
                      )}
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
