'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { deleteOwnerAction } from '@/actions/owners';
import { Button } from '@/components/ui/button';

export function OwnerRowActions({
  ownerId,
  name,
  propertiesCount,
}: {
  ownerId: string;
  name: string;
  email: string;
  telegramChatId: string | null;
  whatsappPhone: string | null;
  propertiesCount: number;
}) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive"
      disabled={pending}
      onClick={() => {
        if (propertiesCount > 0) {
          window.alert(`За владельцем «${name}» закреплено объектов: ${propertiesCount}. Сначала переназначьте их.`);
          return;
        }
        if (window.confirm(`Удалить владельца «${name}»?`)) {
          startTransition(async () => {
            const res = await deleteOwnerAction(ownerId);
            if (!res.ok) window.alert(res.error);
          });
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
