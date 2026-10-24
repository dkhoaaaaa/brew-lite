"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "../../features/cart/cart-store";
import {
  isMockPaymentMethod,
  runMockPayment,
  type MockPaymentMethod,
  type MockPaymentOutcome,
  type MockPaymentResult,
} from "../../features/payment/mock-payment";
import type { CreatedOrderResponse } from "../../lib/orders-api";
import { formatPrice } from "../../lib/money";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <p className="state-message" role="status">Đang tải thông tin đơn hàng...</p>
        </main>
      }
    >
      <CheckoutContent />
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
    typeof order.total === "number" && Number.isFinite(order.total) &&
    Array.isArray(order.items)
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { hydrated } = useCart();
  const [method, setMethod] = useState<MockPaymentMethod | null>(null);
  const [outcome, setOutcome] = useState<MockPaymentOutcome>("success");
  const [result, setResult] = useState<MockPaymentResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderResponse | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSnapshotLoaded, setOrderSnapshotLoaded] = useState(false);
  const submissionLock = useRef(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      if (!orderId) {
        setOrderError("Không có mã đơn được backend xác nhận trong phiên này.");
        setOrderSnapshotLoaded(true);
        return;
      }

      try {
        const stored = window.sessionStorage.getItem("lastCreatedOrder");
        const parsed: unknown = stored ? JSON.parse(stored) : null;
        if (!isCreatedOrderResponse(parsed) || parsed.id !== orderId) {
          setOrderError("Không có phản hồi tạo đơn hợp lệ trong phiên này. Hãy quay lại giỏ hàng và thử lại.");
        } else {
          setCreatedOrder(parsed);
        }
      } catch {
        setOrderError("Không đọc được phản hồi tạo đơn. Hãy quay lại giỏ hàng và thử lại.");
      }
      setOrderSnapshotLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [orderId]);

  async function submitMockPayment() {
    if (submissionLock.current || !createdOrder || createdOrder.status !== "PENDING") return;
    if (!isMockPaymentMethod(method)) {
      setError("Vui lòng chọn phương thức thanh toán mô phỏng.");
      setResult(null);
      return;
    }

    submissionLock.current = true;
    setProcessing(true);
    setError(null);
    setResult(null);
    try {
      setResult(await runMockPayment(method, outcome));
    } catch {
      setError("Không thể chạy mô phỏng lúc này. Vui lòng thử lại.");
    } finally {
      submissionLock.current = false;
      setProcessing(false);
    }
  }

  if (!hydrated || !orderSnapshotLoaded) {
    return <main className="page-shell"><p className="state-message" role="status">Đang tải thông tin thanh toán...</p></main>;
  }

  if (orderError || !createdOrder) {
    return (
      <main className="page-shell">
        <section className="state-panel">
          <p className="eyebrow">Chưa có đơn được xác nhận</p>
          <h1>Chưa thể tiếp tục checkout.</h1>
          <p>{orderError ?? "Không tìm thấy phản hồi tạo đơn từ backend."}</p>
          <Link className="button button--dark" href="/cart">Quay lại giỏ hàng</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell checkout-page">
      <Link className="back-link" href="/cart">← Giỏ hàng</Link>
      <header className="checkout-heading">
        <p className="eyebrow">BrewLite · checkout thử nghiệm</p>
        <h1>Hoàn tất lựa chọn</h1>
        <p>Đây là mô phỏng giao diện. Không tạo đơn trên backend và không phát sinh giao dịch thật.</p>
      </header>

      <div className="checkout-layout">
        <section className="checkout-options">
          <div className="checkout-order-state">
            <span>Mã đơn từ backend</span>
            <strong>{createdOrder.orderCode}</strong>
            <span>Trạng thái đơn từ backend</span>
            <strong>{createdOrder.status}</strong>
            <span>Tổng đơn từ backend</span>
            <strong>{formatPrice(String(createdOrder.total))}</strong>
          </div>

          <fieldset className="option-group">
            <legend>Phương thức mô phỏng</legend>
            <div className="payment-methods">
              <label className="payment-method">
                <input
                  checked={method === "E_WALLET"}
                  name="payment-method"
                  onChange={() => {
                    setMethod("E_WALLET");
                    setError(null);
                    setResult(null);
                  }}
                  type="radio"
                />
                <span className="payment-method__icon" aria-hidden="true">◉</span>
                <span><strong>Ví điện tử</strong><small>Chỉ mô phỏng</small></span>
              </label>
              <label className="payment-method">
                <input
                  checked={method === "BANK_CARD"}
                  name="payment-method"
                  onChange={() => {
                    setMethod("BANK_CARD");
                    setError(null);
                    setResult(null);
                  }}
                  type="radio"
                />
                <span className="payment-method__icon" aria-hidden="true">▤</span>
                <span><strong>Thẻ ngân hàng</strong><small>Không nhập số thẻ</small></span>
              </label>
            </div>
          </fieldset>

          <fieldset className="option-group">
            <legend>Kết quả mô phỏng</legend>
            <div aria-label="Kết quả thanh toán giả lập" className="outcome-toggle" role="group">
              <button
                aria-pressed={outcome === "success"}
                className={outcome === "success" ? "is-selected" : ""}
                onClick={() => {
                  setOutcome("success");
                  setResult(null);
                  setError(null);
                }}
                type="button"
              >
                Thành công
              </button>
              <button
                aria-pressed={outcome === "failure"}
                className={outcome === "failure" ? "is-selected" : ""}
                onClick={() => {
                  setOutcome("failure");
                  setResult(null);
                  setError(null);
                }}
                type="button"
              >
                Thất bại
              </button>
            </div>
          </fieldset>

          <button
            className="button button--accent checkout-submit"
            disabled={processing || !method || createdOrder.status !== "PENDING"}
            onClick={submitMockPayment}
            type="button"
          >
            {processing ? "Đang mô phỏng..." : result?.outcome === "SIMULATED_FAILURE" ? "Thử lại mô phỏng" : "Chạy Mock Payment"}
          </button>
          {error && <p className="payment-result payment-result--failure" role="alert">{error}</p>}
          {result && (
            <section
              aria-live="polite"
              className={`payment-result ${result.outcome === "SIMULATED_SUCCESS" ? "payment-result--success" : "payment-result--failure"}`}
              role="status"
            >
              <strong>{result.outcome === "SIMULATED_SUCCESS" ? "Kết quả mô phỏng: thành công" : "Kết quả mô phỏng: thất bại"}</strong>
              <p>{result.message}</p>
              <small>Đây không phải trạng thái thanh toán của đơn hàng. Không có đơn hàng hoặc giao dịch thật nào được tạo.</small>
            </section>
          )}
          {createdOrder.status !== "PENDING" && (
            <p className="payment-result payment-result--failure" role="status">
              Đơn hàng không ở trạng thái PENDING; không chạy mô phỏng thanh toán.
            </p>
          )}
        </section>

        <aside className="checkout-summary">
          <p className="eyebrow">Tóm tắt giỏ hàng</p>
          {createdOrder.items.map((item) => (
            <div className="checkout-summary__line" key={item.id}>
              <span>{item.quantity} × {item.productName} (Size {item.sizeCode})</span>
              <strong>{formatPrice(String(item.lineTotal))}</strong>
            </div>
          ))}
          <div className="checkout-summary__total">
            <span>Tổng cộng</span>
            <strong>{formatPrice(String(createdOrder.total))}</strong>
          </div>
          <p>Chờ API tạo đơn và thanh toán xác nhận. Kết quả mô phỏng không thay thế response backend.</p>
        </aside>
      </div>
    </main>
  );
}