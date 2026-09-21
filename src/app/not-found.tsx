import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen animate-fade-in-up flex-col items-center justify-center gap-4 p-8 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Страница не найдена</h1>
      <p className="text-sm text-muted-foreground">Возможно, объект снят с публикации или ссылка устарела.</p>
      <Button asChild>
        <Link href="/">Вернуться в каталог</Link>
      </Button>
    </div>
  );
}
