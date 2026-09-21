'use client';

import * as React from 'react';
import { deleteLeadAction, updateLeadStatusAction } from '@/actions/leads-admin';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@/lib/constants';
import { LeadStatusBadge } from './lead-status-badge';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatPhone } from '@/lib/utils';
import { formatRuDate } from '@/lib/dates';

export type LeadRow = {
  id: string;
  guestName: string;
  guestPhone: string;
  messenger: string | null;
  dateFrom: Date;
  dateTo: Date;
  guests: number;
  comment: string | null;
  status: string;
  createdAt: Date;
  propertyTitle: string;
  propertySlug: string;
};

export function LeadCard({ lead, admin }: { lead: LeadRow; admin: boolean }) {
  const [status, setStatus] = React.useState(lead.status);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const changeStatus = (next: string) => {
    const prev = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      try {
        const res = await updateLeadStatusAction(lead.id, next);
        if (!res.ok) {
          setStatus(prev);
          setError(res.error ?? 'Ошибка');
        }
      } catch {
        setStatus(prev);
        setError('Ошибка сети — статус не изменён');
      }
    });
  };

  const remove = () => {
    if (!window.confirm('Удалить заявку? Её дни в календаре будут освобождены.')) return;
    startTransition(async () => {
      try {
        const res = await deleteLeadAction(lead.id);
        if (!res.ok) setError(res.error ?? 'Ошибка');
      } catch {
        setError('Ошибка сети — заявка не удалена');
      }
    });
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">
            {lead.guestName} · <a href={`tel:${lead.guestPhone}`} className="text-primary">{formatPhone(lead.guestPhone)}</a>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {lead.propertyTitle} · {formatRuDate(lead.dateFrom)} — {formatRuDate(lead.dateTo)} · {lead.guests} гост.
            {lead.messenger ? ` · ${lead.messenger}` : ''}
          </p>
        </div>
        <LeadStatusBadge status={status} />
      </div>

      {lead.comment && (
        <p className="mt-2 rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">{lead.comment}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {lead.createdAt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}
        </span>
        {admin ? (
          <>
            <Select
              className="h-8 w-40 text-xs"
              value={status}
              disabled={pending}
              onChange={(e) => changeStatus(e.target.value)}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={remove} disabled={pending}>
              Удалить
            </Button>
          </>
        ) : null}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
