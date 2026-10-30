"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCart } from "../../features/cart/cart-store";
import { formatPrice, fromMinorUnits, toMinorUnits } from "../../lib/money";
import {
  createOrder,
  getOrderById,
  type CreatedOrderResponse,
} from "../../lib/orders-api";
import { ApiError } from "../../lib/api-client";
import { useAuth } from "../../lib/auth";
import { toCreateOrderPayload } from "../../features/cart/cart-logic";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const {
    items,
    hydrated,
    storageError,
    totalMinorUnits,
    increaseItem,
    decreaseItem,
    removeItem,
  } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submissionLock = useRef(false);

  async function handleCreateOrder() {
    if (submissionLock.current || items.length === 0) return;
    setErrorMessage(null);

    if (!isAuthenticated || !user?.id) {
      setErrorMessage("Vui lòng đăng nhập để tạo đơn hàng.");
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
      const fingerprint = JSON.stringify(orderPayload);
      let savedRequest: string | null = null;
      let savedOrderId: string | null = null;
      try {
        savedRequest = window.sessionStorage.getItem("lastCreatedOrderRequest");
        savedOrderId = window.sessionStorage.getItem("lastCreatedOrderId");
      } catch {
        // Continue with a new order if browser storage is unavailable.
      }

      let createdOrder: CreatedOrderResponse;
      if (savedRequest === fingerprint && savedOrderId) {
        let existingOrder: CreatedOrderResponse | null = null;
        try {
          existingOrder = await getOrderById(savedOrderId);
        } catch (cause) {
          if (!(cause instanceof ApiError) || cause.status !== 404) throw cause;
        }
        if (
          existingOrder &&
          (existingOrder.status === "PENDING" || existingOrder.status === "PAYMENT_FAILED") &&
          (!existingOrder.expiresAt || new Date(existingOrder.expiresAt).getTime() > Date.now())
        ) {
          createdOrder = existingOrder;
        } else {
          createdOrder = await createOrder(orderPayload, user.id);
        }
      } else {
        createdOrder = await createOrder(orderPayload, user.id);
      }

      try {
        window.sessionStorage.setItem("lastCreatedOrderRequest", fingerprint);
        window.sessionStorage.setItem("lastCreatedOrderId", createdOrder.id);
        window.sessionStorage.setItem("lastCreatedOrder", JSON.stringify(createdOrder));
      } catch {
        // The server order remains authoritative; checkout can reload it from the API.
      }
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
  }

  if (!hydrated) {
    return <main className="page-shell"><p className="state-message" role="status">Đang khôi phục giỏ hàng...</p></main>;
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
          <h1>Giỏ hàng đang trống.</h1>
          <p>Chọn một món từ menu để bắt đầu.</p>
          <Link className="button button--dark" href="/menu">Tiếp tục mua hàng</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell cart-page">
      <header className="cart-heading">
        <div>
          <p className="eyebrow">BrewLite · giỏ hàng</p>
          <h1>Món đã chọn</h1>
        </div>
        <Link className="back-link" href="/menu">← Tiếp tục mua</Link>
      </header>
      <p className="state-message" role="status">
        Giỏ hàng hiện được lưu trên thiết bị này. Backend chưa có API giỏ hàng nên
        chưa đồng bộ giữa thiết bị hoặc lên cơ sở dữ liệu.
      </p>
      {storageError && <p className="payment-result payment-result--failure" role="alert">{storageError}</p>}
      <div className="cart-layout">
        <section aria-label="Các món trong giỏ" className="cart-lines">
          {items.map((item) => (
            <article className="cart-line" key={item.cartItemId}>
              <div className="cart-line__image">
                {item.productImageUrl ? (
                  <Image src={item.productImageUrl} alt="" fill unoptimized sizes="96px" />
                ) : (
                  <span aria-hidden="true">BL</span>
                )}
              </div>
              <div className="cart-line__details">
                <h2>{item.productName}</h2>
                <p>{item.size ? `Size ${item.size.sizeCode}` : "Không chọn size"}</p>
                <p>{item.toppings.length ? item.toppings.map((topping) => topping.name).join(", ") : "Không topping"}</p>
                {(item.sugarPercent != null || item.icePercent != null) && (
                  <p>
                    {item.sugarPercent != null ? `Đường ${item.sugarPercent}%` : ""}
                    {item.sugarPercent != null && item.icePercent != null ? " · " : ""}
                    {item.icePercent != null ? `Đá ${item.icePercent}%` : ""}
                  </p>
                )}
                <strong>{formatPrice(item.unitPrice)} / món</strong>
              </div>
              <div className="cart-line__controls">
                <div className="quantity-control" aria-label={`Số lượng ${item.productName}`}>
                  <button aria-label="Giảm số lượng" onClick={() => decreaseItem(item.cartItemId)} type="button">−</button>
                  <span aria-live="polite">{item.quantity}</span>
                  <button aria-label="Tăng số lượng" onClick={() => increaseItem(item.cartItemId)} type="button">+</button>
                </div>
                <strong>{formatPrice(fromMinorUnits(toMinorUnits(item.unitPrice) * item.quantity))}</strong>
                <button className="text-button" onClick={() => removeItem(item.cartItemId)} type="button">Xóa món</button>
              </div>
            </article>
          ))}
        </section>
        <aside className="cart-summary">
          <p className="eyebrow">Tổng kết</p>
          <div><span>{items.reduce((count, item) => count + item.quantity, 0)} món</span><strong>{formatPrice(fromMinorUnits(totalMinorUnits))}</strong></div>
          <p>Đây là tạm tính. Đơn hàng chưa được gửi tới backend.</p>
          {errorMessage && <p className="payment-result payment-result--failure" role="alert">{errorMessage}</p>}
          {!isAuthenticated && <Link className="text-button" href="/login">Đăng nhập trước khi tạo đơn</Link>}
          <button
            className="button button--accent"
            disabled={isSubmitting}
            onClick={handleCreateOrder}
            type="button"
          >
            {isSubmitting ? "Đang tạo đơn..." : "Tạo đơn và tiếp tục"}
            {!isSubmitting && <span aria-hidden="true">↗</span>}
          </button>
        </aside>
      </div>
    </main>
  );
}