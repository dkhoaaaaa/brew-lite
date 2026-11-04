"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, fromMinorUnits, toMinorUnits } from "../../../lib/money";
import { getProductDetail } from "../../../lib/products-api";
import type {
  AddToCartHandler,
  ProductDetailData,
} from "../../../types/product";
import { DRINK_PREFERENCE_PERCENTAGES } from "../../cart/cart-logic";
import { useCart } from "../../cart/cart-store";
import { SizeSelector } from "./SizeSelector";
import { ToppingSelector } from "./ToppingSelector";

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
  const [sugarPercent, setSugarPercent] = useState(100);
  const [icePercent, setIcePercent] = useState(100);
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

  const isOut = Boolean(
    currentProduct.isOutOfStock ||
      (typeof currentProduct.availableQuantity === "number" && currentProduct.availableQuantity <= 0) ||
      (typeof currentProduct.stock === "number" && currentProduct.stock <= 0),
  );

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
    if (isOut) {
      setSelectionError("Món này tạm thời hết hàng do không đủ nguyên liệu chế biến.");
      return;
    }
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
      sugarPercent,
      icePercent,
      unitPrice,
      quantity: 1,
    });
    setNotice("Đã thêm món vào giỏ hàng.");
  }

  // Xử lý đường dẫn ảnh để tự động trỏ tới backend port 3001 nếu chưa có domain
  const fullImageUrl = currentProduct.imageUrl
    ? currentProduct.imageUrl.startsWith("http")
      ? currentProduct.imageUrl
      : `http://localhost:3001${currentProduct.imageUrl}`
    : "";

  return (
    <main className="page-shell product-detail-page">
      <Link className="back-link" href="/menu">← Menu</Link>
      <div className="product-detail">
        <div className="product-detail__image relative">
          {isOut && (
            <span className="absolute top-4 left-4 z-10 bg-amber-900/90 text-amber-50 text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
              Hết hàng
            </span>
          )}
          {fullImageUrl ? (
            <Image src={fullImageUrl} alt={currentProduct.name} fill unoptimized sizes="(max-width: 800px) 100vw, 55vw" />
          ) : (
            <span className="product-detail__image-placeholder" aria-hidden="true">BrewLite</span>
          )}
        </div>
        <section className="product-detail__content">
          <p className="eyebrow">Pha theo lựa chọn của bạn</p>
          <h1>{currentProduct.name}</h1>
          {currentProduct.description && <p className="product-detail__description">{currentProduct.description}</p>}
          <p className="base-price">Giá gốc <strong>{formatPrice(currentProduct.price)}</strong></p>

          {isOut && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-sm font-medium my-3" role="status">
              Món này hiện tại đã hết hàng do không đủ nguyên liệu trong kho. Quý khách vui lòng chọn món khác.
            </div>
          )}

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
          
          {currentProduct.categoryName !== "Bánh" && (
            <>
              <fieldset className="option-group">
                <legend>Đường <span>Mặc định 100%</span></legend>
                <div className="size-options">
                  {DRINK_PREFERENCE_PERCENTAGES.map((percentage) => (
                    <label className="size-option" key={percentage}>
                      <input
                        checked={sugarPercent === percentage}
                        name="sugar-percent"
                        onChange={() => setSugarPercent(percentage)}
                        type="radio"
                        value={percentage}
                      />
                      <span className="size-option__code">{percentage}%</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="option-group">
                <legend>Đá <span>Mặc định 100%</span></legend>
                <div className="size-options">
                  {DRINK_PREFERENCE_PERCENTAGES.map((percentage) => (
                    <label className="size-option" key={percentage}>
                      <input
                        checked={icePercent === percentage}
                        name="ice-percent"
                        onChange={() => setIcePercent(percentage)}
                        type="radio"
                        value={percentage}
                      />
                      <span className="size-option__code">{percentage}%</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          <div className="purchase-row">
            <div>
              <span className="purchase-row__label">Tạm tính / món</span>
              <strong>{formatPrice(unitPrice)}</strong>
            </div>
            <button
              className={`button button--accent ${isOut ? "opacity-60 cursor-not-allowed bg-stone-400 hover:bg-stone-400" : ""}`}
              type="button"
              onClick={addToCart}
              disabled={isOut}
            >
              {isOut ? "Hết hàng" : <>Thêm vào giỏ <span aria-hidden="true">+</span></>}
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
