"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "../../features/products/components/ProductCard";
import { ProductSkeleton } from "../../features/products/components/ProductSkeleton";
import { CartIndicator } from "../../features/cart/CartIndicator";
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
          setError(
            cause instanceof Error
              ? cause.message
              : "Không tải được danh sách sản phẩm. Vui lòng kiểm tra kết nối API."
          );
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
    <main className="page-shell menu-page relative pb-28">
      {/* Tiêu đề trang Menu */}
      <header className="menu-heading">
        <p className="eyebrow">BrewLite · menu</p>
        <h1>
          Món quen,
          <br />
          <em>chọn theo cách bạn thích.</em>
        </h1>
        <p>Chọn một món để xem size và topping hiện có.</p>
      </header>

      {/* 1. Trạng thái Loading: Hiển thị Skeleton */}
      {loading && <ProductSkeleton />}

      {/* 2. Trạng thái Error: Báo lỗi khi mất kết nối Backend */}
      {!loading && error && (
        <section className="state-panel" role="alert">
          <p className="eyebrow">Menu chưa sẵn sàng</p>
          <h2>Không thể tải danh sách món.</h2>
          <p>{error}</p>
          <div className="state-actions">
            <button className="button button--dark" onClick={retry} type="button">
              Thử lại
            </button>
          </div>
        </section>
      )}

      {/* 3. Trạng thái Empty: Khi cơ sở dữ liệu trống */}
      {!loading && !error && products.length === 0 && (
        <section className="state-panel">
          <p className="eyebrow">Menu trống</p>
          <h2>Chưa có sản phẩm để hiển thị.</h2>
          <button className="button button--dark" onClick={retry} type="button">
            Tải lại menu
          </button>
        </section>
      )}

      {/* 4. Trạng thái Success: Render danh sách món dạng Lưới (Grid) */}
      {!loading && !error && products.length > 0 && (
        <section className="product-grid" aria-label="Danh sách sản phẩm">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}

      {/* Nút Xem giỏ hàng cố định theo Wireframe màn hình (1) */}
      <div className="fixed bottom-6 right-6 z-40 md:bottom-8 md:right-8">
        <CartIndicator />
      </div>
    </main>
  );
}