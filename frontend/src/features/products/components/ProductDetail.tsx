"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../../cart/cart-store";
import { getProductDetail } from "../../../lib/products-api";
import { formatPrice, fromMinorUnits, toMinorUnits } from "../../../lib/money";
import type {
  AddToCartHandler,
  ProductDetailData,
} from "../../../types/product";
import { SizeSelector } from "./SizeSelector";
import { ToppingSelector } from "./ToppingSelector";
import { PreferenceSelector } from "./PreferenceSelector";

export function ProductDetail({
  productId,
  onAddToCart,
}: {
  productId: string;
  onAddToCart?: AddToCartHandler;
}) {
  return (
    <ProductDetailView
      key={productId}
      productId={productId}
      onAddToCart={onAddToCart}
    />
  );
}

function ProductDetailView({
  productId,
  onAddToCart,
}: {
  productId: string;
  onAddToCart?: AddToCartHandler;
}) {
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
  const [sugarPercent, setSugarPercent] = useState<number | null>(null);
  const [icePercent, setIcePercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const cart = useCart();

  useEffect(() => {
    let active = true;

    getProductDetail(productId)
      .then((result) => {
        if (active) setProduct(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message = cause instanceof Error ? cause.message : "Đã có lỗi xảy ra.";
        setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId, retryCount]);

  if (loading) {
    return <main className="page-shell"><p className="state-message" role="status">Đang tải thông tin món...</p></main>;
  }

  if (error) {
    const notFound = error.includes("404") || error.includes("Không tìm thấy sản phẩm");
    return (
      <main className="page-shell">
        <section className="state-panel" role="alert">
          <p className="eyebrow">{notFound ? "Không tìm thấy" : "Không thể tải dữ liệu"}</p>
          <h1>{notFound ? "Món này không còn ở đây." : "Chưa kết nối được với menu."}</h1>
          <p>{error}</p>
          <button
            className="button button--dark"
            onClick={() => {
              setLoading(true);
              setError(null);
              setRetryCount((count) => count + 1);
            }}
            type="button"
          >
            Thử lại
          </button>
          <Link className="button button--dark" href="/menu">Quay lại menu</Link>
        </section>
      </main>
    );
  }

  if (!product) return null;
  const currentProduct = product;

  const selectedSize = currentProduct.sizes.find((size) => size.id === selectedSizeId) ?? null;
  const selectedToppings = currentProduct.toppings.filter((topping) =>
    selectedToppingIds.includes(topping.id),
  );
  const totalMinorUnits =
    toMinorUnits(currentProduct.price) +
    (selectedSize ? toMinorUnits(selectedSize.extraPrice) : 0) +
    selectedToppings.reduce((total, topping) => total + toMinorUnits(topping.price), 0);
  const unitPrice = fromMinorUnits(totalMinorUnits);

  function addToCart() {
    setNotice(null);
    if (!selectedSize) {
      setSelectionError(
        currentProduct.sizes.length > 0
          ? "Vui lòng chọn size trước khi thêm món vào giỏ."
          : "Sản phẩm chưa có size khả dụng từ API nên chưa thể thêm vào giỏ.",
      );
      return;
    }
    setSelectionError(null);

    const addItem = onAddToCart ?? cart.addItem;
    addItem({
      productId: currentProduct.id,
      productName: currentProduct.name,
      productImageUrl: currentProduct.imageUrl,
      size: selectedSize,
      toppings: selectedToppings,
      unitPrice,
      quantity: 1,
      sugarPercent,
      icePercent,
    });
    setNotice("Đã thêm món vào giỏ hàng.");
  }

  return (
    <main className="page-shell product-detail-page">
      <Link className="back-link" href="/menu">← Menu</Link>
      <div className="product-detail">
        <div className="product-detail__image">
          {currentProduct.imageUrl ? (
            <Image src={currentProduct.imageUrl} alt={currentProduct.name} fill unoptimized sizes="(max-width: 800px) 100vw, 55vw" />
          ) : (
            <span className="product-detail__image-placeholder" aria-hidden="true">BrewLite</span>
          )}
        </div>
        <section className="product-detail__content">
          <p className="eyebrow">Pha theo lựa chọn của bạn</p>
          <h1>{currentProduct.name}</h1>
          {currentProduct.description && <p className="product-detail__description">{currentProduct.description}</p>}
          <p className="base-price">Giá gốc <strong>{formatPrice(currentProduct.price)}</strong></p>

          <SizeSelector
            sizes={product.sizes}
            selectedSizeId={selectedSizeId}
            onChange={(sizeId) => {
              setSelectedSizeId(sizeId);
              setSelectionError(null);
            }}
          />
          <ToppingSelector
            toppings={product.toppings}
            selectedToppingIds={selectedToppingIds}
            onChange={setSelectedToppingIds}
          />
          <PreferenceSelector
            sugarPercent={sugarPercent}
            icePercent={icePercent}
            onSugarChange={setSugarPercent}
            onIceChange={setIcePercent}
          />

          <div className="purchase-row">
            <div>
              <span className="purchase-row__label">Tạm tính / món</span>
              <strong>{formatPrice(unitPrice)}</strong>
            </div>
            <button className="button button--accent" type="button" onClick={addToCart}>
              Thêm vào giỏ <span aria-hidden="true">+</span>
            </button>
          </div>
          {selectionError && <p className="inline-notice" role="alert">{selectionError}</p>}
          {notice && <p className="inline-notice" role="status">{notice}</p>}
          {notice && <Link className="text-button" href="/cart">Xem giỏ hàng</Link>}
          <p className="price-disclaimer">Giá dự kiến từ tùy chọn hiện có; backend sẽ xác minh lại khi tạo đơn.</p>
        </section>
      </div>
    </main>
  );
}