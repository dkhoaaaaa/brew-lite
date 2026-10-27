"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductSkeleton } from "../features/products/components/ProductSkeleton";
import { formatPrice } from "../lib/money";
import { getProducts } from "../lib/products-api";
import "../styles/landing.css";
import type { ProductSummary } from "../types/product";

// ─── 1. HERO SECTION ──────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="lp-hero" aria-label="Giới thiệu BrewLite Coffee">
      {/* Background Image & Overlay */}
      <div className="lp-hero__bg">
        <Image
          src="/landingpage.jpg"
          alt="Barista rót sữa tạo hình latte art tại BrewLite"
          fill
          unoptimized
          priority
          sizes="100vw"
        />
        <div className="lp-hero__overlay" aria-hidden="true" />
      </div>

      {/* Hero Content */}
      <div className="lp-hero__inner">
        <span className="lp-hero__tag">BREWLITE COFFEE</span>
        <h1 className="lp-hero__title">
          Đánh thức năng lượng
          <br />
          <span>Trọn vẹn từng khoảnh khắc.</span>
        </h1>
        <p className="lp-hero__sub">
          Mỗi ly cà phê là một trải nghiệm, mỗi hương vị là một câu chuyện.
          Thưởng thức hương vị cà phê rang mộc thượng hạng và đồ uống tươi mát.
        </p>
        <Link href="/menu" className="lp-hero__cta">
          Khám phá thực đơn
        </Link>
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
    <section className="lp-cat-bar" aria-label="Danh mục sản phẩm nhanh">
      <div className="lp-inner">
        <div className="lp-cat-bar__grid">
          {CATEGORY_ITEMS.map((item) => (
            <Link key={item.id} href="/menu" className="lp-cat-item">
              <span className="lp-cat-item__label font-medium">{item.label}</span>
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
    <article className="lp-pcard">
      {/* Media Image */}
      <div className="lp-pcard__media">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 25vw"
          />
        ) : (
          <div className="lp-pcard__placeholder" aria-hidden="true">
            <span className="lp-pcard__placeholder-text">BrewLite</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          className={`lp-pcard__fav-btn ${isFavorite ? "is-active" : ""}`}
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
      <div className="lp-pcard__info">
        <h3 className="lp-pcard__title">
          <Link href={`/products/${encodeURIComponent(product.id)}`}>
            {product.name}
          </Link>
        </h3>
        <p className="lp-pcard__desc">
          {product.description || "Hương vị nguyên bản, đậm đà được pha chế tỉ mỉ từng chi tiết."}
        </p>

        {/* Footer: Price + Order CTA */}
        <div className="lp-pcard__footer">
          <span className="lp-pcard__price">{formatPrice(product.price)}</span>
          <Link
            href={`/products/${encodeURIComponent(product.id)}`}
            className="lp-pcard__cta"
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
    <section className="lp-products-section" aria-label={title}>
      <div className="lp-inner">
        {/* Section Header with Left/Right Nav */}
        <header className="lp-section-header">
          {eyebrowScript && <p className="lp-eyebrow--script">{eyebrowScript}</p>}
          <div className="lp-section-header__with-nav">
            <button
              type="button"
              className="lp-section-nav-btn text-xs font-semibold px-2 py-1"
              onClick={handlePrev}
              disabled={startIndex === 0 || loading || products.length <= itemsPerPage}
              aria-label="Xem sản phẩm trước"
            >
              Trước
            </button>

            <h2 className="lp-section-title">{title}</h2>

            <button
              type="button"
              className="lp-section-nav-btn text-xs font-semibold px-2 py-1"
              onClick={handleNext}
              disabled={startIndex >= maxIndex || loading || products.length <= itemsPerPage}
              aria-label="Xem sản phẩm kế tiếp"
            >
              Tiếp
            </button>
          </div>
        </header>

        {/* Loading State */}
        {loading && <ProductSkeleton />}

        {/* Error State */}
        {!loading && error && (
          <div className="lp-state-msg" role="alert" style={{ textAlign: "center", alignItems: "center" }}>
            <p>{error}</p>
            <button
              className="lp-pcard__cta"
              onClick={onRetry}
              type="button"
              style={{ padding: "10px 24px" }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="lp-state-msg" style={{ textAlign: "center" }}>
            <p>Chưa có sản phẩm trong danh mục này.</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && visibleProducts.length > 0 && (
          <div className="lp-product-grid">
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
    <section className="lp-promo-box" aria-label="Khám phá hạt cà phê nguyên chất">
      <div className="lp-inner">
        <div className="lp-promo-box__inner">
          {/* Left Decorative Image */}
          <div className="lp-promo-box__side-img">
            <Image
              src="/promo-coffee.jpg"
              alt="Hạt cà phê rang xay thơm ngon"
              fill
              unoptimized
              sizes="300px"
            />
          </div>

          {/* Center Text & CTA */}
          <div className="lp-promo-box__content">
            <p className="lp-eyebrow">Đặc quyền chất lượng</p>
            <h2 className="lp-promo-box__title">
              Tinh hoa hương vị trong từng giọt cà phê.
            </h2>
            <p className="lp-promo-box__sub">
              Tuyển chọn từ những hạt cà phê Robusta và Arabica nguyên chất,
              rang mộc thủ công giữ trọn vẹn hương vị nồng nàn và hậu vị ngọt sâu.
            </p>
            <Link href="/menu" className="lp-promo-box__cta">
              Khám phá ngay
            </Link>
          </div>

          {/* Right Decorative Image */}
          <div className="lp-promo-box__side-img">
            <Image
              src="/promo-coffee.jpg"
              alt="Hạt cà phê nguyên chất BrewLite"
              fill
              unoptimized
              sizes="300px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 6. FOOTER ─────────────────────────────────────────────────────────────

function SiteFooterV2() {
  return (
    <footer className="lp-footer-v2" role="contentinfo">
      <div className="lp-inner">
        <div className="lp-footer-v2__grid">
          {/* Brand Info */}
          <div className="lp-footer-v2__brand">
            <span className="lp-footer-v2__logo">BrewLite</span>
            <p className="lp-footer-v2__desc">
              Cà phê nguyên bản và đồ uống tươi ngon, tùy chỉnh theo gu của bạn.
              Trải nghiệm đặt hàng trực tuyến tiện lợi không dùng tiền mặt.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="lp-footer-v2__col-title">Liên hệ</h4>
            <ul className="lp-footer-v2__links">
              <li>Hotline: 1900 xxxx</li>
              <li>contact@brewlite.vn</li>
              <li>Hà Nội, Việt Nam</li>
              <li>Mở cửa: 07:00 - 22:30 hàng ngày</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="lp-footer-v2__bottom">
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
    <div style={{ background: "var(--lp-warm-white)", minHeight: "100vh" }}>
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

      {/* 8. Footer */}
      <SiteFooterV2 />
    </div>
  );
}
