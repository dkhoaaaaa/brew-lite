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

  return (
    <article className={`lp-pcard ${isOut ? "lp-pcard--out-of-stock opacity-85" : ""}`}>
      <div className="lp-pcard__media relative">
        {isOut && (
          <span className="absolute top-2.5 left-2.5 z-10 bg-amber-900/90 text-amber-50 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
            Hết hàng
          </span>
        )}
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
      </div>

      {/* Thông tin món */}
      <div className="lp-pcard__info">
        <h3 className="lp-pcard__title">
          <Link href={`/products/${encodeURIComponent(product.id)}`}>
            {product.name}
          </Link>
        </h3>
        
        <p className="lp-pcard__desc">
          {product.description || "Hương vị nguyên bản, đậm đà được pha chế tỉ mỉ từng chi tiết."}
        </p>

        {/* Chân thẻ: Giá tiền và Nút chọn món */}
        <div className="lp-pcard__footer">
          <span className="lp-pcard__price">{formatPrice(product.price)}</span>
          {isOut ? (
            <span
              className="lp-pcard__cta opacity-60 cursor-not-allowed bg-stone-300 text-stone-600 hover:bg-stone-300"
              aria-label={`Món ${product.name} hiện đã hết hàng`}
            >
              Hết hàng
            </span>
          ) : (
            <Link
              href={`/products/${encodeURIComponent(product.id)}`}
              className="lp-pcard__cta"
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
