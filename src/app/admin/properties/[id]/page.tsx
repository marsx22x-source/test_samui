import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil, CalendarDays, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { updatePropertyAction } from '@/actions/properties';
import { PropertyForm } from '@/components/crm/property-form';
import { ImageManager } from '@/components/crm/image-manager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Редактирование объекта' };

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [property, owners] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true } } },
    }),
    prisma.user.findMany({ where: { role: 'OWNER' }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!property) notFound();

  const boundUpdate = updatePropertyAction.bind(null, property.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{property.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/property/${property.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" /> На сайте
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/calendar">
              <CalendarDays className="h-4 w-4" /> Календарь
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/properties">← К списку</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Карточка объекта
          </CardTitle>
          <CardDescription>Изменения сразу отображаются на сайте</CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyForm
            action={boundUpdate}
            owners={owners}
            defaults={{
              id: property.id,
              title: property.title,
              description: property.description,
              propertyType: property.propertyType,
              pricePerNight: property.pricePerNight,
              location: property.location,
              address: property.address,
              maxGuests: property.maxGuests,
              bedrooms: property.bedrooms,
              area: property.area,
              amenities: property.amenities,
              isPublished: property.isPublished,
              ownerId: property.ownerId,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Фотографии</CardTitle>
          <CardDescription>Первая фотография — обложка в каталоге. До 8 МБ, jpg/png/webp.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageManager propertyId={property.id} images={property.images} />
        </CardContent>
      </Card>
    </div>
  );
}
