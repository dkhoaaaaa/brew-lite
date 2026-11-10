"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "../../features/cart/cart-store";
import { formatPrice, fromMinorUnits, toMinorUnits } from "../../lib/money";
import { createOrder } from "../../lib/orders-api";
import { useAuth } from "../../lib/auth";
import { toCreateOrderPayload } from "../../features/cart/cart-logic";

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <p className="state-message" role="status">Đang tải giỏ hàng...</p>
        </main>
      }
    >
      <CartContent />
    </Suspense>
  );
}

function CartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoCheckout = searchParams.get("autoCheckout") === "true";

  const { isAuthenticated, user } = useAuth();
  const {
    items,
    hydrated,
    storageError,
    totalMinorUnits,
    increaseItem,
    decreaseItem,
    removeItem,
    clearCart,
  } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submissionLock = useRef(false);
  const autoCheckoutTriggered = useRef(false);
  const orderKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  const handleCreateOrder = useCallback(async () => {
    if (submissionLock.current || items.length === 0) return;
    setErrorMessage(null);

    // Nếu chưa đăng nhập: trực tiếp chuyển sang màn hình đăng nhập
    if (!isAuthenticated || !user?.id) {
      try {
        window.localStorage.setItem("brewlite_guest_cart_snapshot", JSON.stringify(items));
      } catch {
        // Bỏ qua lỗi storage
      }
      router.push(`/login?redirect=${encodeURIComponent("/cart?autoCheckout=true")}`);
      return;
    }

    let orderPayload;
    try {
      orderPayload = toCreateOrderPayload(items);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Giỏ hàng có món chưa đủ tùy chọn để tạo đơn.",
      );
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    try {
      const requestFingerprint = JSON.stringify(orderPayload);
      let idempotencyKey = "";
      if (orderKeyRef.current?.fingerprint === requestFingerprint) {
        idempotencyKey = orderKeyRef.current.key;
      }
      try {
        const stored = window.sessionStorage.getItem("brewlite-create-order-key");
        const parsed: unknown = stored ? JSON.parse(stored) : null;
        if (
          parsed &&
          typeof parsed === "object" &&
          "fingerprint" in parsed &&
          parsed.fingerprint === requestFingerprint &&
          "key" in parsed &&
          typeof parsed.key === "string"
        ) {
          idempotencyKey = parsed.key;
        }
      } catch {
        idempotencyKey = "";
      }
      if (!idempotencyKey) {
        idempotencyKey = crypto.randomUUID();
        orderKeyRef.current = { fingerprint: requestFingerprint, key: idempotencyKey };
        try {
          window.sessionStorage.setItem(
            "brewlite-create-order-key",
            JSON.stringify({ fingerprint: requestFingerprint, key: idempotencyKey }),
          );
        } catch {
          // Keep the key in memory when browser storage is unavailable.
        }
      }

      const createdOrder = await createOrder(orderPayload, user.id, idempotencyKey);
      orderKeyRef.current = null;
      try {
        window.sessionStorage.removeItem("brewlite-create-order-key");
      } catch {
        // The server order was created; unavailable browser storage is non-fatal.
      }
      try {
        window.localStorage.removeItem("brewlite_guest_cart_snapshot");
      } catch {
        // Bỏ qua lỗi storage
      }
      clearCart();
      router.push(`/checkout?orderId=${encodeURIComponent(createdOrder.id)}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo đơn hàng. Vui lòng thử lại.",
      );
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }, [clearCart, isAuthenticated, items, router, user]);

  // Khôi phục giỏ hàng nếu quay lại sau khi đăng nhập mà state chưa kịp load
  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0 && typeof window !== "undefined") {
      try {
        const snapshot = window.localStorage.getItem("brewlite_guest_cart_snapshot");
        if (snapshot) {
          const parsed = JSON.parse(snapshot);
          if (Array.isArray(parsed) && parsed.length > 0) {
            window.localStorage.setItem("brewlite-cart-v1", snapshot);
            window.location.reload();
          }
        }
      } catch {
        // Bỏ qua lỗi
      }
    }
  }, [hydrated, items.length]);

  // Tự động tiếp tục luồng thanh toán sau khi người dùng đăng nhập thành công quay lại
  useEffect(() => {
    if (
      autoCheckout &&
      !autoCheckoutTriggered.current &&
      isAuthenticated &&
      user?.id &&
      hydrated &&
      items.length > 0 &&
      !isSubmitting
    ) {
      autoCheckoutTriggered.current = true;
      handleCreateOrder();
    }
  }, [
    autoCheckout,
    isAuthenticated,
    user?.id,
    hydrated,
    items.length,
    isSubmitting,
    handleCreateOrder,
  ]);

  if (!hydrated || (autoCheckout && isSubmitting)) {
    return (
      <main className="page-shell">
        <p className="state-message" role="status">
          {autoCheckout && isSubmitting
            ? "Đang chuẩn bị đơn hàng cho tài khoản của bạn..."
            : "Đang khôi phục giỏ hàng..."}
        </p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="page-shell cart-page">
        <p className="eyebrow">BrewLite · giỏ hàng</p>
        <p className="state-message" role="status">
          Giỏ hàng hiện được lưu trên thiết bị này. Backend chưa có API giỏ hàng nên
          chưa đồng bộ giữa thiết bị hoặc lên cơ sở dữ liệu.
        </p>
        {storageError && <p className="payment-result payment-result--failure" role="alert">{storageError}</p>}
        <section className="state-panel">
          <h1>Giỏ hàng đang trống</h1>
          <p>Chọn một món từ menu để bắt đầu.</p>
          <Link className="button button--dark" href="/menu">Tiếp tục mua hàng</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell cart-page max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-[#d8d8cb]">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#76513B] mb-1">
            BrewLite · giỏ hàng
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-[#163326]">
            Món đã chọn
          </h1>
        </div>
        <Link
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#667068] hover:text-[#163326] transition-colors"
          href="/menu"
        >
          ← Tiếp tục mua hàng
        </Link>
      </header>

      <p className="text-xs text-[#667068] mb-6 p-3 bg-[#FAF8F5] border border-[#d8d8cb] rounded-xl" role="status">
        Giỏ hàng hiện được lưu trên thiết bị này. Backend chưa có API giỏ hàng nên chưa đồng bộ giữa thiết bị hoặc lên cơ sở dữ liệu.
      </p>

      {storageError && (
        <p className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl mb-6" role="alert">
          {storageError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        {/* Danh sách các món trong giỏ */}
        <section aria-label="Các món trong giỏ" className="flex flex-col divide-y divide-[#d8d8cb] border-t border-b border-[#d8d8cb]">
          {items.map((item) => (
            <article
              className="py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              key={item.cartItemId}
            >
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#dce3d9] shrink-0 border border-[#d8d8cb]">
                  {item.productImageUrl ? (
                    <Image
                      src={item.productImageUrl}
                      alt={item.productName}
                      fill
                      unoptimized
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center font-heading text-lg font-bold text-[#254a39]">
                      BL
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h2 className="font-heading font-bold text-sm sm:text-base text-[#163326] truncate">
                    {item.productName}
                  </h2>
                  <p className="text-xs text-[#667068]">
                    {item.size ? `Size ${item.size.sizeCode}` : "Không chọn size"}
                  </p>
                  {item.toppings.length > 0 && (
                    <p className="text-xs text-[#667068] truncate">
                      Topping: {item.toppings.map((topping) => topping.name).join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-[#667068]">
                    Đường {item.sugarPercent}% · Đá {item.icePercent}%
                  </p>
                  <strong className="text-xs text-[#254a39] block pt-0.5">
                    {formatPrice(item.unitPrice)} / món
                  </strong>
                </div>
              </div>

              {/* Cụm điều khiển: Bộ tăng giảm số lượng + Giá tiền + Xóa món */}
              <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end gap-3 pt-2 sm:pt-0 border-t border-[#d8d8cb]/40 sm:border-t-0">
                <div className="inline-flex items-center border border-[#d8d8cb] rounded-lg bg-white overflow-hidden shadow-2xs h-9 sm:h-10">
                  <button
                    aria-label="Giảm số lượng"
                    onClick={() => decreaseItem(item.cartItemId)}
                    type="button"
                    className="w-9 h-full flex items-center justify-center text-[#254a39] hover:bg-[#fbfaf6] active:bg-[#dce3d9] text-base font-bold cursor-pointer transition-colors"
                  >
                    −
                  </button>
                  <span className="w-9 text-center font-bold text-xs sm:text-sm text-[#17231c]" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    aria-label="Tăng số lượng"
                    onClick={() => increaseItem(item.cartItemId)}
                    type="button"
                    className="w-9 h-full flex items-center justify-center text-[#254a39] hover:bg-[#fbfaf6] active:bg-[#dce3d9] text-base font-bold cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center sm:flex-col sm:items-end gap-2.5">
                  <strong className="text-sm sm:text-base font-extrabold text-[#163326]">
                    {formatPrice(fromMinorUnits(toMinorUnits(item.unitPrice) * item.quantity))}
                  </strong>
                  <button
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    onClick={() => removeItem(item.cartItemId)}
                    type="button"
                  >
                    Xóa món
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Khung tổng kết đơn hàng */}
        <aside className="bg-white border border-[#d8d8cb] rounded-2xl p-5 sm:p-6 shadow-sm lg:sticky lg:top-24 space-y-4">
          <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#76513B]">
            Tổng kết đơn hàng
          </p>
          <div className="flex items-center justify-between py-3 border-t border-b border-[#d8d8cb] text-sm">
            <span className="text-[#667068]">
              {items.reduce((count, item) => count + item.quantity, 0)} món
            </span>
            <strong className="text-lg font-extrabold text-[#163326]">
              {formatPrice(fromMinorUnits(totalMinorUnits))}
            </strong>
          </div>
          <p className="text-xs text-[#667068] leading-relaxed">
            Đây là tạm tính. Đơn hàng sẽ được tạo và chuyển sang bước thanh toán.
          </p>

          {errorMessage && (
            <p className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl" role="alert">
              {errorMessage}
            </p>
          )}

          {!isAuthenticated && (
            <Link
              className="block text-center text-xs font-bold text-[#254a39] hover:underline py-1"
              href={`/login?redirect=${encodeURIComponent("/cart?autoCheckout=true")}`}
            >
              Đăng nhập trước khi thanh toán →
            </Link>
          )}

          <button
            className="w-full min-h-[48px] py-3 px-4 bg-[#c45b38] hover:bg-[#a9472b] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center"
            disabled={isSubmitting}
            onClick={handleCreateOrder}
            type="button"
          >
            {isSubmitting ? "Đang xử lý đơn..." : "Tiến hành thanh toán"}
          </button>
        </aside>
      </div>
    </main>
  );
}
