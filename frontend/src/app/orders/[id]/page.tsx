"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth";
import { formatPrice } from "../../../lib/money";
import { cancelOrder, getOrderById, type CreatedOrderResponse } from "../../../lib/orders-api";

export default function OrderDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#30251D]">
          <div className="max-w-4xl mx-auto bg-white border border-[#DED6CB] rounded-2xl p-12 text-center shadow-xs">
            <p className="text-sm text-[#6F6258] animate-pulse">Đang tải chi tiết đơn hàng...</p>
          </div>
        </main>
      }
    >
      <OrderDetailsContent />
    </Suspense>
  );
}

function OrderDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<CreatedOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!order || !window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Không thể hủy đơn hàng.");
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);

    getOrderById(id)
      .then((data) => {
        if (!active) return;
        setOrder(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không tìm thấy thông tin đơn hàng.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#30251D]">
        <div className="max-w-md mx-auto bg-white border border-[#DED6CB] rounded-2xl p-8 sm:p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#30251D] mb-3 font-heading">
            Đăng nhập để xem đơn hàng
          </h1>
          <p className="text-sm text-[#6F6258] mb-6">
            Vui lòng đăng nhập để xem thông tin chi tiết đơn hàng này.
          </p>
          <Link
            className="inline-flex items-center justify-center bg-[#38291E] hover:bg-[#241A13] !text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors w-full shadow-xs"
            href="/login"
            style={{ color: "#ffffff" }}
          >
            <span className="text-white font-semibold">Đăng nhập ngay</span>
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#30251D]">
        <div className="max-w-4xl mx-auto bg-white border border-[#DED6CB] rounded-2xl p-12 text-center shadow-sm">
          <p className="text-sm text-[#6F6258] animate-pulse">Đang tải chi tiết đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#30251D]">
        <div className="max-w-md mx-auto bg-white border border-[#DED6CB] rounded-2xl p-8 sm:p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#30251D] mb-3 font-heading">Không tìm thấy đơn hàng</h1>
          <p className="text-sm text-[#6F6258] mb-6">{error ?? "Đơn hàng không tồn tại hoặc đã hết hạn."}</p>
          <Link
            className="inline-flex items-center justify-center bg-[#38291E] hover:bg-[#241A13] !text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-xs"
            href="/orders"
            style={{ color: "#ffffff" }}
          >
            <span className="text-white font-semibold">Quay lại danh sách đơn hàng</span>
          </Link>
        </div>
      </main>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Chờ thanh toán
          </span>
        );
      case "PAYMENT_FAILED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            Thanh toán lỗi
          </span>
        );
      case "PAID":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Đã thanh toán
          </span>
        );
      case "PREPARING":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            Đang chuẩn bị
          </span>
        );
      case "READY":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            Đã sẵn sàng
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            Hoàn thành
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            {status}
          </span>
        );
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const isPayable = order.status === "PENDING" || order.status === "PAYMENT_FAILED";
  const latestPayment = order.payments && order.payments.length > 0 ? order.payments[0] : null;

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[#30251D]">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#76513B] hover:text-[#30251D] mb-6 transition-colors"
          href="/orders"
        >
          ← Quay lại danh sách đơn hàng
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#76513B] mb-1">
                Chi tiết đơn hàng
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#30251D] font-heading">
                #{order.orderCode}
              </h1>
              <p className="text-xs text-[#8C7E73] mt-1">
                Đặt lúc: {formatDate(order.createdAt)}
              </p>
            </div>
            <div>{getStatusBadge(order.status)}</div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Cột trái: Danh sách sản phẩm & Tổng kết */}
          <div className="flex flex-col gap-6">
            {/* Card Danh sách sản phẩm */}
            <section className="bg-white border border-[#DED6CB] rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-[#30251D] pb-3 mb-4 border-b border-[#F0EAE1] font-heading">
                Món đã chọn ({order.items.reduce((sum, item) => sum + item.quantity, 0)})
              </h2>

              <div className="flex flex-col divide-y divide-dashed divide-[#EDE6DC]">
                {order.items.map((item) => (
                  <div className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4" key={item.id}>
                    <div className="flex-1">
                      <span className="font-semibold text-[#30251D] text-sm sm:text-base">
                        {item.quantity} × {item.productName}
                      </span>
                      <div className="text-xs text-[#8C7E73] mt-1 flex flex-col gap-0.5">
                        <span>
                          Size {item.sizeCode} · Đơn giá: {formatPrice(String(item.unitPrice))}
                        </span>
                        {(item.sugarPercent !== undefined || item.icePercent !== undefined) && (
                          <span>
                            {item.sugarPercent !== undefined ? `Đường ${item.sugarPercent}%` : ""}
                            {item.sugarPercent !== undefined && item.icePercent !== undefined ? " · " : ""}
                            {item.icePercent !== undefined ? `Đá ${item.icePercent}%` : ""}
                          </span>
                        )}
                        {item.toppings?.length ? (
                          <span>
                            Topping: {item.toppings.map((t) => `${t.name} (x${t.quantity})`).join(", ")}
                          </span>
                        ) : null}
                        {item.note && <span className="italic">Ghi chú: {item.note}</span>}
                      </div>
                    </div>
                    <span className="font-semibold text-[#38291E] text-sm sm:text-base whitespace-nowrap">
                      {formatPrice(String(item.lineTotal))}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Card Tổng kết chi phí */}
            <section className="bg-white border border-[#DED6CB] rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-[#30251D] pb-3 mb-4 border-b border-[#F0EAE1] font-heading">
                Tổng kết đơn hàng
              </h2>
              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between text-[#6F6258]">
                  <span>Tạm tính</span>
                  <span>{formatPrice(String(order.subtotal))}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(String(order.discountAmount))}</span>
                  </div>
                )}
                <div className="pt-3 mt-1 border-t border-[#EDE6DC] flex justify-between items-baseline">
                  <span className="text-base font-bold text-[#30251D]">Tổng thanh toán</span>
                  <span className="text-xl font-bold text-[#38291E]">{formatPrice(String(order.total))}</span>
                </div>
              </div>
            </section>

            {/* Lịch sử trạng thái */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <section className="bg-white border border-[#DED6CB] rounded-2xl p-5 sm:p-6 shadow-sm">
                <h2 className="text-base sm:text-lg font-bold text-[#30251D] pb-3 mb-4 border-b border-[#F0EAE1] font-heading">
                  Lịch sử đơn hàng
                </h2>
                <div className="flex flex-col gap-3">
                  {order.statusHistory.map((h) => (
                    <div className="flex items-start gap-3 text-xs sm:text-sm" key={h.id}>
                      <div className="w-2 h-2 rounded-full bg-[#76513B] mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#30251D]">Trạng thái: {h.newStatus}</span>
                          <span className="text-[#8C7E73]">{formatDate(h.changedAt)}</span>
                        </div>
                        {h.note && <p className="text-[#6F6258] mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Cột phải: Thông tin thanh toán & Hành động */}
          <aside className="flex flex-col gap-6">
            <div className="bg-white border border-[#DED6CB] rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-[#30251D] pb-3 mb-4 border-b border-[#F0EAE1] font-heading">
                Thông tin thanh toán
              </h2>

              <div className="flex flex-col gap-3.5 text-xs sm:text-sm">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#8C7E73] block mb-0.5">
                    Mã đơn hàng
                  </span>
                  <span className="font-semibold text-[#30251D] font-mono">{order.orderCode}</span>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider text-[#8C7E73] block mb-0.5">
                    Trạng thái đơn
                  </span>
                  <span className="font-semibold text-[#30251D]">
                    {order.status === "PENDING"
                      ? "Chờ thanh toán"
                      : order.status === "PAYMENT_FAILED"
                      ? "Thanh toán lỗi"
                      : order.status === "PAID"
                      ? "Đã thanh toán"
                      : order.status === "PREPARING"
                      ? "Đang chuẩn bị món"
                      : order.status === "READY"
                      ? "Đã sẵn sàng"
                      : order.status === "COMPLETED"
                      ? "Hoàn thành"
                      : "Đã hủy"}
                  </span>
                </div>

                {latestPayment && (
                  <>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#8C7E73] block mb-0.5">
                        Phương thức thanh toán
                      </span>
                      <span className="font-semibold text-[#30251D]">
                        {latestPayment.method === "BANK_CARD"
                          ? "Thẻ ngân hàng (Mô phỏng)"
                          : latestPayment.method === "E_WALLET"
                          ? "Ví điện tử (Mô phỏng)"
                          : latestPayment.method}
                      </span>
                    </div>

                    {latestPayment.transactionCode && (
                      <div>
                        <span className="text-xs uppercase tracking-wider text-[#8C7E73] block mb-0.5">
                          Mã giao dịch
                        </span>
                        <span className="font-mono text-xs text-[#6F6258] break-all">
                          {latestPayment.transactionCode}
                        </span>
                      </div>
                    )}

                    {latestPayment.paidAt && (
                      <div>
                        <span className="text-xs uppercase tracking-wider text-[#8C7E73] block mb-0.5">
                          Thời gian thanh toán
                        </span>
                        <span className="text-[#30251D]">{formatDate(latestPayment.paidAt)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Nếu đơn đang PENDING hoặc PAYMENT_FAILED, hiển thị nút thanh toán ngay */}
              {isPayable && (
                <div className="mt-6 pt-5 border-t border-[#F0EAE1] flex flex-col gap-2.5">
                  <p
                    className={`text-xs ${
                      order.status === "PAYMENT_FAILED" ? "text-rose-700" : "text-amber-800"
                    }`}
                  >
                    {order.status === "PAYMENT_FAILED"
                      ? "Lần thanh toán trước thất bại. Bạn có thể thử lại ngay bây giờ hoặc hủy đơn."
                      : "Đơn hàng đang chờ thanh toán. Đơn sẽ tự hủy nếu quá hạn 2 phút."}
                  </p>
                  <Link
                    className="inline-flex items-center justify-center bg-[#38291E] hover:bg-[#241A13] !text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors w-full text-center shadow-xs"
                    href={`/checkout?orderId=${order.id}`}
                    style={{ color: "#ffffff" }}
                  >
                    <span className="text-white font-semibold">
                      {order.status === "PAYMENT_FAILED"
                        ? "Thử lại thanh toán ngay"
                        : "Tiếp tục thanh toán ngay"}
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors w-full cursor-pointer"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
                  </button>
                </div>
              )}

              {/* Nếu đơn đã CANCELLED, hiển thị thông báo và nút khám phá thực đơn */}
              {order.status === "CANCELLED" && (
                <div className="mt-6 pt-5 border-t border-[#F0EAE1]">
                  <p className="text-xs text-stone-500 mb-3">Đơn hàng này đã bị hủy.</p>
                  <Link
                    className="inline-flex items-center justify-center bg-[#38291E] hover:bg-[#241A13] !text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors w-full text-center shadow-xs"
                    href="/menu"
                    style={{ color: "#ffffff" }}
                  >
                    <span className="text-white font-semibold">Khám phá thực đơn mới</span>
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
