import { requireRole } from '@/lib/auth';
import { CrmShell, ADMIN_LINKS } from '@/components/crm/crm-shell';

export const metadata = { title: 'Админка' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(['ADMIN']);
  return (
    <CrmShell role="ADMIN" userName={user.name ?? user.email ?? ''} links={ADMIN_LINKS}>
      {children}
    </CrmShell>
  );
}
