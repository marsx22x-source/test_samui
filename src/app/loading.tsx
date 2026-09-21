export default function Loading() {
  return (
    <div className="container space-y-6 py-6">
      {/* Скелетон шапки-фильтров */}
      <div className="h-40 rounded-2xl bg-gradient-to-br from-muted to-secondary" />
      <div className="rounded-2xl border bg-card p-4 shadow-soft">
        <div className="mb-3 h-4 w-32 rounded shimmer" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md shimmer" />
          ))}
        </div>
        <div className="mt-3 h-10 w-28 rounded-md shimmer" />
      </div>
      {/* Скелетон карточек */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="aspect-[4/3] shimmer" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded shimmer" />
              <div className="h-3 w-1/2 rounded shimmer" />
              <div className="h-3 w-2/3 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
