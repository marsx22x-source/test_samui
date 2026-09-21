import { Building2, Trash2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createOwnerAction, updateOwnerAction, deleteOwnerAction } from '@/actions/owners';
import { OwnerForm } from '@/components/crm/owner-form';
import { OwnerRowActions } from '@/components/crm/owner-row-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Владельцы' };

export default async function AdminOwnersPage() {
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { properties: true } } },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Владельцы ({owners.length})</h1>

      <Card>
        <CardHeader>
          <CardTitle>Создать владельца</CardTitle>
          <CardDescription>
            Email и пароль — для входа в CRM. Telegram chat_id и WhatsApp телефон — для мгновенных уведомлений о заявках.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OwnerForm action={createOwnerAction} submitLabel="Создать владельца" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {owners.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            Владельцев пока нет
          </div>
        ) : (
          owners.map((o) => (
            <Card key={o.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span>
                    {o.name}{' '}
                    <span className="font-normal text-muted-foreground">· {o.email}</span>{' '}
                    <Badge variant="secondary" className="ml-1">
                      <Building2 className="mr-1 h-3 w-3" /> {o._count.properties}
                    </Badge>
                  </span>
                  <OwnerRowActions
                    ownerId={o.id}
                    name={o.name}
                    email={o.email}
                    telegramChatId={o.telegramChatId}
                    whatsappPhone={o.whatsappPhone}
                    propertiesCount={o._count.properties}
                  />
                </CardTitle>
                <CardDescription>
                  Telegram: {o.telegramChatId ?? '—'} · WhatsApp: {o.whatsappPhone ?? '—'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OwnerForm
                  action={updateOwnerAction.bind(null, o.id)}
                  defaults={{
                    id: o.id,
                    name: o.name,
                    email: o.email,
                    telegramChatId: o.telegramChatId,
                    whatsappPhone: o.whatsappPhone,
                  }}
                  submitLabel="Обновить"
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
