export function ProductSkeleton() {
    return (
      <section className="product-grid" aria-label="Đang tải danh sách món...">
        {[1, 2, 3, 4].map((item) => (
          <article key={item} className="product-card animate-pulse" aria-hidden="true">
            <div className="product-card__image bg-neutral-200" style={{ minHeight: "180px" }} />
            <div className="product-card__copy">
              <div className="product-card__title-row flex justify-between items-center gap-2">
                <div className="h-5 bg-neutral-200 rounded w-2/3" />
                <div className="h-5 bg-neutral-200 rounded w-1/4" />
              </div>
              <div className="h-4 bg-neutral-100 rounded w-full mt-2" />
              <div className="h-4 bg-neutral-200 rounded w-1/3 mt-4" />
            </div>
          </article>
        ))}
      </section>
    );
  }