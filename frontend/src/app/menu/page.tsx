"use client";

import { useEffect, useMemo, useState } from "react";
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

function matchCategory(product: ProductSummary, category: CategoryFilter): boolean {
  if (category === "ALL") return true;
  const catName = product.categoryName?.trim().toLowerCase() ?? "";

  switch (category) {
    case "COFFEE":
      return catName.includes("cà phê") || catName.includes("coffee");
    case "TEA":
      return catName.includes("trà") || catName.includes("tea");
    case "CAKE":
      return catName.includes("bánh") || catName.includes("cake") || catName.includes("dessert");
    default:
      return true;
  }
}

export default function MenuPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Trạng thái phân trang truyền thống và bộ lọc
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  function retry(): void {
    setLoading(true);
    setError(null);
    setRetryCount((count) => count + 1);
  }

  // Tải toàn bộ sản phẩm từ tất cả các trang của Backend để phân trang 8 món/trang mượt mà
  useEffect(() => {
    let active = true;
    setLoading(true);

    // Gọi trang đầu tiên để lấy meta tổng số trang
    fetch("http://localhost:3001/products?page=1")
      .then(async (res) => {
        if (!res.ok) throw new Error("Không thể tải danh sách sản phẩm.");
        return res.json();
      })
      .then(async (json) => {
        if (!active) return;
        const totalPages = json.meta?.totalPages || 11;
        
        let allItems = json.data || [];

        // Nếu có nhiều trang, gọi song song các trang còn lại để gom đủ toàn bộ sản phẩm
        if (totalPages > 1) {
          const promises = [];
          for (let p = 2; p <= totalPages; p++) {
            promises.push(
              fetch(`http://localhost:3001/products?page=${p}`).then((r) => r.json())
            );
          }
          const results = await Promise.all(promises);
          results.forEach((r) => {
            if (r.data) allItems = [...allItems, ...r.data];
          });
        }

        // Chuẩn hóa đường dẫn hình ảnh trỏ về port 3001
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
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  // Reset về trang 1 khi thay đổi từ khóa tìm kiếm hoặc danh mục
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Lọc sản phẩm theo danh mục và từ khóa
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      if (!matchCategory(product, selectedCategory)) return false;
      if (!query) return true;
      const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
      return text.includes(query);
    });
  }, [products, selectedCategory, searchTerm]);

  // Tính toán phân trang truyền thống (8 sản phẩm / trang)
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

        {/* Thanh tìm kiếm & Tabs danh mục */}
        <section className="menu-toolbar" aria-label="Bộ lọc và tìm kiếm món">
          <div className="menu-search-box">
            <input
              type="text"
              className="menu-search-input"
              placeholder="Tìm kiếm theo tên món hoặc hương vị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="menu-search-clear" onClick={() => setSearchTerm("")}>✕</button>
            )}
          </div>

          <div className="menu-tabs" role="tablist">
            {CATEGORY_TABS.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
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
          </div>
        )}

        {/* Trạng thái Loading */}
        {loading && <ProductSkeleton />}

        {/* Trạng thái Lỗi */}
        {error && (
          <div className="menu-state-card" role="alert">
            <h2>Không thể tải danh sách thực đơn</h2>
            <p>{error}</p>
            <button className="lp-hero__cta" onClick={retry} type="button">Thử lại</button>
          </div>
        )}

        {/* Trạng thái Không có kết quả */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="menu-state-card text-center py-12">
            <h2 className="text-xl font-bold mb-2">Không tìm thấy sản phẩm phù hợp</h2>
            <p className="text-sm text-stone-600 mb-6">Vui lòng thử danh mục hoặc từ khóa khác.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("ALL");
                setSearchTerm("");
              }}
              className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Xóa bộ lọc
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

        {/* Thanh chuyển trang truyền thống (Pagination Controls) */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 pb-12">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
              className="px-4 py-2 bg-amber-800 text-white rounded-lg disabled:opacity-40 hover:bg-amber-900 transition cursor-pointer"
            >
              Trang trước
            </button>

            <span className="font-medium text-gray-700">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 bg-amber-800 text-white rounded-lg disabled:opacity-40 hover:bg-amber-900 transition cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        )}
      </main>
    </div>
  );
}