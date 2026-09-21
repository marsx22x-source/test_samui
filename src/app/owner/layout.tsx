import { requireRole } from '@/lib/auth';
import { CrmShell, OWNER_LINKS } from '@/components/crm/crm-shell';

export const metadata = { title: 'Кабинет владельца' };

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(['OWNER']);
  return (
    <CrmShell role="OWNER" userName={user.name ?? user.email ?? ''} links={OWNER_LINKS}>
      {children}
    </CrmShell>
  );
}
