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
  applyVoucherToOrder,
  executeMockPayment,
  getOrderById,
  removeVoucherFromOrder,
  type CreatedOrderResponse,
} from "../../lib/orders-api";
import { getMyVouchers, type UserVoucher } from "../../lib/loyalty-api";
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
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState<string>("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      getMyVouchers()
        .then((list) => setUserVouchers(list.filter((v) => v.canApply)))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleApplyVoucher = async (codeToApply?: string) => {
    const code = (codeToApply || selectedVoucherCode).trim();
    if (!code || !createdOrder) return;
    setApplyingVoucher(true);
    setVoucherError(null);
    try {
      const updated = await applyVoucherToOrder(createdOrder.id, code);
      setCreatedOrder(updated);
      window.sessionStorage.setItem("lastCreatedOrder", JSON.stringify(updated));
      setToast({ title: "Áp dụng thành công", message: `Đã áp dụng mã giảm giá ${code}` });
    } catch (err: any) {
      setVoucherError(err.message || "Không thể áp dụng mã này.");
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = async () => {
    if (!createdOrder) return;
    setApplyingVoucher(true);
    setVoucherError(null);
    try {
      const updated = await removeVoucherFromOrder(createdOrder.id);
      setCreatedOrder(updated);
      window.sessionStorage.setItem("lastCreatedOrder", JSON.stringify(updated));
      setSelectedVoucherCode("");
      setToast({ title: "Đã hủy áp dụng", message: "Đã xóa mã giảm giá khỏi đơn hàng." });
    } catch (err: any) {
      setVoucherError(err.message || "Không thể hủy mã này.");
    } finally {
      setApplyingVoucher(false);
    }
  };

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
        <h1>Hoàn tất thanh toán</h1>
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
            <legend>Kết quả mô phỏng</legend>
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
              <strong>Kết quả mô phỏng: thất bại</strong>
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

        <aside className="checkout-summary bg-white p-6 rounded-2xl border border-[#DED6CB] shadow-xs">
          <p className="eyebrow text-xs font-bold uppercase tracking-wider text-[#76513B] mb-3">Tóm tắt đơn hàng</p>
          <div className="space-y-2 mb-4">
            {createdOrder.items.map((item) => (
              <div className="flex justify-between items-start text-xs sm:text-sm text-[#30251D]" key={item.id}>
                <span>{item.quantity} × {item.productName} (Size {item.sizeCode})</span>
                <strong className="whitespace-nowrap">{formatPrice(String(item.lineTotal))}</strong>
              </div>
            ))}
          </div>

          {/* KHỐI MÃ KHUYẾN MẠI */}
          <div className="my-4 pt-4 border-t border-[#EDE6DC]">
            <p className="text-xs font-bold uppercase tracking-wider text-[#76513B] mb-2">Mã khuyến mại</p>
            {createdOrder.promotionId ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-emerald-800 block">Đã áp dụng mã giảm giá</span>
                  <span className="text-emerald-700 font-semibold">Giảm -{formatPrice(String(createdOrder.discountAmount))}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  disabled={processing || applyingVoucher}
                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold cursor-pointer transition"
                >
                  Hủy
                </button>
              </div>
            ) : userVouchers.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedVoucherCode}
                  onChange={(e) => {
                    setSelectedVoucherCode(e.target.value);
                    if (e.target.value) handleApplyVoucher(e.target.value);
                  }}
                  disabled={processing || applyingVoucher}
                  className="w-full text-xs p-2.5 bg-[#FAF7F2] border border-[#DED6CB] rounded-xl font-medium text-[#30251D] cursor-pointer"
                >
                  <option value="">-- Chọn mã khuyến mại của bạn --</option>
                  {userVouchers.map((v) => (
                    <option key={v.id} value={v.code}>
                      {v.code} - Giảm {formatPrice(String(v.discountValue))}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã voucher..."
                    value={selectedVoucherCode}
                    onChange={(e) => setSelectedVoucherCode(e.target.value.toUpperCase())}
                    disabled={processing || applyingVoucher}
                    className="flex-1 text-xs px-3 py-2 bg-white border border-[#DED6CB] rounded-xl uppercase font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyVoucher()}
                    disabled={!selectedVoucherCode || processing || applyingVoucher}
                    className="px-3.5 py-2 bg-[#38291E] hover:bg-[#241A13] text-white text-xs font-bold rounded-xl transition disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    {applyingVoucher ? "..." : "Áp dụng"}
                  </button>
                </div>
                {voucherError && <p className="text-xs text-rose-600 mt-1">{voucherError}</p>}
              </div>
            ) : (
              <div className="p-3 bg-[#FAF7F2] border border-[#EDE6DC] rounded-xl text-xs text-[#76513B] leading-relaxed">
                <p>Bạn chưa có mã khuyến mại. Hãy tích điểm để đổi voucher tại mục <Link href="/profile" className="font-bold underline text-[#38291E]">Điểm thành viên</Link>.</p>
              </div>
            )}
          </div>

          {/* Phân rã tính tiền */}
          <div className="space-y-2 pt-4 border-t border-[#EDE6DC] text-xs sm:text-sm">
            <div className="flex justify-between text-[#6F6258]">
              <span>Tạm tính</span>
              <span>{formatPrice(String(createdOrder.subtotal))}</span>
            </div>
            {createdOrder.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Mã khuyến mại</span>
                <span>-{formatPrice(String(createdOrder.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base sm:text-lg text-[#38291E] pt-2 border-t border-[#EDE6DC]">
              <span>Tổng thanh toán</span>
              <span>{formatPrice(String(createdOrder.total))}</span>
            </div>
          </div>

          {/* THÔNG BÁO TÍCH ĐIỂM BẮT BUỘC */}
          <div className="mt-4 p-3 bg-[#FAF7F2] border border-[#E7DECE] rounded-xl flex items-center gap-2.5 text-xs text-[#76513B] shadow-2xs">
            <span className="text-base shrink-0">🪙</span>
            <span className="font-semibold text-[#5C4738]">
              Bạn sẽ nhận được <strong>+100 điểm thành viên</strong> khi thanh toán thành công!
            </span>
          </div>

          <p className="mt-4 text-[11px] text-[#8C7E73] leading-relaxed">Đơn hàng được lưu trên hệ thống. Sau 2 phút nếu không hoàn tất thanh toán, đơn sẽ tự động bị hủy.</p>
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
