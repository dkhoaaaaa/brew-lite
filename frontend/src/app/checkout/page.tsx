"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Toast } from "../../components/Toast";
import { useCart } from "../../features/cart/cart-store";
import { useAuth } from "../../lib/auth";
import { getMyVouchers, type UserVoucher } from "../../lib/loyalty-api";
import { formatPrice } from "../../lib/money";
import {
  applyVoucherToOrder,
  createVnpayPayment,
  getOrderById,
  removeVoucherFromOrder,
  type CreatedOrderResponse,
} from "../../lib/orders-api";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { isAuthenticated } = useAuth();
  const { hydrated } = useCart();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; message?: string } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderResponse | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSnapshotLoaded, setOrderSnapshotLoaded] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
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
      setToast({ title: "Áp dụng thành công", message: `Đã áp dụng mã giảm giá ${code}` });
    } catch (err: unknown) {
      setVoucherError(
        err instanceof Error ? err.message : "Không thể áp dụng mã này.",
      );
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
      setSelectedVoucherCode("");
      setToast({ title: "Đã hủy áp dụng", message: "Đã xóa mã giảm giá khỏi đơn hàng." });
    } catch (err: unknown) {
      setVoucherError(
        err instanceof Error ? err.message : "Không thể hủy mã này.",
      );
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
    if (!orderId) return;

    getOrderById(orderId)
      .then((order) => {
        if (!active) return;
        if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
          setOrderError(`Đơn hàng #${order.orderCode} đã ở trạng thái ${order.status}, không thể thanh toán tiếp.`);
        } else {
          setCreatedOrder(order);
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

  // Use the server-issued expiry timestamp; the timeout remains owned by the backend.
  useEffect(() => {
    const expiresAt = createdOrder?.expiresAt;
    const status = createdOrder?.status;
    if (
      !expiresAt ||
      (status !== "PENDING" && status !== "PAYMENT_FAILED")
    ) {
      return;
    }

    const interval = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [createdOrder?.expiresAt, createdOrder?.status]);

  const timeLeft =
    createdOrder?.expiresAt &&
    (createdOrder.status === "PENDING" || createdOrder.status === "PAYMENT_FAILED")
      ? Math.max(
          0,
          Math.floor((new Date(createdOrder.expiresAt).getTime() - clockNow) / 1000),
        )
      : null;

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  async function submitVnpayPayment() {
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
    submissionLock.current = true;
    setProcessing(true);
    setError(null);

    try {
      const payment = await createVnpayPayment(createdOrder.id, crypto.randomUUID());
      window.location.assign(payment.paymentUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : "Không thể khởi tạo thanh toán VNPay. Vui lòng thử lại.";
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

  if (!orderId) {
    return (
      <main className="page-shell">
        <section className="state-panel">
          <h1>Chưa có đơn hàng để thanh toán.</h1>
          <p>Hãy tạo đơn từ giỏ hàng trước khi tiếp tục.</p>
          <Link className="button button--dark" href="/cart">Quay lại giỏ hàng</Link>
        </section>
      </main>
    );
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
        <p className="eyebrow">BrewLite · checkout</p>
        <h1>Thanh toán đơn hàng</h1>
        <p>Bạn sẽ được chuyển đến VNPay Sandbox. Trạng thái đơn chỉ được cập nhật sau khi backend xác minh IPN.</p>
        
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
            <span>Thời gian thanh toán còn lại:</span>
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
            <legend>Cổng thanh toán</legend>
            <div className="payment-methods">
              <label className="payment-method">
                <input checked disabled name="payment-method" type="radio" />
                <span><strong>VNPay Sandbox</strong><small>Ngân hàng, thẻ hoặc QR được chọn trên VNPay</small></span>
              </label>
            </div>
          </fieldset>

          <button
            className="button button--accent checkout-submit"
            disabled={
              processing ||
              (createdOrder.status !== "PENDING" && createdOrder.status !== "PAYMENT_FAILED") ||
              isExpired
            }
            onClick={submitVnpayPayment}
            type="button"
          >
            {processing ? "Đang chuyển đến VNPay..." : isExpired ? "Đơn đã hết hạn" : "Thanh toán qua VNPay"}
          </button>
          {error && <p className="payment-result payment-result--failure" role="alert">{error}</p>}
          {createdOrder.status === "PAYMENT_FAILED" && (
            <section
              aria-live="polite"
              className="payment-result payment-result--failure"
              role="status"
            >
              <strong>Lần thanh toán trước không thành công.</strong>
              <p>Trạng thái do backend xác nhận. Bạn có thể thử lại trước khi đơn hết hạn.</p>
            </section>
          )}
          {createdOrder.status !== "PENDING" && createdOrder.status !== "PAYMENT_FAILED" && (
            <p className="payment-result payment-result--failure" role="status">
              Đơn hàng không ở trạng thái có thể thanh toán.
            </p>
          )}
        </section>

        <aside className="checkout-summary bg-white p-6 rounded-2xl border border-[#DED6CB] shadow-xs">
          <p className="eyebrow text-xs font-bold uppercase tracking-wider text-[#76513B] mb-3">Tóm tắt đơn hàng</p>
          <div className="space-y-2 mb-4">
            {createdOrder.items.map((item) => (
              <div className="flex justify-between items-start text-xs sm:text-sm text-[#30251D]" key={item.id}>
                <span>
                  {item.quantity} × {item.productName} (Size {item.sizeCode})
                  <small className="block text-[#8C7E73]">
                    Đường {item.sugarPercent ?? 100}% · Đá {item.icePercent ?? 100}%
                  </small>
                </span>
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
            <span className="font-semibold text-[#5C4738]">
              Bạn sẽ nhận được <strong>+100 điểm thành viên</strong> khi thanh toán thành công!
            </span>
          </div>

          <p className="mt-4 text-[11px] text-[#8C7E73] leading-relaxed">Đơn hàng được lưu trên hệ thống và tự hết hạn theo thời gian còn lại hiển thị ở trên.</p>
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
