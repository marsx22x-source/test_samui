import { Badge } from '@/components/ui/badge';
import { LEAD_STATUS_LABELS } from '@/lib/constants';

const VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
  NEW: 'warning',
  IN_PROGRESS: 'secondary',
  CONFIRMED: 'success',
  REJECTED: 'destructive',
};

export function LeadStatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANTS[status] ?? 'secondary'}>{LEAD_STATUS_LABELS[status] ?? status}</Badge>;
}
