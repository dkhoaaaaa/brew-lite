"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ProductCard } from "../../features/products/components/ProductCard";
import { ProductSkeleton } from "../../features/products/components/ProductSkeleton";
import "../../styles/landing.css";
import type { ProductSummary } from "../../types/product";

type CategoryFilter = "ALL" | "COFFEE" | "TEA" | "CAKE";

const CATEGORY_TABS: { id: CategoryFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "COFFEE", label: "Cà phê" },
  { id: "TEA", label: "Trà" },
  { id: "CAKE", label: "Bánh" },
];

const ITEMS_PER_PAGE = 8;

function matchCategory(product: any, category: CategoryFilter): boolean {
  if (category === "ALL") return true;

  const catId = product.categoryId ? String(product.categoryId) : "";
  const catName = (product.categoryName ?? "").toLowerCase().trim();
  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();

  switch (category) {
    case "COFFEE":
      return (
        catId === "1" ||
        catName.includes("cà phê") ||
        catName.includes("coffee") ||
        text.includes("cà phê") ||
        text.includes("espresso") ||
        text.includes("americano") ||
        text.includes("latte") ||
        text.includes("cappuccino") ||
        text.includes("bạc xỉu") ||
        text.includes("cold brew")
      );

    case "TEA":
      return (
        catId === "7" ||
        catName.includes("trà") ||
        catName.includes("tea") ||
        text.includes("trà") ||
        text.includes("matcha") ||
        text.includes("ô long") ||
        text.includes("oolong")
      );

    case "CAKE":
      return (
        catId === "8" ||
        catName.includes("bánh") ||
        catName.includes("cake") ||
        catName.includes("dessert") ||
        text.includes("bánh") ||
        text.includes("croissant") ||
        text.includes("cookie") ||
        text.includes("mousse") ||
        text.includes("tiramisu")
      );

    default:
      return true;
  }
}

function MenuContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

// Trạng thái phân trang và bộ lọc
const [currentPage, setCurrentPage] = useState<number>(1);
const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(() => {
  if (categoryParam) {
    const upper = categoryParam.toUpperCase();
    if (upper === "COFFEE" || upper === "TEA" || upper === "CAKE") {
      return upper as CategoryFilter;
    }
  }
  return "ALL";
});
const [searchTerm, setSearchTerm] = useState<string>("");

// Đồng bộ khi URL param thay đổi
useEffect(() => {
  if (categoryParam) {
    const upper = categoryParam.toUpperCase();
    if (upper === "COFFEE" || upper === "TEA" || upper === "CAKE") {
      setSelectedCategory(upper as CategoryFilter);
    }
  }
}, [categoryParam]);

  function retry(): void {
    setLoading(true);
    setError(null);
    setRetryCount((count) => count + 1);
  }

  // Tải danh sách sản phẩm từ backend
  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch("http://localhost:3001/products?page=1")
      .then(async (res) => {
        if (!res.ok) throw new Error("Không thể tải danh sách sản phẩm.");
        return res.json();
      })
      .then(async (json) => {
        if (!active) return;
        
        let allItems: any[] = [];

        if (Array.isArray(json)) {
          allItems = json;
        } else if (Array.isArray(json.data)) {
          allItems = json.data;
          const totalPages = json.meta?.totalPages || 1;

          if (totalPages > 1) {
            const promises = [];
            for (let p = 2; p <= totalPages; p++) {
              promises.push(
                fetch(`http://localhost:3001/products?page=${p}`).then((r) => r.json())
              );
            }
            const results = await Promise.all(promises);
            results.forEach((r) => {
              if (Array.isArray(r.data)) allItems = [...allItems, ...r.data];
              else if (Array.isArray(r)) allItems = [...allItems, ...r];
            });
          }
        }

        // Chuẩn hóa hình ảnh trỏ về backend port 3001
        const normalizedProducts = allItems.map((p: any) => ({
          ...p,
          categoryId: p.categoryId ?? null,
          categoryName: p.categoryName ?? p.category?.name ?? null,
          imageUrl: p.imageUrl
            ? p.imageUrl.startsWith("http")
              ? p.imageUrl
              : `http://localhost:3001${p.imageUrl}`
            : null,
        }));

        setProducts(normalizedProducts);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  // Tự động về trang 1 khi lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      if (!matchCategory(product, selectedCategory)) return false;
      if (!query) return true;
      const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
      return text.includes(query);
    });
  }, [products, selectedCategory, searchTerm]);

  // Phân trang 8 món / trang
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

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

        {/* Thanh tìm kiếm & Tabs lọc danh mục */}
        <section className="menu-toolbar" aria-label="Bộ lọc và tìm kiếm món">
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
                aria-label="Xóa từ khóa"
              >
                ✕
              </button>
            )}
          </div>

          <div className="menu-tabs" role="tablist" aria-label="Danh mục món">
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

        {/* Thông tin số lượng */}
        {!loading && !error && (
          <div className="menu-results-count">
            <span>
              Hiển thị tổng số <strong>{filteredProducts.length}</strong> món (Trang {currentPage} / {totalPages}, mỗi trang 8 món)
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

        {/* Loading skeleton */}
        {loading && <ProductSkeleton />}

        {/* Báo lỗi */}
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

        {/* Không có kết quả */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="menu-state-card">
            <p className="lp-eyebrow">Kết quả tìm kiếm</p>
            <h2>Không tìm thấy sản phẩm phù hợp</h2>
            <p>Vui lòng thử chọn danh mục khác hoặc xóa từ khóa tìm kiếm.</p>
            <button
              type="button"
              className="lp-hero__cta"
              onClick={() => {
                setSelectedCategory("ALL");
                setSearchTerm("");
              }}
            >
              Xem tất cả món
            </button>
          </div>
        )}

        {/* Lưới sản phẩm */}
        {!loading && !error && paginatedProducts.length > 0 && (
          <section className="lp-product-grid" aria-label="Danh sách món">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        )}

        {/* Nút phân trang */}
        {!loading && !error && totalPages > 1 && (
          <nav className="lp-pagination" aria-label="Điều hướng trang">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
              className="lp-pagination__btn"
            >
              ← Trang trước
            </button>

            <span className="lp-pagination__info">
              Trang <strong>{currentPage}</strong> / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="lp-pagination__btn"
            >
              Trang sau →
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="menu-page-wrapper">
          <main className="lp-inner menu-container">
            <ProductSkeleton />
          </main>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
} 