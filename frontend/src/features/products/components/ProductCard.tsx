import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "../../../lib/money";
import type { ProductSummary } from "../../../types/product";

export function ProductCard({ product }: { product: ProductSummary }) {
  const isOut = Boolean(
    product.isOutOfStock ||
      (typeof product.availableQuantity === "number" && product.availableQuantity <= 0) ||
      (typeof product.stock === "number" && product.stock <= 0),
  );

  const fullImageUrl = product.imageUrl
    ? product.imageUrl.startsWith("http")
      ? product.imageUrl
      : `http://localhost:3001${product.imageUrl}`
    : null;

  return (
    <article
      className={`group bg-white border border-[#D8CFC2] hover:border-[#76513B] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative ${
        isOut ? "opacity-85" : ""
      }`}
    >
      {/* Vùng ảnh sản phẩm với tỉ lệ chân dung chuẩn 4/5 */}
      <div className="relative aspect-[4/5] bg-[#EAE5DD] overflow-hidden">
        {isOut && (
          <span className="absolute top-2 left-2 z-10 bg-amber-900/90 text-amber-50 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
            Hết hàng
          </span>
        )}
        {fullImageUrl ? (
          <Image
            src={fullImageUrl}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#F0ECE4] to-[#E2DDD4] text-[#76513B]">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-65"
              aria-hidden="true"
            >
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
            <span className="font-heading text-[11px] font-bold tracking-wider opacity-70">
              BrewLite
            </span>
          </div>
        )}
      </div>

      {/* Thông tin món */}
      <div className="p-3 sm:p-4 lg:p-5 flex flex-col flex-1">
        <h3 className="text-sm sm:text-base font-bold text-[#30251D] mb-1 font-heading line-clamp-1 hover:text-[#76513B] transition-colors">
          <Link href={`/products/${encodeURIComponent(product.id)}`}>
            {product.name}
          </Link>
        </h3>

        <p className="text-[11.5px] sm:text-xs text-[#76513B] leading-relaxed mb-3 sm:mb-4 line-clamp-2 min-h-[30px] sm:min-h-[36px]">
          {product.description || "Hương vị nguyên bản, đậm đà được pha chế tỉ mỉ từng chi tiết."}
        </p>

        {/* Chân thẻ: Giá tiền và Nút chọn món */}
        <div className="mt-auto pt-2.5 sm:pt-3 border-t border-[#D8CFC2]/50 flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-sm sm:text-[15px] font-extrabold text-[#30251D]">
            {formatPrice(product.price)}
          </span>
          {isOut ? (
            <span
              className="inline-flex items-center justify-center px-3 py-1 sm:py-1.5 bg-stone-200 text-stone-500 text-[11px] sm:text-xs font-semibold rounded-full cursor-not-allowed"
              aria-label={`Món ${product.name} hiện đã hết hàng`}
            >
              Hết hàng
            </span>
          ) : (
            <Link
              href={`/products/${encodeURIComponent(product.id)}`}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 bg-[#38291E] hover:bg-[#50392A] text-[#F7F5F1] text-[11px] sm:text-xs font-bold rounded-full transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap min-h-[32px]"
              aria-label={`Đặt món ${product.name}`}
            >
              Đặt món
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
