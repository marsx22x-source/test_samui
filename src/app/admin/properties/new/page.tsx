import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createPropertyAction } from '@/actions/properties';
import { PropertyForm } from '@/components/crm/property-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Новый объект' };

export default async function NewPropertyPage() {
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Новый объект</h1>
        <Link href="/admin/properties" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          ← К списку
        </Link>
      </div>

      {owners.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Сначала создайте хотя бы одного владельца в разделе{' '}
            <Link href="/admin/owners" className="text-primary underline">«Владельцы»</Link>.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Карточка объекта</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyForm action={createPropertyAction} owners={owners} submitLabel="Создать объект" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
