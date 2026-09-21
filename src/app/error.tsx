'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] animate-fade-in-up flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Произошла ошибка на сервере. Попробуйте обновить страницу — если проблема повторяется,
        она уже записана в логи (docker compose logs -f app).
      </p>
      <Button onClick={reset}>
        <RotateCcw className="h-4 w-4" /> Попробовать снова
      </Button>
    </div>
  );
}
