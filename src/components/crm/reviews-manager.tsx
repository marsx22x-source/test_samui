'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { Trash2, MessageSquarePlus } from 'lucide-react';
import { createReviewAction, deleteReviewAction, type ReviewFormState } from '@/actions/reviews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Stars } from '@/components/stars';
import { formatRuDate } from '@/lib/dates';

export type ReviewRow = {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  stayDate: string | null;
  createdAt: string;
};

export function ReviewsManager({ propertyId, reviews }: { propertyId: string; reviews: ReviewRow[] }) {
  const [state, formAction, pending] = useFormState<ReviewFormState, FormData>(createReviewAction, {});
  const [busy, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state.saved]);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="grid gap-3 rounded-xl border border-dashed p-3 sm:grid-cols-[1fr_120px_150px]">
        <input type="hidden" name="propertyId" value={propertyId} />
        <div className="space-y-1.5">
          <Label htmlFor="rev-name">Имя гостя *</Label>
          <Input id="rev-name" name="authorName" required minLength={2} placeholder="Анна" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rev-rating">Оценка *</Label>
          <Select id="rev-rating" name="rating" defaultValue="5">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} ★</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rev-date">Месяц проживания</Label>
          <Input id="rev-date" name="stayDate" type="date" />
        </div>
        <div className="space-y-1.5 sm:col-span-3">
          <Label htmlFor="rev-text">Отзыв *</Label>
          <Textarea id="rev-text" name="text" required minLength={10} rows={3} placeholder="Что понравилось гостям…" />
        </div>
        {state.error && (
          <p className="text-sm font-medium text-destructive sm:col-span-3">{state.error}</p>
        )}
        {state.saved && (
          <p className="text-sm font-medium text-emerald-600 sm:col-span-3">Отзыв добавлен и уже виден на сайте ✓</p>
        )}
        <div className="sm:col-span-3">
          <Button type="submit" disabled={pending}>
            <MessageSquarePlus className="h-4 w-4" /> {pending ? 'Сохранение…' : 'Добавить отзыв'}
          </Button>
        </div>
      </form>

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          Отзывов пока нет — добавьте первый
        </p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {r.authorName} <Stars value={r.rating} />
                  <span className="text-xs font-normal text-muted-foreground">
                    {r.stayDate ? formatRuDate(r.stayDate) : formatRuDate(r.createdAt)}
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.text}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-destructive"
                disabled={busy}
                onClick={() => {
                  if (window.confirm('Удалить отзыв?')) {
                    startTransition(async () => void (await deleteReviewAction(r.id)));
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
