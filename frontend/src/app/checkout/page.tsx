"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "../../features/cart/cart-store";
import {
  cancelOrder,
  createVnpayPayment,
  getOrderById,
  type CreatedOrderResponse,
  type VnpayPaymentChannel,
} from "../../lib/orders-api";
import { formatPrice } from "../../lib/money";
import {
  getDisplayText,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "../../features/payment/payment-display";

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

function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { hydrated } = useCart();
  const [order, setOrder] = useState<CreatedOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [paymentChannel, setPaymentChannel] = useState<VnpayPaymentChannel>("VNBANK");
  const submissionLock = useRef(false);
  const idempotencyKey = useRef<string | null>(null);
  const timeLeft = order?.expiresAt && currentTime !== null
    ? Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - currentTime) / 1000))
    : null;

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setOrderError("Không có mã đơn hàng để tải.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setOrderError(null);
    try {
      const currentOrder = await getOrderById(orderId);
      setOrder(currentOrder);
      try {
        window.sessionStorage.setItem("lastCreatedOrder", JSON.stringify(currentOrder));
      } catch {
        // The API response is sufficient to continue if browser storage is unavailable.
      }
      if (currentOrder.status === "PAYMENT_FAILED") {
        idempotencyKey.current = null;
      }
    } catch (cause) {
      setOrderError(cause instanceof Error ? cause.message : "Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOrder(), 0);
    return () => window.clearTimeout(timer);
  }, [loadOrder, loadAttempt]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  const isExpired = timeLeft !== null && timeLeft <= 0;
  const canPay =
    order?.status === "PENDING" || order?.status === "PAYMENT_FAILED";
  const hasPendingPayment = order?.payments?.some(
    (payment) => payment.status === "PENDING",
  ) ?? false;

  async function submitPayment() {
    if (submissionLock.current || !order || !canPay || isExpired) return;

    submissionLock.current = true;
    setProcessing(true);
    setError(null);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const payment = await createVnpayPayment({
        orderId: order.id,
        idempotencyKey: idempotencyKey.current,
        paymentChannel,
      });
      window.location.assign(payment.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể khởi tạo thanh toán VNPay.");
      setProcessing(false);
      submissionLock.current = false;
    }
  }

  async function cancelPendingOrder() {
    if (!order || cancelling) return;
    setCancelling(true);
    setError(null);
    try {
      const cancelled = await cancelOrder(order.id);
      setOrder(cancelled);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể hủy đơn hàng.");
    } finally {
      setCancelling(false);
    }
  }

  if (!hydrated || loading) {
    return (
      <main className="page-shell">
        <p className="state-message" role="status">Đang tải trạng thái đơn hàng từ hệ thống...</p>
      </main>
    );
  }

  if (orderError || !order) {
    return (
      <main className="page-shell">
        <section className="state-panel" role="alert">
          <p className="eyebrow">Chưa tải được thông tin đơn</p>
          <h1>Chưa thể tiếp tục thanh toán.</h1>
          <p>{orderError ?? "Không nhận được đơn hàng từ backend."}</p>
          <div className="checkout-actions">
            <button className="button button--dark" onClick={() => setLoadAttempt((count) => count + 1)} type="button">
              Thử tải lại
            </button>
            <Link className="button" href="/cart">Quay lại giỏ hàng</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell checkout-page">
      <Link className="back-link" href="/cart">← Giỏ hàng</Link>
      <header className="checkout-heading">
        <p className="eyebrow">BrewLite · VNPay Sandbox</p>
        <h1>Hoàn tất thanh toán</h1>
        <p>
          Bạn sẽ được chuyển đến cổng VNPay để chọn phương thức khả dụng như thẻ/ngân hàng hoặc VNPay QR.
          BrewLite chỉ xác nhận thanh toán sau khi backend xác minh IPN đã ký.
        </p>
      </header>

      <div className="checkout-layout">
        <section className="checkout-options">
          <div className="checkout-order-state">
            <span>Mã đơn</span>
            <strong>{getDisplayText(order.orderCode, "Chưa xác định")}</strong>
            <span>Trạng thái đơn</span>
            <strong>{getOrderStatusLabel(order.status)}</strong>
            <span>Trạng thái thanh toán</span>
            <strong>{getPaymentStatusLabel(order)}</strong>
            <span>Tổng thanh toán</span>
            <strong>{formatPrice(String(order.total))}</strong>
          </div>
          {timeLeft !== null && canPay && (
            <p className="state-message" role="status">
              Thời gian thanh toán còn {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </p>
          )}

          {error && <p className="payment-result payment-result--failure" role="alert">{error}</p>}

          {canPay ? (
            <>
              {hasPendingPayment && (
                <p className="state-message" role="status">
                  Đơn đang có yêu cầu VNPay chờ xử lý. Hãy tiếp tục giao dịch đó; không tạo thêm yêu cầu thanh toán.
                </p>
              )}
              <fieldset className="checkout-payment-methods">
                <legend>Chọn cách thanh toán qua VNPay</legend>
                {([
                  ["VNBANK", "Thẻ ATM / tài khoản ngân hàng nội địa"],
                  ["INTCARD", "Thẻ thanh toán quốc tế"],
                  ["VNPAYQR", "VNPay QR"],
                ] as const).map(([channel, label]) => (
                  <label key={channel}>
                    <input
                      checked={paymentChannel === channel}
                      disabled={processing || cancelling || isExpired || hasPendingPayment}
                      name="paymentChannel"
                      onChange={() => {
                        setPaymentChannel(channel);
                        idempotencyKey.current = null;
                      }}
                      type="radio"
                      value={channel}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <div className="checkout-payment-actions">
                <button
                  className="button button--accent checkout-submit"
                  disabled={processing || cancelling || isExpired}
                  onClick={submitPayment}
                  type="button"
                >
                  {processing
                    ? "Đang kết nối VNPay..."
                    : isExpired
                      ? "Đơn đã hết hạn"
                      : "Tiếp tục thanh toán"}
                </button>
                <button
                  className="text-button"
                  disabled={processing || cancelling}
                  onClick={cancelPendingOrder}
                  type="button"
                >
                  {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
                </button>
              </div>
            </>
          ) : (
            <p className="payment-result" role="status">
              {orderStatusDescription(order.status)}
            </p>
          )}
          {isExpired && (
            <p className="payment-result payment-result--failure" role="status">
              Đơn đã hết thời hạn thanh toán. Hãy tải lại trạng thái trước khi thử lại.
            </p>
          )}
        </section>

        <aside className="checkout-summary">
          <p className="eyebrow">Chi tiết đơn hàng</p>
          {order.items.map((item) => (
            <div className="checkout-summary__line" key={item.id}>
              <div>
                <span>{item.quantity} × {getDisplayText(item.productName, "Món")}</span>
                <small>
                  Size {getDisplayText(item.sizeCode, "Chưa xác định")}
                  {item.sugarPercent != null ? ` · Đường ${item.sugarPercent}%` : ""}
                  {item.icePercent != null ? ` · Đá ${item.icePercent}%` : ""}
                  {item.toppings.length > 0
                    ? ` · ${item.toppings.map((topping) => topping.name).filter(Boolean).join(", ")}`
                    : ""}
                </small>
              </div>
              <strong>{formatPrice(String(item.lineTotal))}</strong>
            </div>
          ))}
          <div className="checkout-summary__total">
            <span>Tổng cộng</span>
            <strong>{formatPrice(String(order.total))}</strong>
          </div>
          <p>Giỏ hàng vẫn được giữ cho đến khi backend xác nhận thanh toán thành công.</p>
        </aside>
      </div>
    </main>
  );
}

function orderStatusDescription(status: string): string {
  if (status === "PAID") return "Backend đã xác nhận khoản thanh toán.";
  if (status === "PAYMENT_FAILED") return "Giao dịch thất bại. Bạn có thể thử thanh toán lại từ trang này.";
  if (status === "CANCELLED") return "Đơn hàng đã bị hủy.";
  return "Trạng thái thanh toán đang chờ backend xác nhận.";
}
