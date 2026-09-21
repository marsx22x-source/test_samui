'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Галерея: переключение фото — crossfade + лёгкий зум (framer-motion). */
export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = React.useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        Фотографий пока нет
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-secondary shadow-soft">
        <AnimatePresence initial={false}>
          <motion.img
            key={images[active]}
            src={images[active]}
            alt={title}
            aria-hidden={false}
            loading={active === 0 ? 'eager' : 'lazy'}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 backdrop-blur-sm">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                aria-label={`Фото ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {images.map((url, i) => (
            <motion.button
              key={url}
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActive(i)}
              className={cn(
                'overflow-hidden rounded-lg border-2 transition-colors duration-200',
                i === active ? 'border-primary shadow-glow' : 'border-transparent opacity-75 hover:opacity-100',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
