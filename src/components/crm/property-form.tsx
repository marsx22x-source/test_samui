'use client';

import { useFormState } from 'react-dom';
import { Save } from 'lucide-react';
import type { PropertyFormState } from '@/actions/properties';
import { AMENITIES, PROPERTY_TYPES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export type PropertyFormDefaults = {
  id?: string;
  title?: string;
  description?: string;
  propertyType?: string;
  pricePerNight?: number;
  deposit?: number | null;
  minNights?: number;
  location?: string;
  address?: string;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number | null;
  distanceToBeach?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  allowPets?: boolean;
  allowSmoking?: boolean;
  amenities?: string[];
  isPublished?: boolean;
  ownerId?: string;
};

type ActionFn = (state: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;

export function PropertyForm({
  action,
  owners,
  defaults,
  submitLabel = 'Сохранить',
}: {
  action: ActionFn;
  owners: Array<{ id: string; name: string; email: string }>;
  defaults?: PropertyFormDefaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useFormState(action, {});
  const d = defaults;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="title">Название *</Label>
          <Input id="title" name="title" required defaultValue={d?.title} placeholder="Вилла с видом на море" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="propertyType">Тип объекта *</Label>
          <Select id="propertyType" name="propertyType" required defaultValue={d?.propertyType ?? PROPERTY_TYPES[0]}>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pricePerNight">Цена за ночь, ₽ *</Label>
          <Input id="pricePerNight" name="pricePerNight" type="number" min={100} required defaultValue={d?.pricePerNight ?? 3000} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deposit">Залог при заезде, ₽</Label>
          <Input id="deposit" name="deposit" type="number" min={0} defaultValue={d?.deposit ?? ''} placeholder="Не требуется" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="minNights">Минимум ночей *</Label>
          <Input id="minNights" name="minNights" type="number" min={1} max={30} required defaultValue={d?.minNights ?? 1} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Локация (город/район) *</Label>
          <Input id="location" name="location" required defaultValue={d?.location} placeholder="о. Самуи, Чавенг" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Адрес *</Label>
          <Input id="address" name="address" required defaultValue={d?.address} placeholder="Улица, дом" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maxGuests">Макс. гостей *</Label>
          <Input id="maxGuests" name="maxGuests" type="number" min={1} max={50} required defaultValue={d?.maxGuests ?? 4} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bedrooms">Спален *</Label>
          <Input id="bedrooms" name="bedrooms" type="number" min={0} max={30} required defaultValue={d?.bedrooms ?? 2} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bathrooms">Ванных *</Label>
          <Input id="bathrooms" name="bathrooms" type="number" min={1} max={20} required defaultValue={d?.bathrooms ?? 1} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="area">Площадь, м²</Label>
          <Input id="area" name="area" type="number" min={0} defaultValue={d?.area ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="distanceToBeach">До пляжа, м</Label>
          <Input id="distanceToBeach" name="distanceToBeach" type="number" min={0} defaultValue={d?.distanceToBeach ?? ''} placeholder="Не указано" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ownerId">Владелец *</Label>
          <Select id="ownerId" name="ownerId" required defaultValue={d?.ownerId}>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.email})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="description">Описание *</Label>
          <Textarea id="description" name="description" required rows={6} defaultValue={d?.description} placeholder="Расскажите об объекте…" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Удобства</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {AMENITIES.map((a) => (
            <label key={a} className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent/50">
              <input type="checkbox" name="amenities" value={a} defaultChecked={d?.amenities?.includes(a)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
              {a}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-secondary/30 p-4">
        <Label>Правила жилья</Label>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="checkInTime">Заезд с</Label>
            <Input id="checkInTime" name="checkInTime" type="time" defaultValue={d?.checkInTime ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="checkOutTime">Выезд до</Label>
            <Input id="checkOutTime" name="checkOutTime" type="time" defaultValue={d?.checkOutTime ?? ''} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 self-end rounded-md border bg-card px-3 py-2.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent/50">
            <input type="checkbox" name="allowPets" defaultChecked={d?.allowPets ?? false} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            Можно с животными
          </label>
          <label className="flex cursor-pointer items-center gap-2 self-end rounded-md border bg-card px-3 py-2.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent/50">
            <input type="checkbox" name="allowSmoking" defaultChecked={d?.allowSmoking ?? false} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            Курение разрешено
          </label>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={d ? d.isPublished : true}
          className="h-4 w-4 accent-[hsl(var(--primary))]"
        />
        Опубликован на сайте
      </label>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{state.error}</p>
      )}
      {state.saved && !state.error && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Изменения сохранены и уже видны на сайте ✓</p>
      )}

      <Button type="submit" disabled={pending}>
        <Save className="h-4 w-4" /> {pending ? 'Сохранение…' : submitLabel}
      </Button>
    </form>
  );
}
