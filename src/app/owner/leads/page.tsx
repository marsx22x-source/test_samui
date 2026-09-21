import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { Stagger, StaggerItem } from '@/components/stagger';
import { LeadCard, type LeadRow } from '@/components/crm/lead-card';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Заявки по моим объектам' };

export default async function OwnerLeadsPage() {
  const user = await requireRole(['OWNER']);

  const leads = await prisma.lead.findMany({
    where: { property: { ownerId: user.id } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { property: { select: { title: true, slug: true } } },
  });

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
      <h1 className="text-xl font-bold">Заявки по моим объектам ({leadRows.length})</h1>

      {leadRows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Заявок пока нет — они появятся здесь автоматически
        </div>
      ) : (
        <Stagger className="space-y-3">
          {leadRows.map((lead) => (
            <StaggerItem key={lead.id}>
              <LeadCard lead={lead} admin={false} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
