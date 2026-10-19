"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../../features/cart/cart-store";
import {
  runMockPayment,
  type MockPaymentMethod,
  type MockPaymentOutcome,
  type MockPaymentResult,
} from "../../features/payment/mock-payment";
import { formatPrice, fromMinorUnits, toMinorUnits } from "../../lib/money";
import type { CreatedOrderResponse } from "../../lib/orders-api";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const orderCodeParam = searchParams.get("orderCode");

  const { items, hydrated, totalMinorUnits } = useCart();
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderResponse | null>(null);

  const [method, setMethod] = useState<MockPaymentMethod>("E_WALLET");
  const [outcome, setOutcome] = useState<MockPaymentOutcome>("success");
  const [result, setResult] = useState<MockPaymentResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("lastCreatedOrder");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CreatedOrderResponse;
          if (!orderIdParam || parsed.id === orderIdParam) {
            setCreatedOrder(parsed);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [orderIdParam]);

  async function submitMockPayment() {
    if (processing) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    try {
      setResult(await runMockPayment(method, outcome));
    } catch {
      setError("Không thể chạy mô phỏng lúc này. Vui lòng thử lại.");
    } finally {
      setProcessing(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="page-shell">
        <p className="state-message" role="status">
          Đang tải thông tin thanh toán...
        </p>
      </main>
    );
  }

  const hasOrder = Boolean(createdOrder || orderCodeParam);

  if (!hasOrder && items.length === 0) {
    return (
      <main className="page-shell">
        <section className="state-panel">
          <p className="eyebrow">Checkout</p>
          <h1>Chưa có món để thanh toán.</h1>
          <p>Thêm món vào giỏ trước khi tiến hành thanh toán.</p>
          <Link className="button button--dark" href="/menu">
            Quay lại menu
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell checkout-page">
      <Link className="back-link" href="/cart">
        ← Giỏ hàng
      </Link>
      <header className="checkout-heading">
        <p className="eyebrow">BrewLite · thanh toán đơn hàng</p>
        <h1>Xác nhận thanh toán</h1>
        <p>Đơn hàng đã được khởi tạo thành công trên hệ thống.</p>
      </header>

      <div className="checkout-layout">
        <section className="checkout-options">
          <div className="checkout-order-state">
            <span>Mã đơn hàng</span>
            <strong style={{ color: "#065f46" }}>
              {createdOrder?.orderCode ?? orderCodeParam ?? "Đang khởi tạo"}
            </strong>

            <span>Trạng thái đơn</span>
            <strong>{createdOrder?.status ?? "PENDING"}</strong>

            <span>Tổng thanh toán</span>
            <strong>
              {createdOrder
                ? formatPrice(createdOrder.total.toString())
                : formatPrice(fromMinorUnits(totalMinorUnits))}
            </strong>
          </div>

          <fieldset className="option-group">
            <legend>Phương thức thanh toán</legend>
            <div className="payment-methods">
              <label className="payment-method">
                <input
                  checked={method === "E_WALLET"}
                  name="payment-method"
                  onChange={() => setMethod("E_WALLET")}
                  type="radio"
                />
                <span className="payment-method__icon" aria-hidden="true">
                  ◉
                </span>
                <span>
                  <strong>Ví điện tử</strong>
                  <small>Momo / ZaloPay / VNPay</small>
                </span>
              </label>
              <label className="payment-method">
                <input
                  checked={method === "BANK_CARD"}
                  name="payment-method"
                  onChange={() => setMethod("BANK_CARD")}
                  type="radio"
                />
                <span className="payment-method__icon" aria-hidden="true">
                  ▤
                </span>
                <span>
                  <strong>Thẻ ngân hàng</strong>
                  <small>Thẻ ATM / Visa / Mastercard</small>
                </span>
              </label>
            </div>
          </fieldset>

          <fieldset className="option-group">
            <legend>Kết quả mô phỏng thanh toán</legend>
            <div
              aria-label="Kết quả thanh toán giả lập"
              className="outcome-toggle"
              role="group"
            >
              <button
                aria-pressed={outcome === "success"}
                className={outcome === "success" ? "is-selected" : ""}
                onClick={() => setOutcome("success")}
                type="button"
              >
                Thành công
              </button>
              <button
                aria-pressed={outcome === "failure"}
                className={outcome === "failure" ? "is-selected" : ""}
                onClick={() => setOutcome("failure")}
                type="button"
              >
                Thất bại
              </button>
            </div>
          </fieldset>

          <button
            className="button button--accent checkout-submit"
            disabled={processing}
            onClick={submitMockPayment}
            type="button"
          >
            {processing
              ? "Đang xử lý..."
              : result?.outcome === "SIMULATED_FAILURE"
              ? "Thử lại thanh toán"
              : "Xác nhận thanh toán"}
          </button>

          {error && (
            <p className="payment-result payment-result--failure" role="alert">
              {error}
            </p>
          )}

          {result && (
            <section
              aria-live="polite"
              className={`payment-result ${
                result.outcome === "SIMULATED_SUCCESS"
                  ? "payment-result--success"
                  : "payment-result--failure"
              }`}
              role="status"
            >
              <strong>
                {result.outcome === "SIMULATED_SUCCESS"
                  ? "Thanh toán thành công"
                  : "Thanh toán thất bại"}
              </strong>
              <p>{result.message}</p>
            </section>
          )}
        </section>

        <aside className="checkout-summary">
          <p className="eyebrow">Chi tiết món đã đặt</p>
          {createdOrder ? (
            createdOrder.items.map((item) => (
              <div className="checkout-summary__line" key={item.id}>
                <span>
                  {item.quantity} × {item.productName} (Size {item.sizeCode})
                </span>
                <strong>{formatPrice(item.lineTotal.toString())}</strong>
              </div>
            ))
          ) : (
            items.map((item) => (
              <div className="checkout-summary__line" key={item.cartItemId}>
                <span>
                  {item.quantity} × {item.productName}
                </span>
                <strong>
                  {formatPrice(
                    fromMinorUnits(toMinorUnits(item.unitPrice) * item.quantity)
                  )}
                </strong>
              </div>
            ))
          )}

          <div className="checkout-summary__total">
            <span>Tổng cộng</span>
            <strong>
              {createdOrder
                ? formatPrice(createdOrder.total.toString())
                : formatPrice(fromMinorUnits(totalMinorUnits))}
            </strong>
          </div>
        </aside>
      </div>
    </main>
  );
}