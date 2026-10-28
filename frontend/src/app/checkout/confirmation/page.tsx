"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "../../../lib/money";
import { getOrderById, type CreatedOrderResponse } from "../../../lib/orders-api";

interface StoredMockPayment {
  method: "E_WALLET" | "BANK_CARD";
  outcome: "SIMULATED_SUCCESS" | "SIMULATED_FAILURE";
  timestamp: string;
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-10 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm uppercase tracking-wider text-[#8C7E73]" role="status">
              Đang tải thông tin xác nhận đơn hàng...
            </p>
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
      <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm uppercase tracking-wider text-[#8C7E73]" role="status">
            Đang tải thông tin đơn hàng...
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-[#E5DFD7] rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#F5EFE6] text-[#76513B] flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-[#30251D] mb-2 font-heading">
            Không tìm thấy thông tin đơn hàng
          </h2>
          <p className="text-sm text-[#6F6258] mb-6">
            {error ?? "Phiên thanh toán đã kết thúc hoặc không tồn tại đơn hàng tương ứng."}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/orders"
              className="w-full py-3 px-4 rounded-lg bg-[#38291E] hover:bg-[#241A13] !text-white font-medium text-sm transition-colors text-center shadow-xs"
              style={{ color: "#ffffff" }}
            >
              <span className="text-white font-medium">Đơn hàng của tôi</span>
            </Link>
            <Link
              href="/menu"
              className="w-full py-3 px-4 rounded-lg bg-white border border-[#DED6CB] !text-[#38291E] hover:bg-[#F7F5F1] font-medium text-sm transition-colors text-center"
              style={{ color: "#38291E" }}
            >
              <span className="text-[#38291E] font-medium">Xem thực đơn</span>
            </Link>
          </div>
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
    <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-10 px-4 sm:px-6 lg:px-8 text-[#30251D]">
      <div className="max-w-4xl mx-auto">
        {/* Header với biểu tượng dấu tích thành công */}
        <header className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#EBF8F2] text-[#22543D] border border-[#9AE6B4] text-2xl font-bold mb-4 shadow-xs"
            aria-hidden="true"
          >
            ✓
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#30251D] mb-2 font-heading">
            Thanh toán thành công
          </h1>
          <p className="text-[#6B5E55] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Cảm ơn bạn đã lựa chọn BrewLite. Đơn hàng đã được xác nhận thanh toán mô phỏng và cập nhật vào hệ thống.
          </p>
        </header>

        {/* Thông báo tích 100 điểm thưởng thành công */}
        <div className="mb-6 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7DECE] flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-full bg-[#EAE1D2] text-[#76513B] flex items-center justify-center text-xl font-bold shrink-0">
            🪙
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#30251D]">+100 điểm thành viên</h3>
            <p className="text-xs text-[#76513B] mt-0.5">Bạn đã nhận được 100 điểm thưởng từ đơn hàng này.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Cột chính: Danh sách món & Tổng tiền */}
          <section className="bg-white rounded-2xl border border-[#E5DFD7] p-6 shadow-xs" aria-labelledby="order-items-heading">
            <h2 className="text-lg font-bold text-[#30251D] pb-3 mb-5 border-b border-[#F0EAE1] font-heading" id="order-items-heading">
              Danh sách món đã đặt
            </h2>

            <div className="divide-y divide-dashed divide-[#EDE6DC] mb-6">
              {order.items.map((item) => (
                <article className="py-4 first:pt-0 last:pb-0 flex justify-between items-start gap-4" key={item.id}>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[15px] text-[#30251D] mb-1">
                      {item.quantity} × {item.productName}
                    </h3>
                    <p className="text-xs text-[#7D6F64] mb-1">
                      Size: {item.sizeCode} · Đơn giá: {formatPrice(String(item.unitPrice))}
                    </p>
                    {(item.sugarPercent !== undefined || item.icePercent !== undefined) && (
                      <p className="text-xs text-[#94867A]">
                        {item.sugarPercent !== undefined ? `Đường ${item.sugarPercent}%` : ""}
                        {item.sugarPercent !== undefined && item.icePercent !== undefined ? " · " : ""}
                        {item.icePercent !== undefined ? `Đá ${item.icePercent}%` : ""}
                      </p>
                    )}
                    {Array.isArray(item.toppings) && item.toppings.length > 0 && (
                      <p className="text-xs text-[#94867A] mt-0.5">
                        Topping: {item.toppings.map((t) => `${t.name} (x${t.quantity})`).join(", ")}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs text-[#94867A] italic mt-0.5">
                        Ghi chú: {item.note}
                      </p>
                    )}
                  </div>
                  <div className="font-semibold text-[15px] text-[#38291E] whitespace-nowrap">
                    {formatPrice(String(item.lineTotal))}
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t border-[#E5DFD7] pt-4 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-[#6B5E55]">
                <span>Tạm tính</span>
                <span>{formatPrice(String(order.subtotal))}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(String(order.discountAmount))}</span>
                </div>
              )}
              <div className="border-t border-[#E5DFD7] pt-3.5 mt-1 flex justify-between items-baseline text-lg font-bold text-[#30251D]">
                <span>Tổng thanh toán</span>
                <span className="text-[#38291E] text-xl">{formatPrice(String(order.total))}</span>
              </div>
            </div>
          </section>

          {/* Cột phải: Thông tin giao dịch & nút hành động */}
          <aside className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-[#E5DFD7] p-6 shadow-xs">
              <h2 className="text-lg font-bold text-[#30251D] pb-3 mb-4 border-b border-[#F0EAE1] font-heading">
                Thông tin giao dịch
              </h2>
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-[#8C7E73]">Mã đơn hàng</span>
                  <span className="text-[15px] font-semibold text-[#30251D] font-mono">{order.orderCode}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-[#8C7E73]">Trạng thái hệ thống</span>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF8F2] text-[#22543D] border border-[#9AE6B4]">
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-[#8C7E73]">Phương thức mô phỏng</span>
                  <span className="text-[15px] font-semibold text-[#30251D]">{paymentMethodLabel}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-[#8C7E73]">Thời gian hoàn tất</span>
                  <span className="text-sm text-[#30251D]">{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Lưu ý thử nghiệm */}
            <div className="bg-[#FAF8F5] border border-[#E5DFD7] border-l-4 border-l-[#76513B] rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#38291E] uppercase tracking-wider mb-1.5">
                Lưu ý thử nghiệm
              </h3>
              <p className="text-xs text-[#6B5E55] leading-relaxed">
                Đơn hàng đã được lưu và cập nhật trạng thái PAID trong cơ sở dữ liệu. Đây là giao dịch thanh toán mô phỏng trong môi trường phát triển.
              </p>
            </div>

            {/* Các nút hành động */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/orders"
                className="w-full py-3 px-4 rounded-xl bg-[#38291E] hover:bg-[#241A13] !text-white font-medium text-sm transition-colors text-center shadow-xs"
                style={{ color: "#ffffff" }}
              >
                <span className="text-white font-medium">Đơn hàng của tôi</span>
              </Link>
              <Link
                href={`/orders/${encodeURIComponent(order.id)}`}
                className="w-full py-3 px-4 rounded-xl bg-white border border-[#DED6CB] !text-[#38291E] hover:bg-[#F7F5F1] font-medium text-sm transition-colors text-center"
                style={{ color: "#38291E" }}
              >
                <span className="text-[#38291E] font-medium">Xem chi tiết đơn hàng</span>
              </Link>
              <Link
                href="/menu"
                className="w-full py-3 px-4 rounded-xl bg-transparent border border-transparent !text-[#6F6258] hover:text-[#38291E] hover:bg-[#EAE3D8]/40 font-medium text-sm transition-colors text-center"
                style={{ color: "#6F6258" }}
              >
                <span className="text-[#6F6258] font-medium">Tiếp tục mua sắm</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
