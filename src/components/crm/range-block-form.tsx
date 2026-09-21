'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';
import { blockRangeAction } from '@/actions/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

export function RangeBlockForm({
  properties,
  defaultPropertyId,
}: {
  properties: Array<{ id: string; title: string }>;
  defaultPropertyId: string;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const propertyId = String(fd.get('propertyId'));
    const from = String(fd.get('from'));
    const to = String(fd.get('to'));
    setError(null);
    setOk(false);
    startTransition(async () => {
      try {
        const res = await blockRangeAction(propertyId, from, to);
        if (!res.ok) setError(res.error ?? 'Ошибка');
        else setOk(true);
      } catch {
        setError('Ошибка сети — диапазон не закрыт');
      }
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          <Input id="rb-from" name="from" type="date" required min={today} defaultValue={today} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-to">По дату</Label>
          <Input id="rb-to" name="to" type="date" required min={today} />
        </div>
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      {ok && <p className="text-sm font-medium text-emerald-600">Диапазон закрыт</p>}
      <Button type="submit" disabled={pending}>
        <Lock className="h-4 w-4" /> {pending ? 'Закрываем…' : 'Закрыть даты'}
      </Button>
    </form>
  );
}
