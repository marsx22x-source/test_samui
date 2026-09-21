import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { MotionProvider } from '@/components/motion-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — аренда недвижимости`,
    template: `%s · ${SITE_NAME}`,
  },
  description: 'Аренда домов, вилл и апартаментов напрямую от владельца. Онлайн-календарь занятости и бронирование за 1 минуту.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
