"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "../lib/money";
import { getProducts } from "../lib/products-api";
import type { ProductSummary } from "../types/product";

// ─── 1. HERO SECTION ──────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[84vh] flex items-center overflow-hidden bg-[#140d09]" aria-label="Giới thiệu BrewLite Coffee">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/landingpage.jpg"
          alt="Barista rót sữa tạo hình latte art tại BrewLite"
          fill
          unoptimized
          priority
          sizes="100vw"
          className="object-cover object-[center_25%] sm:object-[right_35%]"
        />
        <div
          className="absolute inset-0 z-10 bg-gradient-to-b sm:bg-gradient-to-r from-[#120B07]/95 via-[#120B07]/75 to-[#120B07]/20"
          aria-hidden="true"
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-5 sm:px-8 py-20 text-white">
        <div className="max-w-xl">
          <span className="inline-block px-3.5 py-1 mb-4 text-xs font-bold tracking-[0.2em] uppercase text-[#E7DECE] bg-[#E7DECE]/15 rounded backdrop-blur-xs">
            BREWLITE COFFEE
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-bold leading-[1.18] text-[#FFF9F0] mb-4 font-heading tracking-tight drop-shadow-md">
            Đánh thức năng lượng
            <br />
            <span className="text-[#E7DECE] font-normal">Trọn vẹn từng khoảnh khắc.</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-[17px] leading-relaxed text-[#F5EFEB] mb-8 font-sans drop-shadow-sm max-w-lg">
            Mỗi ly cà phê là một trải nghiệm, mỗi hương vị là một câu chuyện.
            Thưởng thức hương vị cà phê rang mộc thượng hạng và đồ uống tươi mát.
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#E7DECE] hover:bg-white text-[#30251D] hover:text-[#140D09] text-xs sm:text-sm font-extrabold tracking-wider uppercase rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            Khám phá thực đơn
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── 2. CATEGORIES BAR (HORIZONTAL STRIP) ─────────────────────────────────────

const CATEGORY_ITEMS = [
  { id: "hot-coffee", label: "Cà phê nóng" },
  { id: "cold-coffee", label: "Cà phê lạnh" },
  { id: "tea-milktea", label: "Trà & Trà sữa" },
  { id: "dessert", label: "Bánh & Tráng miệng" },
];

function CategoriesBar() {
  return (
    <section className="bg-[#EAE1D2] border-b border-[#D8CFC2] py-6 sm:py-7" aria-label="Danh mục sản phẩm nhanh">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex flex-row items-center justify-center gap-4 sm:gap-10 lg:gap-14 flex-wrap">
          {CATEGORY_ITEMS.map((item) => (
            <Link
              key={item.id}
              href="/menu"
              className="group flex flex-col items-center gap-2.5 text-[#30251D] p-2 sm:px-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/40"
            >
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white border border-[#D8CFC2] text-[#76513B] flex items-center justify-center shadow-xs transition-colors duration-200 group-hover:bg-[#38291E] group-hover:text-[#E7DECE] group-hover:border-[#38291E]">
                {item.icon}
              </div>
              <span className="text-xs sm:text-[13px] font-bold text-[#30251D] tracking-wide text-center whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 3. PRODUCT CARD (MODERN PORTRAIT STYLE) ──────────────────────────────────

interface LandingProductCardProps {
  product: ProductSummary;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

function LandingProductCard({
  product,
  isFavorite,
  onToggleFavorite,
}: LandingProductCardProps) {
  return (
    <article className="group bg-white border border-[#D8CFC2] hover:border-[#76513B] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative">
      {/* Media Image */}
      <div className="relative aspect-[4/5] bg-[#EAE5DD] overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#F0ECE4] to-[#E2DDD4] text-[#76513B]">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-65"
            >
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
            <span className="font-heading text-xs font-bold tracking-wider opacity-70">BrewLite</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          className={`absolute top-3 right-3 w-8.5 h-8.5 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center transition-all duration-200 hover:bg-white hover:scale-110 z-10 ${
            isFavorite ? "text-red-600" : "text-[#76513B] hover:text-[#C2410C]"
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          aria-label={isFavorite ? `Bỏ yêu thích ${product.name}` : `Yêu thích ${product.name}`}
        >
          {isFavorite ? "Đã thích" : "Thích"}
        </button>
      </div>

      {/* Info Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="text-base sm:text-[17px] font-bold text-[#30251D] mb-1 font-heading line-clamp-1 hover:text-[#76513B] transition-colors">
          <Link href={`/products/${encodeURIComponent(product.id)}`}>
            {product.name}
          </Link>
        </h3>
        <p className="text-xs text-[#76513B] leading-relaxed mb-4 line-clamp-2 min-h-[36px]">
          {product.description || "Hương vị nguyên bản, đậm đà được pha chế tỉ mỉ từng chi tiết."}
        </p>

        {/* Footer: Price + Order CTA */}
        <div className="mt-auto pt-3 border-t border-[#D8CFC2]/50 flex items-center justify-between gap-2">
          <span className="text-[15px] font-extrabold text-[#30251D]">{formatPrice(product.price)}</span>
          <Link
            href={`/products/${encodeURIComponent(product.id)}`}
            className="inline-flex items-center justify-center px-4 py-1.5 bg-[#38291E] hover:bg-[#50392A] text-[#F7F5F1] text-xs font-bold rounded-full transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
            aria-label={`Đặt món ${product.name}`}
          >
            Đặt món
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── 4. FEATURED SECTION WRAPPER WITH SLIDER CONTROLS ─────────────────────────

interface ProductShowcaseProps {
  eyebrowScript?: string;
  title: string;
  products: ProductSummary[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

function ProductShowcaseSection({
  eyebrowScript,
  title,
  products,
  loading,
  error,
  onRetry,
  favorites,
  onToggleFavorite,
}: ProductShowcaseProps) {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 4;

  const maxIndex = Math.max(0, products.length - itemsPerPage);
  const visibleProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <section className="py-14 sm:py-20 bg-[#F7F5F1] border-b border-[#D8CFC2]" aria-label={title}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Section Header with Left/Right Nav */}
        <header className="text-center mb-10">
          {eyebrowScript && (
            <p className="font-heading italic text-lg sm:text-xl text-[#76513B] mb-1.5">
              {eyebrowScript}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <button
              type="button"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#D8CFC2] bg-white text-[#30251D] hover:bg-[#38291E] hover:text-white hover:border-[#38291E] disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-[#30251D] disabled:hover:border-[#D8CFC2] disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shrink-0 shadow-2xs"
              onClick={handlePrev}
              disabled={startIndex === 0 || loading || products.length <= itemsPerPage}
              aria-label="Xem sản phẩm trước"
            >
              Trước
            </button>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wider text-[#30251D] font-heading uppercase">
              {title}
            </h2>

            <button
              type="button"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#D8CFC2] bg-white text-[#30251D] hover:bg-[#38291E] hover:text-white hover:border-[#38291E] disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-[#30251D] disabled:hover:border-[#D8CFC2] disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shrink-0 shadow-2xs"
              onClick={handleNext}
              disabled={startIndex >= maxIndex || loading || products.length <= itemsPerPage}
              aria-label="Xem sản phẩm kế tiếp"
            >
              Tiếp
            </button>
          </div>
        </header>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-[#D8CFC2] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/5] bg-neutral-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                  <div className="h-4 bg-neutral-200 rounded w-1/3 pt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-10 flex flex-col items-center justify-center gap-3" role="alert">
            <p className="text-sm text-red-600">{error}</p>
            <button
              className="px-6 py-2 bg-[#38291E] hover:bg-[#50392A] text-white text-xs font-bold rounded-full transition-colors"
              onClick={onRetry}
              type="button"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-[#76513B]">Chưa có sản phẩm trong danh mục này.</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && visibleProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleProducts.map((product) => (
              <LandingProductCard
                key={product.id}
                product={product}
                isFavorite={favorites.has(product.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── 5. PROMOTIONAL COFFEE BEANS BANNER ───────────────────────────────────────

function PromotionalBanner() {
  return (
    <section className="bg-[#E7DECE] py-14 sm:py-20 border-b border-[#D8CFC2]" aria-label="Khám phá hạt cà phê nguyên chất">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_1fr] items-center gap-6 sm:gap-8">
          {/* Left Decorative Image */}
          <div className="hidden lg:block relative aspect-square rounded-2xl overflow-hidden shadow-md">
            <Image
              src="/promo-coffee.jpg"
              alt="Hạt cà phê rang xay thơm ngon"
              fill
              unoptimized
              sizes="300px"
              className="object-cover"
            />
          </div>

          {/* Center Text & CTA */}
          <div className="text-center px-4">
            <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#76513B] mb-2.5">
              Đặc quyền chất lượng
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#30251D] font-heading leading-tight mb-3.5">
              Tinh hoa hương vị trong từng giọt cà phê.
            </h2>
            <p className="text-sm sm:text-base text-[#76513B] leading-relaxed max-w-md mx-auto mb-6">
              Tuyển chọn từ những hạt cà phê Robusta và Arabica nguyên chất,
              rang mộc thủ công giữ trọn vẹn hương vị nồng nàn và hậu vị ngọt sâu.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-7 py-3 bg-[#38291E] hover:bg-[#1F150E] text-[#E7DECE] hover:text-white text-xs sm:text-sm font-extrabold tracking-wider uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              Khám phá ngay
            </Link>
          </div>

          {/* Right Decorative Image */}
          <div className="hidden lg:block relative aspect-square rounded-2xl overflow-hidden shadow-md">
            <Image
              src="/promo-coffee.jpg"
              alt="Hạt cà phê nguyên chất BrewLite"
              fill
              unoptimized
              sizes="300px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 6. FOOTER ────────────────────────────────────────────────────────────────

function SiteFooterV2() {
  return (
    <footer className="bg-[#38291E] text-[#E7DECE]/70 pt-16 pb-8" role="contentinfo">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-12 border-b border-[#D8CFC2]/15">
          {/* Brand Info */}
          <div className="flex flex-col gap-3.5 sm:col-span-2 lg:col-span-2">
            <span className="font-heading text-2xl font-bold text-[#E7DECE] tracking-wider uppercase">
              BrewLite
            </span>
            <p className="text-sm leading-relaxed max-w-md">
              Cà phê nguyên bản và đồ uống tươi ngon, tùy chỉnh theo gu của bạn.
              Trải nghiệm đặt hàng trực tuyến tiện lợi không dùng tiền mặt.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs font-extrabold tracking-wider uppercase text-[#E7DECE] mb-4">
              Liên hệ
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>Hotline: 1900 xxxx</li>
              <li>contact@brewlite.vn</li>
              <li>Hà Nội, Việt Nam</li>
              <li>Mở cửa: 07:00 - 22:30 hàng ngày</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#E7DECE]/45 text-center sm:text-left">
          <p>© 2025 BrewLite Coffee. All rights reserved.</p>
          <p>Thiết kế phong cách Modern Coffee Shop.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────

export default function HomePage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount((prev) => prev + 1);
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    setLoading(true);

    getProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
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

  // Phân loại nhóm Cà phê và nhóm Thức uống khác từ danh sách sản phẩm thực tế
  const isCoffeeItem = (name: string) => {
    const n = name.toLowerCase();
    return (
      n.includes("cà phê") ||
      n.includes("espresso") ||
      n.includes("americano") ||
      n.includes("cappuccino") ||
      n.includes("latte") ||
      n.includes("mocha") ||
      n.includes("bạc xỉu") ||
      n.includes("cold brew") ||
      n.includes("macchiato")
    );
  };

  const coffeeProducts = products.filter((p) => isCoffeeItem(p.name));
  const drinkProducts = products.filter((p) => !isCoffeeItem(p.name));

  const finalCoffeeList = coffeeProducts.length > 0 ? coffeeProducts : products.slice(0, 6);
  const finalDrinkList = drinkProducts.length > 0 ? drinkProducts : products.slice(6, 12);

  return (
    <div className="bg-[#F7F5F1] min-h-screen text-[#30251D] font-sans">
      {/* 1. Hero Banner */}
      <HeroSection />

      {/* 2. Categories Bar */}
      <CategoriesBar />

      {/* 3. Cà phê nổi bật (OUR SPECIAL COFFEE) */}
      <ProductShowcaseSection
        eyebrowScript="Thưởng thức tinh hoa"
        title="OUR SPECIAL COFFEE"
        products={finalCoffeeList}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* 4. Thức uống được yêu thích (THỨC UỐNG ĐƯỢC YÊU THÍCH) */}
      <ProductShowcaseSection
        eyebrowScript="Thanh mát & ngọt ngào"
        title="THỨC UỐNG ĐƯỢC YÊU THÍCH"
        products={finalDrinkList}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* 5. Promotional Coffee Beans Banner */}
      <PromotionalBanner />

      {/* 6. Footer */}
      <SiteFooterV2 />
    </div>
  );
}
