'use client';

import * as React from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { togglePublishAction, deletePropertyAction } from '@/actions/properties';
import { Button } from '@/components/ui/button';

export function PropertyRowActions({ id, isPublished }: { id: string; isPublished: boolean }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        title={isPublished ? 'Снять с публикации' : 'Опубликовать'}
        onClick={() => startTransition(async () => void (await togglePublishAction(id)))}
      >
        {isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive"
        disabled={pending}
        onClick={() => {
          if (window.confirm('Удалить объект вместе с фото, календарём и заявками?')) {
            startTransition(async () => void (await deletePropertyAction(id)));
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
