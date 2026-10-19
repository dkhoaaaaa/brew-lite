"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "../../features/cart/cart-store";
import {
  runMockPayment,
  type MockPaymentMethod,
  type MockPaymentOutcome,
  type MockPaymentResult,
} from "../../features/payment/mock-payment";
import { formatPrice, fromMinorUnits, toMinorUnits } from "../../lib/money";

export default function CheckoutPage() {
  const { items, hydrated, totalMinorUnits } = useCart();
  const [method, setMethod] = useState<MockPaymentMethod>("E_WALLET");
  const [outcome, setOutcome] = useState<MockPaymentOutcome>("success");
  const [result, setResult] = useState<MockPaymentResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitMockPayment() {
    if (processing || items.length === 0) return;
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
    return <main className="page-shell"><p className="state-message" role="status">Đang tải thông tin thanh toán...</p></main>;
  }

  if (items.length === 0) {
    return (
      <main className="page-shell">
        <section className="state-panel">
          <p className="eyebrow">Checkout</p>
          <h1>Chưa có món để thanh toán.</h1>
          <p>Thêm món vào giỏ trước khi thử Mock Payment.</p>
          <Link className="button button--dark" href="/menu">Quay lại menu</Link>
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
            <span>Trạng thái đơn hàng</span>
            <strong>Chưa tạo</strong>
            <span>Tạm tính từ giỏ hàng</span>
            <strong>{formatPrice(fromMinorUnits(totalMinorUnits))}</strong>
          </div>

          <fieldset className="option-group">
            <legend>Phương thức mô phỏng</legend>
            <div className="payment-methods">
              <label className="payment-method">
                <input
                  checked={method === "E_WALLET"}
                  name="payment-method"
                  onChange={() => setMethod("E_WALLET")}
                  type="radio"
                />
                <span className="payment-method__icon" aria-hidden="true">◉</span>
                <span><strong>Ví điện tử</strong><small>Chỉ mô phỏng</small></span>
              </label>
              <label className="payment-method">
                <input
                  checked={method === "BANK_CARD"}
                  name="payment-method"
                  onChange={() => setMethod("BANK_CARD")}
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
        </section>

        <aside className="checkout-summary">
          <p className="eyebrow">Tóm tắt giỏ hàng</p>
          {items.map((item) => (
            <div className="checkout-summary__line" key={item.cartItemId}>
              <span>{item.quantity} × {item.productName}</span>
              <strong>{formatPrice(fromMinorUnits(toMinorUnits(item.unitPrice) * item.quantity))}</strong>
            </div>
          ))}
          <div className="checkout-summary__total">
            <span>Tổng cộng</span>
            <strong>{formatPrice(fromMinorUnits(totalMinorUnits))}</strong>
          </div>
          <p>Chờ API tạo đơn và thanh toán xác nhận. Kết quả mô phỏng không thay thế response backend.</p>
        </aside>
      </div>
    </main>
  );
}