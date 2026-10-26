"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../lib/auth";
import { formatPrice } from "../../lib/money";
import { cancelOrder, getMyOrders, type CreatedOrderResponse } from "../../lib/orders-api";

const TABS = [
  { id: "ALL", label: "Tất cả" },
  { id: "PENDING", label: "Chờ thanh toán" },
  { id: "PAYMENT_FAILED", label: "Thanh toán lỗi" },
  { id: "PAID", label: "Đã thanh toán" },
  { id: "PREPARING", label: "Đang chuẩn bị" },
  { id: "READY", label: "Đã sẵn sàng" },
  { id: "COMPLETED", label: "Hoàn thành" },
  { id: "CANCELLED", label: "Đã hủy" },
];

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<CreatedOrderResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = 220;
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getMyOrders(statusFilter)
      .then((data) => {
        if (!active) return;
        setOrders(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, statusFilter]);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      return;
    }

    try {
      await cancelOrder(orderId);
      const updated = await getMyOrders(statusFilter);
      setOrders(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể hủy đơn hàng.");
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-12 px-4 sm:px-6 flex items-center justify-center font-sans text-[#30251D]">
        <div className="max-w-md w-full bg-white border border-[#DED6CB] rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#EAE3D8] text-[#76513B] flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-[#30251D] mb-2 font-heading">
            Vui lòng đăng nhập
          </h1>
          <p className="text-sm text-[#6F6258] mb-6 leading-relaxed">
            Bạn cần đăng nhập tài khoản BrewLite để xem lịch sử và quản lý đơn hàng của mình.
          </p>
          <Link
            className="inline-flex items-center justify-center bg-[#38291E] hover:bg-[#241A13] !text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors w-full sm:w-auto shadow-xs"
            href="/login"
            style={{ color: "#ffffff" }}
          >
            <span className="text-white font-semibold">Đăng nhập ngay</span>
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

  const formatDate = (isoString: string) => {
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

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[#30251D]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#76513B] mb-1">
            Lịch sử mua hàng
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#30251D] mb-2 font-heading tracking-tight">
            Đơn hàng của tôi
          </h1>
          <p className="text-sm sm:text-base text-[#6F6258] leading-relaxed">
            Theo dõi tiến độ, xem lại chi tiết và quản lý các đơn hàng đã đặt tại BrewLite.
          </p>
        </header>

        {/* Khung bộ lọc: Dropdown chọn nhanh + Thanh tab có 2 nút dịch chuyển qua lại */}
        <div className="mb-8 flex flex-col gap-3">
          {/* 1. Dropdown chọn nhanh trạng thái */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#76513B]">
              Lọc theo trạng thái:
            </span>
            <div className="relative inline-block w-48 sm:w-56">
              <select
                aria-label="Chọn trạng thái đơn hàng"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-[#DED6CB] hover:border-[#76513B] rounded-xl px-3.5 py-2 pr-9 text-xs sm:text-sm font-semibold text-[#30251D] cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#76513B] transition-colors"
              >
                {TABS.map((tab) => (
                  <option key={tab.id} value={tab.id} className="text-[#30251D] py-1">
                    {tab.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#30251D]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* 2. Dải tab cuộn với 2 nút bấm chuyển qua lại (Prev / Next) */}
          <div className="relative flex items-center gap-2">
            {/* Nút dịch chuyển sang trái */}
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-full bg-white border border-[#DED6CB] text-[#30251D] hover:bg-[#38291E] hover:text-white hover:border-[#38291E] transition-all shrink-0 shadow-2xs cursor-pointer"
              aria-label="Cuộn các tab sang trái"
              title="Cuộn sang trái"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Dải tab cuộn */}
            <nav
              ref={tabsRef}
              aria-label="Bộ lọc trạng thái đơn hàng"
              className="flex-1 flex gap-2 overflow-x-auto py-1 scroll-smooth scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {TABS.map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all border cursor-pointer ${
                      isActive
                        ? "bg-[#38291E] !text-white border-[#38291E] font-bold shadow-xs"
                        : "bg-white !text-[#30251D] border-[#DED6CB] hover:border-[#76513B] hover:bg-[#F5EFE6] font-semibold"
                    }`}
                    style={{ color: isActive ? "#ffffff" : "#30251D" }}
                    onClick={() => setStatusFilter(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Nút dịch chuyển sang phải */}
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-full bg-white border border-[#DED6CB] text-[#30251D] hover:bg-[#38291E] hover:text-white hover:border-[#38291E] transition-all shrink-0 shadow-2xs cursor-pointer"
              aria-label="Cuộn các tab sang phải"
              title="Cuộn sang phải"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Nội dung danh sách đơn hàng */}
        {loading ? (
          <div className="bg-white border border-[#DED6CB] rounded-2xl p-12 text-center shadow-xs">
            <p className="text-sm text-[#6F6258] animate-pulse">Đang tải danh sách đơn hàng của bạn...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 sm:p-10 text-center shadow-xs">
            <h2 className="text-xl font-bold text-rose-800 mb-2 font-heading">Không thể tải dữ liệu</h2>
            <p className="text-sm text-[#6F6258] mb-6">{error}</p>
            <button
              className="inline-flex items-center justify-center bg-white border border-[#DED6CB] hover:bg-stone-50 text-[#30251D] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              onClick={() => setStatusFilter((prev) => prev)}
              type="button"
            >
              Thử lại
            </button>
          </div>
        ) : orders.length === 0 ? (
          <section className="bg-white border border-[#DED6CB] rounded-2xl p-10 sm:p-12 text-center shadow-xs">
            <h2 className="text-2xl font-bold text-[#30251D] mb-3 font-heading">
              Bạn chưa có đơn hàng nào
            </h2>
            <p className="text-sm text-[#6F6258] leading-relaxed mb-6 max-w-md mx-auto">
              {statusFilter === "ALL"
                ? "Hãy khám phá những thức uống hấp dẫn của BrewLite và bắt đầu đơn hàng đầu tiên của bạn."
                : `Không tìm thấy đơn hàng nào ở trạng thái "${TABS.find((t) => t.id === statusFilter)?.label}".`}
            </p>
            <Link
              className="inline-flex items-center justify-center bg-[#38291E] hover:bg-[#241A13] !text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors shadow-xs"
              href="/menu"
              style={{ color: "#ffffff" }}
            >
              <span className="text-white font-semibold">Khám phá thực đơn</span>
            </Link>
          </section>
        ) : (
          <div className="flex flex-col gap-5">
            {orders.map((order) => {
              const isPayable = order.status === "PENDING" || order.status === "PAYMENT_FAILED";
              const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <article
                  className="bg-white border border-[#DED6CB] rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow"
                  key={order.id}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#F0EAE1] mb-4">
                    <div>
                      <span className="text-base sm:text-lg font-bold text-[#30251D] block">
                        #{order.orderCode}
                      </span>
                      <span className="text-xs text-[#8C7E73]">
                        Ngày đặt: {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Card Items */}
                  <div className="flex flex-col gap-3 mb-5">
                    {order.items.slice(0, 3).map((item) => (
                      <div className="flex items-start justify-between gap-4 text-sm" key={item.id}>
                        <div className="flex-1">
                          <span className="font-semibold text-[#30251D]">
                            {item.quantity} × {item.productName}
                          </span>
                          <div className="text-xs text-[#8C7E73] mt-0.5">
                            Size {item.sizeCode}
                            {item.toppings?.length ? ` · ${item.toppings.map((t) => t.name).join(", ")}` : ""}
                          </div>
                        </div>
                        <span className="font-semibold text-[#38291E] whitespace-nowrap">
                          {formatPrice(String(item.lineTotal))}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs italic text-[#8C7E73] mt-1">
                        + {order.items.length - 3} món khác
                      </p>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-dashed border-[#EDE6DC]">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#8C7E73] block">
                        Tổng cộng ({totalItemsCount} món)
                      </span>
                      <span className="text-lg font-bold text-[#30251D]">
                        {formatPrice(String(order.total))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {isPayable && (
                        <>
                          <Link
                            className="inline-flex items-center justify-center bg-[#38291E] hover:bg-[#241A13] !text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-xs"
                            href={`/checkout?orderId=${order.id}`}
                            style={{ color: "#ffffff" }}
                          >
                            <span className="text-white font-semibold">
                              {order.status === "PAYMENT_FAILED" ? "Thử lại thanh toán" : "Thanh toán ngay"}
                            </span>
                          </Link>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Hủy đơn
                          </button>
                        </>
                      )}
                      <Link
                        className="inline-flex items-center justify-center bg-white border border-[#DED6CB] !text-[#30251D] hover:bg-[#F5EFE6] hover:border-[#76513B] text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-2xs"
                        href={`/orders/${order.id}`}
                        style={{ color: "#30251D" }}
                      >
                        <span className="text-[#30251D] font-semibold">Xem chi tiết</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
