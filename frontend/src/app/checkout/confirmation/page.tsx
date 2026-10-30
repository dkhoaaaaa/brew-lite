"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "../../../features/cart/cart-store";
import { formatPrice } from "../../../lib/money";
import { getOrderById, type CreatedOrderResponse } from "../../../lib/orders-api";
import {
  getDisplayText,
  getOrderStatusLabel,
  shouldClearCartAfterPayment,
} from "../../../features/payment/payment-display";
import "../../../styles/order-confirmation.css";

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="oc-page">
          <div className="oc-container">
            <p className="oc-meta-label" role="status">Đang tải trạng thái thanh toán...</p>
          </div>
        </main>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { hydrated, clearCart } = useCart();
  const clearCartRef = useRef(clearCart);
  const [order, setOrder] = useState<CreatedOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    clearCartRef.current = clearCart;
  }, [clearCart]);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      getOrderById(orderId)
        .then((currentOrder) => {
          if (!active) return;
          setOrder(currentOrder);
          if (shouldClearCartAfterPayment(currentOrder.status) && hydrated) {
            clearCartRef.current();
          }
          try {
            window.sessionStorage.setItem("lastCreatedOrder", JSON.stringify(currentOrder));
            if (shouldClearCartAfterPayment(currentOrder.status) && hydrated) {
              window.sessionStorage.removeItem("lastCreatedOrderRequest");
              window.sessionStorage.removeItem("lastCreatedOrderId");
            }
          } catch {
            // Backend state remains authoritative when browser storage is unavailable.
          }
        })
        .catch((cause) => {
          if (active) {
            setError(cause instanceof Error ? cause.message : "Không thể tải trạng thái đơn hàng.");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [orderId, attempt, hydrated]);

  if (!orderId) {
    return (
      <main className="oc-page">
        <div className="oc-container">
          <section className="oc-empty-state" role="alert">
            <h2>Chưa xác minh được giao dịch</h2>
            <p>Không tìm thấy mã đơn hàng cần xác nhận.</p>
            <Link className="oc-btn oc-btn-secondary" href="/orders">Đơn hàng của tôi</Link>
          </section>
        </div>
      </main>
    );
  }

  if (loading || !hydrated) {
    return (
      <main className="oc-page">
        <div className="oc-container">
          <p className="oc-meta-label" role="status">Đang xác minh trạng thái từ backend...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="oc-page">
        <div className="oc-container">
          <section className="oc-empty-state" role="alert">
            <h2>Chưa xác minh được giao dịch</h2>
            <p>{error ?? "Không nhận được đơn hàng từ backend."}</p>
            <div className="oc-actions">
              <button className="oc-btn oc-btn-primary" onClick={() => setAttempt((value) => value + 1)} type="button">
                Thử tải lại
              </button>
              <Link className="oc-btn oc-btn-secondary" href="/orders">Đơn hàng của tôi</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const paid = order.status === "PAID";
  const statusLabel = getOrderStatusLabel(order.status);
  const payment = order.payments?.[0];
  const paymentMethodLabel =
    payment?.method === "VNPAY" ? "VNPay Sandbox" : "Chưa xác định";
  const paidAt = payment?.paidAt
    ? new Date(payment.paidAt).toLocaleString("vi-VN")
    : "Chưa có xác nhận thanh toán";

  return (
    <main className="oc-page">
      <div className="oc-container">
        <header className="oc-header">
          <div className="oc-status-badge" aria-hidden="true">{paid ? "✓" : "!"}</div>
          <h1>{paid ? "Thanh toán thành công" : statusLabel}</h1>
          <p>
            {paid
              ? "VNPay đã gửi kết quả hợp lệ và backend đã cập nhật đơn hàng."
              : "Kết quả được lấy từ backend; nếu VNPay chưa gửi callback, hãy tải lại sau ít phút."}
          </p>
        </header>

        <div className="oc-grid">
          <section className="oc-card" aria-labelledby="order-items-heading">
            <h2 className="oc-card-title" id="order-items-heading">Danh sách món đã đặt</h2>
            <div className="oc-items">
              {order.items.map((item) => (
                <article className="oc-item" key={item.id}>
                  <div className="oc-item-info">
                    <h3 className="oc-item-name">
                      {item.quantity} × {getDisplayText(item.productName, "Món")}
                    </h3>
                    <p className="oc-item-meta">
                      Size: {getDisplayText(item.sizeCode, "Chưa xác định")} · Đơn giá: {formatPrice(String(item.unitPrice))}
                    </p>
                    {(item.sugarPercent != null || item.icePercent != null) && (
                      <p className="oc-item-toppings">
                        {item.sugarPercent != null ? `Đường ${item.sugarPercent}%` : ""}
                        {item.sugarPercent != null && item.icePercent != null ? " · " : ""}
                        {item.icePercent != null ? `Đá ${item.icePercent}%` : ""}
                      </p>
                    )}
                    {item.toppings.length > 0 && (
                      <p className="oc-item-toppings">
                        Topping: {item.toppings.map((topping) => `${topping.name} (x${topping.quantity})`).join(", ")}
                      </p>
                    )}
                    {item.note && <p className="oc-item-toppings">Ghi chú: {item.note}</p>}
                  </div>
                  <div className="oc-item-price">{formatPrice(String(item.lineTotal))}</div>
                </article>
              ))}
            </div>
            <div className="oc-summary-breakdown">
              <div className="oc-summary-row">
                <span>Tạm tính</span><span>{formatPrice(String(order.subtotal))}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="oc-summary-row">
                  <span>Giảm giá</span><span>-{formatPrice(String(order.discountAmount))}</span>
                </div>
              )}
              <div className="oc-summary-row total-row">
                <span>Tổng thanh toán</span><span>{formatPrice(String(order.total))}</span>
              </div>
            </div>
          </section>

          <aside className="oc-sidebar">
            <div className="oc-card">
              <h2 className="oc-card-title">Thông tin giao dịch</h2>
              <div className="oc-meta-list">
                <div className="oc-meta-row">
                  <span className="oc-meta-label">Mã đơn hàng</span>
                  <span className="oc-meta-value">{getDisplayText(order.orderCode, "Chưa xác định")}</span>
                </div>
                <div className="oc-meta-row">
                  <span className="oc-meta-label">Trạng thái</span>
                  <span className="oc-status-pill">{statusLabel}</span>
                </div>
                <div className="oc-meta-row">
                  <span className="oc-meta-label">Phương thức</span>
                  <span className="oc-meta-value">{paymentMethodLabel}</span>
                </div>
                <div className="oc-meta-row">
                  <span className="oc-meta-label">Thời gian</span>
                  <span className="oc-meta-value">{paidAt}</span>
                </div>
              </div>
            </div>
            <div className="oc-disclaimer">
              <h3 className="oc-disclaimer-title">Trạng thái giao dịch</h3>
              <p className="oc-disclaimer-text">
                {paid
                  ? "Giao dịch đã được xác minh bằng callback VNPay hợp lệ."
                  : "Không sử dụng dữ liệu trên trình duyệt để đánh dấu đơn hàng đã thanh toán."}
              </p>
            </div>
            <div className="oc-actions">
              {!paid && (order.status === "PENDING" || order.status === "PAYMENT_FAILED") && (
                <Link className="oc-btn oc-btn-primary" href={`/checkout?orderId=${encodeURIComponent(order.id)}`}>
                  Thử thanh toán lại
                </Link>
              )}
              <Link className="oc-btn oc-btn-secondary" href="/orders">Đơn hàng của tôi</Link>
              <Link className="oc-btn oc-btn-secondary" href="/menu">Tiếp tục mua sắm</Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
