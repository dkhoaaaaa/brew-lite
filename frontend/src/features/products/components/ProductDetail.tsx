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
    <main className="page-shell product-detail-page max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Link
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#667068] hover:text-[#163326] mb-6 transition-colors"
        href="/menu"
      >
        ← Quay lại Thực đơn
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-start">
        {/* Ảnh món ăn responsive */}
        <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#EAE5DD] border border-[#d8d8cb] shadow-xs lg:sticky lg:top-24">
          {isOut && (
            <span className="absolute top-3.5 left-3.5 z-10 bg-amber-900/90 text-amber-50 text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
              Hết hàng
            </span>
          )}
          {fullImageUrl ? (
            <Image
              src={fullImageUrl}
              alt={currentProduct.name}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-heading text-4xl text-[#76513B]/60">
              BrewLite
            </div>
          )}
        </div>

        {/* Nội dung chi tiết món */}
        <section className="flex flex-col space-y-5">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#76513B] mb-1.5">
              Pha theo lựa chọn của bạn
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-[#163326] leading-tight mb-2">
              {currentProduct.name}
            </h1>
            {currentProduct.description && (
              <p className="text-xs sm:text-sm text-[#667068] leading-relaxed mb-3">
                {currentProduct.description}
              </p>
            )}
            <p className="text-sm text-[#17231c]">
              Giá gốc: <strong className="text-base text-[#163326]">{formatPrice(currentProduct.price)}</strong>
            </p>
          </div>

          {isOut && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium" role="status">
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
              {/* Mức đường */}
              <fieldset className="option-group border-0 p-0 m-0">
                <legend className="flex items-center justify-between w-full font-heading font-bold text-base sm:text-lg text-[#163326] mb-2.5">
                  <span>Mức đường</span>
                  <span className="text-xs font-normal text-[#667068] font-sans">Mặc định 100%</span>
                </legend>
                <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
                  {DRINK_PREFERENCE_PERCENTAGES.map((percentage) => {
                    const isSelected = sugarPercent === percentage;
                    return (
                      <label
                        className={`relative flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 border rounded-xl cursor-pointer transition-all min-h-[44px] text-center ${
                          isSelected
                            ? "border-[#254a39] bg-[#254a39]/10 font-bold text-[#163326] shadow-xs ring-1 ring-[#254a39]"
                            : "border-[#d8d8cb] bg-[#fbfaf6] hover:bg-white text-[#667068]"
                        }`}
                        key={percentage}
                      >
                        <input
                          checked={isSelected}
                          name="sugar-percent"
                          onChange={() => setSugarPercent(percentage)}
                          type="radio"
                          value={percentage}
                          className="sr-only"
                        />
                        <span className="text-xs sm:text-sm font-semibold">{percentage}%</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Mức đá */}
              <fieldset className="option-group border-0 p-0 m-0">
                <legend className="flex items-center justify-between w-full font-heading font-bold text-base sm:text-lg text-[#163326] mb-2.5">
                  <span>Mức đá</span>
                  <span className="text-xs font-normal text-[#667068] font-sans">Mặc định 100%</span>
                </legend>
                <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
                  {DRINK_PREFERENCE_PERCENTAGES.map((percentage) => {
                    const isSelected = icePercent === percentage;
                    return (
                      <label
                        className={`relative flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 border rounded-xl cursor-pointer transition-all min-h-[44px] text-center ${
                          isSelected
                            ? "border-[#254a39] bg-[#254a39]/10 font-bold text-[#163326] shadow-xs ring-1 ring-[#254a39]"
                            : "border-[#d8d8cb] bg-[#fbfaf6] hover:bg-white text-[#667068]"
                        }`}
                        key={percentage}
                      >
                        <input
                          checked={isSelected}
                          name="ice-percent"
                          onChange={() => setIcePercent(percentage)}
                          type="radio"
                          value={percentage}
                          className="sr-only"
                        />
                        <span className="text-xs sm:text-sm font-semibold">{percentage}%</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}

          {/* Hàng tính tiền & nút Thêm vào giỏ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 mt-6 border-t border-[#d8d8cb]">
            <div>
              <span className="text-xs text-[#667068] uppercase tracking-wider block mb-0.5">
                Tạm tính / món
              </span>
              <strong className="text-xl sm:text-2xl font-extrabold text-[#163326]">
                {formatPrice(unitPrice)}
              </strong>
            </div>
            <button
              className={`w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3 bg-[#c45b38] hover:bg-[#a9472b] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                isOut ? "opacity-60 cursor-not-allowed bg-stone-400 hover:bg-stone-400" : ""
              }`}
              type="button"
              onClick={addToCart}
              disabled={isOut}
            >
              {isOut ? "Hết hàng" : <>Thêm vào giỏ <span aria-hidden="true">+</span></>}
            </button>
          </div>

          {selectionError && (
            <p className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-lg" role="alert">
              {selectionError}
            </p>
          )}
          {notice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-lg flex items-center justify-between gap-2" role="status">
              <span>{notice}</span>
              <Link className="font-bold text-[#163326] underline hover:no-underline text-xs" href="/cart">
                Xem giỏ hàng →
              </Link>
            </div>
          )}
          <p className="text-[11px] text-[#667068] leading-relaxed">
            Giá dự kiến từ tùy chọn hiện có; backend sẽ xác minh lại khi tạo đơn.
          </p>
        </section>
      </div>
    </main>
  );
}
