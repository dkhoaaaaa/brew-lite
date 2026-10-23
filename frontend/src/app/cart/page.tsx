"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCart } from "../../features/cart/cart-store";
import { formatPrice, fromMinorUnits, toMinorUnits } from "../../lib/money";
import { createOrder } from "../../lib/orders-api";
import { useAuth } from "../../lib/auth";
import { toCreateOrderPayload } from "../../features/cart/cart-logic";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const {
    items,
    hydrated,
    totalMinorUnits,
    increaseItem,
    decreaseItem,
    removeItem,
    clearCart,
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
      const createdOrder = await createOrder(orderPayload, user.id);
      window.sessionStorage.setItem("lastCreatedOrder", JSON.stringify(createdOrder));
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
  }

  if (!hydrated) {
    return <main className="page-shell"><p className="state-message" role="status">Đang khôi phục giỏ hàng...</p></main>;
  }

  if (items.length === 0) {
    return (
      <main className="page-shell cart-page">
        <p className="eyebrow">BrewLite · giỏ hàng</p>
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