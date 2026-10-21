"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "../../features/cart/cart-store";
import { formatPrice, fromMinorUnits, toMinorUnits } from "../../lib/money";
import { createOrder, type CreateOrderPayload } from "../../lib/orders-api";

export default function CartPage() {
  const router = useRouter();
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

  async function handleCheckout() {
    if (isSubmitting || items.length === 0) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const orderItems = items.map((item, index) => {
        if (!item.size?.id) {
          throw new Error(
            `Món "${item.productName}" chưa có size hợp lệ. Vui lòng chọn lại món kèm size.`
          );
        }

        return {
          productId: item.productId,
          productSizeId: item.size.id,
          quantity: item.quantity,
          sugarPercent: 100,
          icePercent: 100,
          toppings: item.toppings.map((t) => ({
            toppingId: t.id,
            quantity: 1,
          })),
        };
      });

      const payload: CreateOrderPayload = {
        items: orderItems,
      };

      // Gọi API POST /orders
      const createdOrder = await createOrder(payload);

      // Lưu thông tin đơn vừa tạo và xóa giỏ hàng
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastCreatedOrder", JSON.stringify(createdOrder));
      }
      clearCart();

      // Chuyển hướng sang trang Thanh toán mang theo orderId và orderCode
      router.push(`/checkout?orderId=${encodeURIComponent(createdOrder.id)}&orderCode=${encodeURIComponent(createdOrder.orderCode)}`);
    } catch (err: unknown) {
      // Bắt lỗi 400 Bad Request từ Backend và hiển thị cho người dùng
      setErrorMessage(
        err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="page-shell">
        <p className="state-message" role="status">
          Đang khôi phục giỏ hàng...
        </p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="page-shell cart-page">
        <p className="eyebrow">BrewLite · giỏ hàng</p>
        <section className="state-panel">
          <h1>Giỏ hàng đang trống.</h1>
          <p>Chọn một món từ menu để bắt đầu.</p>
          <Link className="button button--dark" href="/menu">
            Tiếp tục mua hàng
          </Link>
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
        <Link className="back-link" href="/menu">
          ← Tiếp tục mua
        </Link>
      </header>

      <div className="cart-layout">
        <section aria-label="Các món trong giỏ" className="cart-lines">
          {items.map((item) => (
            <article className="cart-line" key={item.cartItemId}>
              <div className="cart-line__image">
                {item.productImageUrl ? (
                  <Image
                    src={item.productImageUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="96px"
                  />
                ) : (
                  <span aria-hidden="true">BL</span>
                )}
              </div>
              <div className="cart-line__details">
                <h2>{item.productName}</h2>
                <p>{item.size ? `Size ${item.size.sizeCode}` : "Không chọn size"}</p>
                <p>
                  {item.toppings.length
                    ? item.toppings.map((topping) => topping.name).join(", ")
                    : "Không topping"}
                </p>
                <strong>{formatPrice(item.unitPrice)} / món</strong>
              </div>
              <div className="cart-line__controls">
                <div
                  className="quantity-control"
                  aria-label={`Số lượng ${item.productName}`}
                >
                  <button
                    aria-label="Giảm số lượng"
                    onClick={() => decreaseItem(item.cartItemId)}
                    type="button"
                  >
                    −
                  </button>
                  <span aria-live="polite">{item.quantity}</span>
                  <button
                    aria-label="Tăng số lượng"
                    onClick={() => increaseItem(item.cartItemId)}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <strong>
                  {formatPrice(
                    fromMinorUnits(toMinorUnits(item.unitPrice) * item.quantity)
                  )}
                </strong>
                <button
                  className="text-button"
                  onClick={() => removeItem(item.cartItemId)}
                  type="button"
                >
                  Xóa món
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="cart-summary">
          <p className="eyebrow">Tổng kết</p>
          <div>
            <span>
              {items.reduce((count, item) => count + item.quantity, 0)} món
            </span>
            <strong>{formatPrice(fromMinorUnits(totalMinorUnits))}</strong>
          </div>

          {/* Báo lỗi 400 nếu Backend trả về lỗi */}
          {errorMessage && (
            <div
              className="state-panel mt-3 mb-3"
              role="alert"
              style={{
                backgroundColor: "#fff1f2",
                borderColor: "#fecdd3",
                padding: "12px",
                borderRadius: "8px",
                color: "#be123c",
                fontSize: "14px",
              }}
            >
              <strong>Không thể đặt hàng:</strong>
              <p className="mt-1">{errorMessage}</p>
            </div>
          )}

          <p className="mt-2">Đơn hàng sẽ được gửi và tạo trên hệ thống khi bạn bấm tiếp tục.</p>

          {/* Nút bấm Đặt hàng có Loading State */}
          <button
            className="button button--accent w-full justify-center"
            disabled={isSubmitting}
            onClick={handleCheckout}
            type="button"
          >
            {isSubmitting ? (
              <span>Đang tạo đơn hàng...</span>
            ) : (
              <span>
                Xác nhận đặt hàng <span aria-hidden="true">↗</span>
              </span>
            )}
          </button>
        </aside>
      </div>
    </main>
  );
}