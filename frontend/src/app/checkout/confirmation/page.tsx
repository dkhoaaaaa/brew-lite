"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "../../../lib/money";
import { getOrderById, type CreatedOrderResponse } from "../../../lib/orders-api";
import "../../../styles/order-confirmation.css";

interface StoredMockPayment {
  method: "E_WALLET" | "BANK_CARD";
  outcome: "SIMULATED_SUCCESS" | "SIMULATED_FAILURE";
  timestamp: string;
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="oc-page">
          <div className="oc-container">
            <p className="oc-meta-label" role="status">Đang tải thông tin xác nhận đơn hàng...</p>
          </div>
        </main>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}

function isCreatedOrderResponse(value: unknown): value is CreatedOrderResponse {
  if (typeof value !== "object" || value === null) return false;
  const order = value as Partial<CreatedOrderResponse>;
  return (
    typeof order.id === "string" &&
    typeof order.orderCode === "string" &&
    typeof order.status === "string" &&
    typeof order.total === "number" &&
    Number.isFinite(order.total) &&
    Array.isArray(order.items)
  );
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<CreatedOrderResponse | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<StoredMockPayment | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!orderId) {
      setError("Không tìm thấy mã đơn hàng cần xác nhận.");
      setLoaded(true);
      return;
    }

    // Đọc thông tin payment từ session nếu có
    try {
      const storedPaymentRaw = window.sessionStorage.getItem("lastMockPaymentResult");
      if (storedPaymentRaw) {
        const parsedPayment = JSON.parse(storedPaymentRaw) as StoredMockPayment;
        setPaymentInfo(parsedPayment);
      }
    } catch {
      // Ignore
    }

    // 1. Thử đọc từ sessionStorage
    try {
      const storedOrderRaw = window.sessionStorage.getItem("lastCreatedOrder");
      const parsedOrder: unknown = storedOrderRaw ? JSON.parse(storedOrderRaw) : null;

      if (isCreatedOrderResponse(parsedOrder) && parsedOrder.id === orderId) {
        setOrder(parsedOrder);
        setLoaded(true);
        return;
      }
    } catch {
      // Fallback API
    }

    // 2. Nếu session không có, gọi API lấy từ Backend
    getOrderById(orderId)
      .then((data) => {
        if (!active) return;
        setOrder(data);
        setLoaded(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không tìm thấy dữ liệu đơn hàng.");
        setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  if (!loaded) {
    return (
      <main className="oc-page">
        <div className="oc-container">
          <p className="oc-meta-label" role="status">Đang tải thông tin đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="oc-page">
        <div className="oc-container">
          <section className="oc-empty-state">
            <h2>Không tìm thấy thông tin đơn hàng</h2>
            <p>{error ?? "Phiên thanh toán đã kết thúc hoặc không tồn tại đơn hàng tương ứng."}</p>
            <div className="oc-actions" style={{ maxWidth: "260px", margin: "0 auto" }}>
              <Link className="oc-btn oc-btn-primary" href="/orders">
                Đơn hàng của tôi
              </Link>
              <Link className="oc-btn oc-btn-secondary" href="/menu">
                Xem thực đơn
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const paymentMethodLabel =
    paymentInfo?.method === "BANK_CARD" || order.payments?.[0]?.method === "BANK_CARD"
      ? "Thẻ ngân hàng (Mô phỏng)"
      : "Ví điện tử (Mô phỏng)";

  const formattedDate = paymentInfo?.timestamp
    ? new Date(paymentInfo.timestamp).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : order.payments?.[0]?.paidAt
    ? new Date(order.payments[0].paidAt).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <main className="oc-page">
      <div className="oc-container">
        {/* Header với biểu tượng dấu tích tối giản */}
        <header className="oc-header">
          <div className="oc-status-badge" aria-hidden="true">✓</div>
          <h1>Thanh toán thành công</h1>
          <p>
            Cảm ơn bạn đã lựa chọn BrewLite. Đơn hàng đã được xác nhận thanh toán mô phỏng và cập nhật vào hệ thống.
          </p>
        </header>

        <div className="oc-grid">
          {/* Cột chính: Danh sách món & Tổng tiền */}
          <section className="oc-card" aria-labelledby="order-items-heading">
            <h2 className="oc-card-title" id="order-items-heading">Danh sách món đã đặt</h2>

            <div className="oc-items">
              {order.items.map((item) => (
                <article className="oc-item" key={item.id}>
                  <div className="oc-item-info">
                    <h3 className="oc-item-name">
                      {item.quantity} × {item.productName}
                    </h3>
                    <p className="oc-item-meta">
                      Size: {item.sizeCode} · Đơn giá: {formatPrice(String(item.unitPrice))}
                    </p>
                    {(item.sugarPercent !== undefined || item.icePercent !== undefined) && (
                      <p className="oc-item-toppings">
                        {item.sugarPercent !== undefined ? `Đường ${item.sugarPercent}%` : ""}
                        {item.sugarPercent !== undefined && item.icePercent !== undefined ? " · " : ""}
                        {item.icePercent !== undefined ? `Đá ${item.icePercent}%` : ""}
                      </p>
                    )}
                    {Array.isArray(item.toppings) && item.toppings.length > 0 && (
                      <p className="oc-item-toppings">
                        Topping: {item.toppings.map((t) => `${t.name} (x${t.quantity})`).join(", ")}
                      </p>
                    )}
                    {item.note && (
                      <p className="oc-item-toppings" style={{ fontStyle: "italic" }}>
                        Ghi chú: {item.note}
                      </p>
                    )}
                  </div>
                  <div className="oc-item-price">
                    {formatPrice(String(item.lineTotal))}
                  </div>
                </article>
              ))}
            </div>

            <div className="oc-summary-breakdown">
              <div className="oc-summary-row">
                <span>Tạm tính</span>
                <span>{formatPrice(String(order.subtotal))}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="oc-summary-row">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(String(order.discountAmount))}</span>
                </div>
              )}
              <div className="oc-summary-row total-row">
                <span>Tổng thanh toán</span>
                <span>{formatPrice(String(order.total))}</span>
              </div>
            </div>
          </section>

          {/* Cột phải: Thông tin giao dịch & nút hành động */}
          <aside className="oc-sidebar">
            <div className="oc-card">
              <h2 className="oc-card-title">Thông tin giao dịch</h2>
              <div className="oc-meta-list">
                <div className="oc-meta-row">
                  <span className="oc-meta-label">Mã đơn hàng</span>
                  <span className="oc-meta-value">{order.orderCode}</span>
                </div>
                <div className="oc-meta-row">
                  <span className="oc-meta-label">Trạng thái hệ thống</span>
                  <div className="oc-status-pill" style={{ background: "#EBF8F2", color: "#22543D", borderColor: "#9AE6B4" }}>
                    {order.status}
                  </div>
                </div>
                <div className="oc-meta-row">
                  <span className="oc-meta-label">Phương thức mô phỏng</span>
                  <span className="oc-meta-value">{paymentMethodLabel}</span>
                </div>
                <div className="oc-meta-row">
                  <span className="oc-meta-label">Thời gian hoàn tất</span>
                  <span className="oc-meta-value" style={{ fontSize: "14px", fontWeight: 400 }}>
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Lưu ý thử nghiệm */}
            <div className="oc-disclaimer">
              <h3 className="oc-disclaimer-title">Lưu ý thử nghiệm</h3>
              <p className="oc-disclaimer-text">
                Đơn hàng đã được lưu và cập nhật trạng thái PAID trong cơ sở dữ liệu. Đây là giao dịch thanh toán mô phỏng trong môi trường phát triển.
              </p>
            </div>

            {/* Các nút hành động */}
            <div className="oc-actions">
              <Link className="oc-btn oc-btn-primary" href="/orders">
                Đơn hàng của tôi
              </Link>
              <Link className="oc-btn oc-btn-secondary" href={`/orders/${encodeURIComponent(order.id)}`}>
                Xem chi tiết đơn hàng
              </Link>
              <Link className="oc-btn oc-btn-secondary" href="/menu">
                Tiếp tục mua sắm
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
