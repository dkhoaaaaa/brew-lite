"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "../../features/products/components/ProductCard";
import { getProducts } from "../../lib/products-api";
import type { ProductSummary } from "../../types/product";

export default function MenuPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  function retry() {
    setLoading(true);
    setError(null);
    setRetryCount((count) => count + 1);
  }

  useEffect(() => {
    let active = true;
    getProducts()
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Không tải được danh sách sản phẩm.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retryCount]);

  return (
    <main className="page-shell menu-page">
      <header className="menu-heading">
        <p className="eyebrow">BrewLite · menu</p>
        <h1>Món quen,<br /><em>chọn theo cách bạn thích.</em></h1>
        <p>Chọn một món để xem size và topping hiện có.</p>
      </header>

      {loading && <p className="state-message" role="status">Đang tải menu...</p>}
      {error && (
        <section className="state-panel" role="alert">
          <p className="eyebrow">Menu chưa sẵn sàng</p>
          <h2>Không thể tải danh sách món.</h2>
          <p>{error}</p>
          <div className="state-actions">
            <button className="button button--dark" onClick={retry} type="button">Thử lại</button>
          </div>
        </section>
      )}
      {!loading && !error && products.length === 0 && (
        <section className="state-panel">
          <p className="eyebrow">Menu trống</p>
          <h2>Chưa có sản phẩm để hiển thị.</h2>
          <button className="button button--dark" onClick={retry} type="button">Tải lại menu</button>
        </section>
      )}
      {!loading && !error && products.length > 0 && (
        <section className="product-grid" aria-label="Danh sách sản phẩm">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </section>
      )}
    </main>
  );
}