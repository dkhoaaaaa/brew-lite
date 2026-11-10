export function ProductSkeleton() {
  return (
    <section
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 mb-8"
      aria-label="Đang tải danh sách món..."
    >
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <article
          key={item}
          className="bg-white border border-[#D8CFC2] rounded-2xl overflow-hidden flex flex-col animate-pulse"
          aria-hidden="true"
        >
          <div className="aspect-[4/5] bg-neutral-200" />
          <div className="p-3 sm:p-4 flex flex-col flex-1 space-y-2.5">
            <div className="h-4 sm:h-5 bg-neutral-200 rounded-md w-3/4" />
            <div className="h-3 bg-neutral-100 rounded-md w-full" />
            <div className="h-3 bg-neutral-100 rounded-md w-2/3" />
            <div className="mt-auto pt-2 flex items-center justify-between gap-2">
              <div className="h-4 bg-neutral-200 rounded-md w-1/3" />
              <div className="h-7 w-16 bg-neutral-200 rounded-full" />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
