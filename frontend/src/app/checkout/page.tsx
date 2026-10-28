"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toast } from "../../components/Toast";
import { useCart } from "../../features/cart/cart-store";
import { useAuth } from "../../lib/auth";
import {
  isMockPaymentMethod,
  type MockPaymentMethod,
  type MockPaymentOutcome,
  type MockPaymentResult,
} from "../../features/payment/mock-payment";
import {
  executeMockPayment,
  getOrderById,
  type CreatedOrderResponse,
} from "../../lib/orders-api";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { isAuthenticated } = useAuth();
  const { hydrated } = useCart();
  const [method, setMethod] = useState<MockPaymentMethod | null>(null);
  const [outcome, setOutcome] = useState<MockPaymentOutcome>("success");
  const [result, setResult] = useState<MockPaymentResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; message?: string } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderResponse | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSnapshotLoaded, setOrderSnapshotLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const submissionLock = useRef(false);

  // Nếu chưa đăng nhập, tự động chuyển về trang đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = orderId
        ? `/checkout?orderId=${encodeURIComponent(orderId)}`
        : "/cart";
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [isAuthenticated, orderId, router]);

  useEffect(() => {
    let active = true;
    if (!orderId) {
      setOrderError("Không có mã đơn được backend xác nhận trong phiên này.");
      setOrderSnapshotLoaded(true);
      return;
    }

    // 1. Thử đọc từ sessionStorage
    try {
      const stored = window.sessionStorage.getItem("lastCreatedOrder");
      const parsed: unknown = stored ? JSON.parse(stored) : null;
      if (isCreatedOrderResponse(parsed) && parsed.id === orderId) {
        if (parsed.status !== "PENDING" && parsed.status !== "PAYMENT_FAILED") {
          setOrderError(`Đơn hàng này đang ở trạng thái ${parsed.status}, không thể tiếp tục thanh toán.`);
        } else {
          setCreatedOrder(parsed);
        }
        setOrderSnapshotLoaded(true);
        return;
      }
    } catch {
      // Bỏ qua lỗi session và fallback qua gọi API
    }

    // 2. Nếu không có trong sessionStorage (người dùng thoát trang rồi vào lại), gọi API lấy từ Backend!
    getOrderById(orderId)
      .then((order) => {
        if (!active) return;
        if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
          setOrderError(`Đơn hàng #${order.orderCode} đã ở trạng thái ${order.status}, không thể thanh toán tiếp.`);
        } else {
          setCreatedOrder(order);
          window.sessionStorage.setItem("lastCreatedOrder", JSON.stringify(order));
        }
        setOrderSnapshotLoaded(true);
      })
      .catch((err) => {
        if (!active) return;
        setOrderError(err instanceof Error ? err.message : "Không tìm thấy thông tin đơn hàng hoặc đơn đã hết hạn.");
        setOrderSnapshotLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  // Bộ đếm ngược thời gian thanh toán (2 phút)
  useEffect(() => {
    if (
      !createdOrder?.expiresAt ||
      (createdOrder.status !== "PENDING" && createdOrder.status !== "PAYMENT_FAILED")
    ) {
      setTimeLeft(null);
      return;
    }

    const expiresAtMs = new Date(createdOrder.expiresAt).getTime();

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setOrderError("Đơn hàng đã hết hạn thanh toán (quá 2 phút) và đã bị hủy. Vui lòng tạo đơn mới.");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdOrder]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  async function submitMockPayment() {
    if (
      submissionLock.current ||
      !createdOrder ||
      (createdOrder.status !== "PENDING" && createdOrder.status !== "PAYMENT_FAILED")
    ) {
      return;
    }
    if (timeLeft !== null && timeLeft <= 0) {
      setError("Đơn hàng đã hết hạn thanh toán.");
      return;
    }
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
      const paymentResult = await executeMockPayment(createdOrder.id, {
        method,
        outcome,
      });

      if (paymentResult.outcome === "SIMULATED_SUCCESS") {
        const mockPaymentRecord = {
          method,
          outcome: paymentResult.outcome,
          timestamp: new Date().toISOString(),
        };
        try {
          window.sessionStorage.setItem("lastMockPaymentResult", JSON.stringify(mockPaymentRecord));
          window.sessionStorage.setItem(
            "lastCreatedOrder",
            JSON.stringify({ ...createdOrder, status: "PAID" }),
          );
        } catch {
          // Bỏ qua nếu lỗi lưu session
        }

        router.push(`/checkout/confirmation?orderId=${encodeURIComponent(createdOrder.id)}`);
      } else {
        const updatedFailedOrder = { ...createdOrder, status: "PAYMENT_FAILED" };
        setCreatedOrder(updatedFailedOrder);
        try {
          window.sessionStorage.setItem("lastCreatedOrder", JSON.stringify(updatedFailedOrder));
        } catch {
          // Ignore
        }

        setToast({
          title: "Thanh toán không thành công",
          message: paymentResult.message || "Giao dịch mô phỏng thất bại. Vui lòng thử thanh toán lại hoặc chọn phương thức khác.",
        });
        setResult({
          outcome: "SIMULATED_FAILURE",
          message: paymentResult.message,
        });
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Không thể chạy mô phỏng lúc này. Vui lòng thử lại.";
      setError(msg);
      setToast({
        title: "Có lỗi xảy ra",
        message: msg,
      });
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
          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <Link className="button button--dark" href="/cart">Quay lại giỏ hàng</Link>
            <Link className="button" style={{ border: "1px solid #DED6CB", background: "white" }} href="/orders">Xem đơn hàng của tôi</Link>
          </div>
        </section>
      </main>
    );
  }

  const isExpired = timeLeft !== null && timeLeft <= 0;

  return (
    <main className="page-shell checkout-page">
      <Link className="back-link" href="/cart">Quay lại giỏ hàng</Link>
      <header className="checkout-heading">
        <p className="eyebrow">BrewLite · checkout thử nghiệm</p>
        <h1>Thanh toán thành công</h1>
        <p>Đây là luồng thanh toán mô phỏng kết nối database thật. Đơn hàng sẽ chuyển sang trạng thái PAID khi hoàn tất.</p>
        
        {timeLeft !== null && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
              padding: "6px 14px",
              borderRadius: "6px",
              backgroundColor: isExpired ? "#FDE8E8" : "#F5EFE6",
              border: `1px solid ${isExpired ? "#F8B4B4" : "#DED6CB"}`,
              fontSize: "13.5px",
              fontWeight: 600,
              color: isExpired ? "#9B1C1C" : "#5C4738",
            }}
          >
            <span>Thời gian giữ đơn còn lại:</span>
            <strong style={{ fontFamily: "monospace", fontSize: "15px" }}>
              {formatCountdown(timeLeft)}
            </strong>
          </div>
        )}
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
                  disabled={isExpired || processing}
                  name="payment-method"
                  onChange={() => {
                    setMethod("E_WALLET");
                    setError(null);
                    setResult(null);
                  }}
                  type="radio"
                />
                <span><strong>Ví điện tử</strong><small>Chỉ mô phỏng</small></span>
              </label>
              <label className="payment-method">
                <input
                  checked={method === "BANK_CARD"}
                  disabled={isExpired || processing}
                  name="payment-method"
                  onChange={() => {
                    setMethod("BANK_CARD");
                    setError(null);
                    setResult(null);
                  }}
                  type="radio"
                />
                <span><strong>Thẻ ngân hàng</strong><small>Không nhập số thẻ</small></span>
              </label>
            </div>
          </fieldset>

          <fieldset className="option-group">
            <legend> Kết quả mô phỏng</legend>
            <div aria-label="Kết quả thanh toán giả lập" className="outcome-toggle" role="group">
              <button
                aria-pressed={outcome === "success"}
                className={outcome === "success" ? "is-selected" : ""}
                disabled={isExpired || processing}
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
                disabled={isExpired || processing}
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
            disabled={
              processing ||
              !method ||
              (createdOrder.status !== "PENDING" && createdOrder.status !== "PAYMENT_FAILED") ||
              isExpired
            }
            onClick={submitMockPayment}
            type="button"
          >
            {processing ? "Đang xử lý..." : isExpired ? "Đơn đã hết hạn" : result?.outcome === "SIMULATED_FAILURE" || createdOrder.status === "PAYMENT_FAILED" ? "Thử lại mô phỏng" : "Chạy Mock Payment"}
          </button>
          {error && <p className="payment-result payment-result--failure" role="alert">{error}</p>}
          {(result?.outcome === "SIMULATED_FAILURE" || createdOrder.status === "PAYMENT_FAILED") && (
            <section
              aria-live="polite"
              className="payment-result payment-result--failure"
              role="status"
            >
              <strong> Kết quả mô phỏng: thất bại</strong>
              <p>{result?.message || "Lần thanh toán trước không thành công."}</p>
              <small>Đơn hàng chuyển sang trạng thái PAYMENT_FAILED. Bạn có thể chọn lại phương thức và thử lại trước khi hết thời gian 2 phút.</small>
            </section>
          )}
          {createdOrder.status !== "PENDING" && createdOrder.status !== "PAYMENT_FAILED" && (
            <p className="payment-result payment-result--failure" role="status">
              Đơn hàng không ở trạng thái có thể chạy thanh toán.
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
          <p>Đơn hàng được lưu trên hệ thống. Sau 2 phút nếu không hoàn tất thanh toán, đơn sẽ tự động bị hủy.</p>
        </aside>
      </div>

      {toast && (
        <Toast
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}
