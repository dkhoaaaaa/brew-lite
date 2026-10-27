"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "../../features/products/components/ProductCard";
import { ProductSkeleton } from "../../features/products/components/ProductSkeleton";
import { getProducts } from "../../lib/products-api";
import "../../styles/landing.css";
import type { ProductSummary } from "../../types/product";

type CategoryFilter = "ALL" | "COFFEE" | "TEA" | "CAKE" | "TOPPING";

const CATEGORY_TABS: { id: CategoryFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "COFFEE", label: "Cà phê" },
  { id: "TEA", label: "Trà" },
  { id: "CAKE", label: "Bánh" },
  { id: "TOPPING", label: "Topping" },
];

/**
 * Phân loại sản phẩm vào 4 nhóm dựa trên tên và mô tả
 */
function matchCategory(product: ProductSummary, category: CategoryFilter): boolean {
  if (category === "ALL") return true;

  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();

  switch (category) {
    case "COFFEE":
      return (
        text.includes("cà phê") ||
        text.includes("cafe") ||
        text.includes("espresso") ||
        text.includes("americano") ||
        text.includes("latte") ||
        text.includes("cappuccino") ||
        text.includes("macchiato") ||
        text.includes("mocha") ||
        text.includes("bạc xỉu") ||
        text.includes("cold brew") ||
        text.includes("phin")
      );

    case "TEA":
      return (
        text.includes("trà") ||
        text.includes("tea") ||
        text.includes("matcha") ||
        text.includes("ô long") ||
        text.includes("oolong") ||
        text.includes("trà sữa") ||
        text.includes("lục trà") ||
        text.includes("hồng trà")
      );

    case "CAKE":
      return (
        text.includes("bánh") ||
        text.includes("cake") ||
        text.includes("croissant") ||
        text.includes("cookie") ||
        text.includes("mousse") ||
        text.includes("tiramisu") ||
        text.includes("pastry") ||
        text.includes("cheesecake") ||
        text.includes("donut") ||
        text.includes("bread")
      );

    case "TOPPING":
      return (
        text.includes("topping") ||
        text.includes("thạch") ||
        text.includes("trân châu") ||
        text.includes("pudding") ||
        text.includes("kem cheese") ||
        text.includes("cheese foam") ||
        text.includes("sương sáo") ||
        text.includes("hạt sen") ||
        text.includes("đào ngâm") ||
        text.includes("vải")
      );

    default:
      return true;
  }
}

export default function MenuPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Trạng thái tìm kiếm và bộ lọc danh mục
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL");

  function retry() {
    setLoading(true);
    setError(null);
    setRetryCount((count) => count + 1);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);

    getProducts()
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Không tải được danh sách sản phẩm."
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

  // Lọc sản phẩm theo Category và Từ khóa tìm kiếm
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchCat = matchCategory(product, selectedCategory);
      if (!matchCat) return false;

      if (!query) return true;
      const name = product.name.toLowerCase();
      const desc = (product.description ?? "").toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }, [products, selectedCategory, searchTerm]);

  return (
    <div className="menu-page-wrapper">
      <main className="lp-inner menu-container">
        {/* Header trang Menu */}
        <header className="menu-header">
          <p className="lp-eyebrow">BrewLite · Thực đơn</p>
          <h1 className="menu-title">
            Món quen, <span>chọn theo cách của bạn.</span>
          </h1>
          <p className="menu-subtitle">
            Khám phá hương vị cà phê mộc thượng hạng, trà thanh mát và bánh tươi mỗi ngày.
          </p>
        </header>

        {/* Thanh điều khiển: Tìm kiếm & Tab Lọc danh mục */}
        <section className="menu-toolbar" aria-label="Bộ lọc và tìm kiếm món">
          {/* Ô tìm kiếm món */}
          <div className="menu-search-box">
            <svg
              className="menu-search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="menu-search-input"
              placeholder="Tìm kiếm theo tên món hoặc hương vị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Tìm kiếm sản phẩm"
            />
            {searchTerm && (
              <button
                type="button"
                className="menu-search-clear"
                onClick={() => setSearchTerm("")}
                aria-label="Xóa từ khóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tab danh mục */}
          <div className="menu-tabs" role="tablist" aria-label="Danh mục sản phẩm">
            {CATEGORY_TABS.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`menu-tab-btn ${isActive ? "is-active" : ""}`}
                  onClick={() => setSelectedCategory(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Thanh đếm số lượng kết quả */}
        {!loading && !error && (
          <div className="menu-results-count">
            <span>
              Hiển thị <strong>{filteredProducts.length}</strong> món
              {selectedCategory !== "ALL" && (
                <> trong danh mục <strong>{CATEGORY_TABS.find((t) => t.id === selectedCategory)?.label}</strong></>
              )}
              {searchTerm && (
                <> cho từ khóa &quot;<strong>{searchTerm}</strong>&quot;</>
              )}
            </span>
            {(selectedCategory !== "ALL" || searchTerm) && (
              <button
                type="button"
                className="menu-reset-btn"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchTerm("");
                }}
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Trạng thái Loading */}
        {loading && <ProductSkeleton />}

        {/* Trạng thái Lỗi */}
        {error && (
          <div className="menu-state-card" role="alert">
            <p className="lp-eyebrow">Hệ thống</p>
            <h2>Không thể tải danh sách thực đơn</h2>
            <p>{error}</p>
            <button className="lp-hero__cta" onClick={retry} type="button">
              Thử lại
            </button>
          </div>
        )}

        {/* Trạng thái Không có kết quả sau khi tìm kiếm hoặc lọc */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="menu-state-card">
            <p className="lp-eyebrow">Kết quả tìm kiếm</p>
            <h2>Không tìm thấy món phù hợp</h2>
            <p>
              Không có sản phẩm nào khớp với lựa chọn hiện tại của bạn. Vui lòng thử từ khóa khác hoặc chọn lại danh mục.
            </p>
            <button
              className="lp-hero__cta"
              onClick={() => {
                setSelectedCategory("ALL");
                setSearchTerm("");
              }}
              type="button"
            >
              Xem tất cả món
            </button>
          </div>
        )}

        {/* Lưới sản phẩm */}
        {!loading && !error && filteredProducts.length > 0 && (
          <section className="lp-product-grid" aria-label="Danh sách món">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}