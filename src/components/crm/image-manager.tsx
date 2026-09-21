'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { Upload, Trash2, Star } from 'lucide-react';
import { uploadImagesAction, deleteImageAction, setCoverImageAction } from '@/actions/properties';
import { Button } from '@/components/ui/button';

export function ImageManager({ propertyId, images }: { propertyId: string; images: Array<{ id: string; url: string }> }) {
  const boundUpload = React.useMemo(() => uploadImagesAction.bind(null, propertyId), [propertyId]);
  const [state, formAction, pending] = useFormState(boundUpload, {});
  const [busy, startTransition] = React.useTransition();

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center">
        <input
          type="file"
          name="files"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          required
          className="flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
        />
        <Button type="submit" disabled={pending || busy}>
          <Upload className="h-4 w-4" /> {pending ? 'Загрузка…' : 'Загрузить'}
        </Button>
      </form>
      {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.id} className="overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center justify-between gap-1 p-2">
                {i === 0 ? (
                  <span className="text-xs font-medium text-primary">Обложка</span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => startTransition(async () => void (await setCoverImageAction(img.id)))}
                  >
                    <Star className="h-3.5 w-3.5" /> Обложка
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm('Удалить фото?')) {
                      startTransition(async () => void (await deleteImageAction(img.id)));
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Фотографий пока нет — загрузите первую
        </p>
      )}
    </div>
  );
}
