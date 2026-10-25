import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "../../../lib/money";
import type { ProductSummary } from "../../../types/product";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className="lp-pcard">
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
          <Link
            href={`/products/${encodeURIComponent(product.id)}`}
            className="lp-pcard__cta"
            aria-label={`Đặt món ${product.name}`}
          >
            Tùy chỉnh món
          </Link>
        </div>
      </div>
    </article>
  );
}