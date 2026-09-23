'use client';

import * as React from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { blockRangeAction, unblockRangeAction } from '@/actions/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

/**
 * Управление диапазоном дат: закрыть (перекрыть) или открыть (освободить).
 * Открытие не трогает дни подтверждённых броней.
 */
export function RangeBlockForm({
  properties,
  defaultPropertyId,
}: {
  properties: Array<{ id: string; title: string }>;
  defaultPropertyId: string;
}) {
  const [mode, setMode] = React.useState<'block' | 'unblock'>('block');
  const [error, setError] = React.useState<string | null>(null);
  const [okMessage, setOkMessage] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const propertyId = String(fd.get('propertyId'));
    const from = String(fd.get('from'));
    const to = String(fd.get('to'));
    setError(null);
    setOkMessage(null);
    startTransition(async () => {
      try {
        if (mode === 'block') {
          const res = await blockRangeAction(propertyId, from, to);
          if (!res.ok) setError(res.error ?? 'Ошибка');
          else setOkMessage('Диапазон закрыт');
        } else {
          const res = await unblockRangeAction(propertyId, from, to);
          if (!res.ok) setError(res.error ?? 'Ошибка');
          else setOkMessage(res.removed ? `Освобождено дней: ${res.removed}` : 'В диапазоне не было ручных перекрытий');
        }
      } catch {
        setError('Ошибка сети — диапазон не изменён');
      }
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { value: 'block', label: 'Закрыть даты', icon: Lock },
            { value: 'unblock', label: 'Открыть даты', icon: LockOpen },
          ] as const
        ).map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={
              'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ' +
              (mode === m.value
                ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground')
            }
          >
            <m.icon className="h-4 w-4" /> {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rb-property">Объект</Label>
        <Select id="rb-property" name="propertyId" defaultValue={defaultPropertyId}>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rb-from">С даты</Label>
          <Input id="rb-from" name="from" type="date" required defaultValue={today} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-to">По дату</Label>
          <Input id="rb-to" name="to" type="date" required />
        </div>
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      {okMessage && <p className="text-sm font-medium text-emerald-600">{okMessage}</p>}
      <Button type="submit" variant={mode === 'unblock' ? 'outline' : 'default'} disabled={pending}>
        {mode === 'block' ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
        {pending ? 'Применяем…' : mode === 'block' ? 'Закрыть даты' : 'Открыть даты'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Открытие не затрагивает дни подтверждённых броней — их видно красным в календаре.
      </p>
    </form>
  );
}
