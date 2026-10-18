import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "../../../lib/money";
import type { ProductSummary } from "../../../types/product";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className="product-card">
      <Link
        className="product-card__link"
        href={`/products/${encodeURIComponent(product.id)}`}
        aria-label={`Xem chi tiết ${product.name}`}
      >
        <div className="product-card__image">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            />
          ) : (
            <span className="product-card__image-placeholder" aria-hidden="true">
              BL
            </span>
          )}
        </div>
        <div className="product-card__copy">
          <div className="product-card__title-row">
            <h2>{product.name}</h2>
            <span>{formatPrice(product.price)}</span>
          </div>
          {product.description && <p>{product.description}</p>}
          <span className="product-card__action">Tùy chỉnh món <span aria-hidden="true">↗</span></span>
        </div>
      </Link>
    </article>
  );
}