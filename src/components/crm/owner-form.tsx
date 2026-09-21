'use client';

import { useFormState } from 'react-dom';
import { UserPlus } from 'lucide-react';
import type { OwnerFormState } from '@/actions/owners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type OwnerFormDefaults = {
  id?: string;
  name?: string;
  email?: string;
  telegramChatId?: string | null;
  whatsappPhone?: string | null;
};

type ActionFn = (state: OwnerFormState, formData: FormData) => Promise<OwnerFormState>;

export function OwnerForm({
  action,
  defaults,
  submitLabel,
}: {
  action: ActionFn;
  defaults?: OwnerFormDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useFormState(action, {});
  const d = defaults;
  const isNew = !d?.id;

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`name-${d?.id ?? 'new'}`}>Имя *</Label>
        <Input id={`name-${d?.id ?? 'new'}`} name="name" required defaultValue={d?.name} placeholder="Иван Петров" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`email-${d?.id ?? 'new'}`}>Email (логин) *</Label>
        <Input id={`email-${d?.id ?? 'new'}`} name="email" type="email" required defaultValue={d?.email} placeholder="owner@mail.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`password-${d?.id ?? 'new'}`}>{isNew ? 'Пароль *' : 'Новый пароль (оставьте пустым, чтобы не менять)'}</Label>
        <Input id={`password-${d?.id ?? 'new'}`} name="password" type="password" minLength={8} required={isNew} placeholder="Минимум 8 символов" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`tg-${d?.id ?? 'new'}`}>Telegram chat_id</Label>
        <Input id={`tg-${d?.id ?? 'new'}`} name="telegramChatId" defaultValue={d?.telegramChatId ?? ''} placeholder="123456789" />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor={`wa-${d?.id ?? 'new'}`}>WhatsApp телефон</Label>
        <Input id={`wa-${d?.id ?? 'new'}`} name="whatsappPhone" defaultValue={d?.whatsappPhone ?? ''} placeholder="79991234567" />
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive md:col-span-2">{state.error}</p>
      )}
      {state.saved && !state.error && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 md:col-span-2">Сохранено ✓</p>
      )}

      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          <UserPlus className="h-4 w-4" /> {pending ? 'Сохранение…' : (submitLabel ?? 'Сохранить')}
        </Button>
      </div>
    </form>
  );
}
