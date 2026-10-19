"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "../lib/auth-api";
import { formatErrorMessage } from "../lib/api-client";
import { OrderResponse, createOrder } from "../lib/orders-api";
import { useAuth } from "../lib/use-auth";

export default function HomePage() {
  const { user: currentUser, token } = useAuth();
  const [orderResult, setOrderResult] = useState<OrderResponse | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);

  const handleTestOrder = async () => {
    setOrdering(true);
    setOrderResult(null);
    setOrderError(null);

    try {
      // Gọi API POST /orders - Tự động đính kèm Authorization: Bearer <token> nếu có
      const res = await createOrder({
        note: "Đặt cà phê thử nghiệm xác thực JWT",
        total: 45000,
        items: [
          {
            productId: 1,
            productName: "Cà phê Sữa Đá BrewLite",
            sizeCode: "M",
            quantity: 1,
            unitPrice: 45000,
            sugarPercent: 70,
            icePercent: 100,
            note: "Ít ngọt",
          },
        ],
      });
      setOrderResult(res);
    } catch (err: unknown) {
      setOrderError(formatErrorMessage(err));
    } finally {
      setOrdering(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-block bg-amber-800/80 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-200">
            Hệ thống đặt cà phê thông minh
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Chào mừng đến với BrewLite
          </h1>
          <p className="text-amber-100 text-lg leading-relaxed">
            Giải pháp đặt đồ uống không dùng tiền mặt, nhận đồ uống nhanh chóng
            tại quầy và tích điểm thành viên.
          </p>
        </div>
      </div>

      {/* Auth Status & JWT Verification Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-stone-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-bold text-stone-800 flex items-center space-x-2">
              <span>👤</span>
              <span>Trạng thái xác thực (JWT)</span>
            </h2>
            {currentUser && (
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Đã đăng nhập
              </span>
            )}
          </div>

          {currentUser ? (
            <div className="space-y-3 text-sm text-stone-700">
              <div className="p-3 bg-stone-50 rounded-lg space-y-1.5 border border-stone-200">
                <p>
                  <strong className="text-stone-900">Họ và tên:</strong>{" "}
                  {currentUser.fullName}
                </p>
                <p>
                  <strong className="text-stone-900">Email:</strong>{" "}
                  {currentUser.email}
                </p>
                {currentUser.phone && (
                  <p>
                    <strong className="text-stone-900">Điện thoại:</strong>{" "}
                    {currentUser.phone}
                  </p>
                )}
                <p>
                  <strong className="text-stone-900">Điểm tích lũy:</strong>{" "}
                  <span className="text-amber-700 font-bold">
                    {currentUser.loyaltyPoints ?? 0} điểm
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">
                  JWT Access Token đã lưu (localStorage):
                </label>
                <div className="p-2 bg-stone-900 text-emerald-400 font-mono text-xs rounded break-all max-h-24 overflow-y-auto">
                  {token}
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  onClick={handleLogout}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-sm px-4 py-2 rounded-lg font-medium transition cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-stone-600">
              <p className="text-sm">
                Bạn chưa đăng nhập. Hãy đăng ký tài khoản mới hoặc đăng nhập để
                nhận JWT Access Token.
              </p>
              <div className="flex space-x-3 pt-2">
                <Link
                  href="/login"
                  className="bg-amber-700 hover:bg-amber-800 text-white text-sm px-4 py-2 rounded-lg font-medium transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm px-4 py-2 rounded-lg font-medium border border-stone-300 transition"
                >
                  Đăng ký tài khoản
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Test Route POST /orders (Protected by JwtAuthGuard) */}
        <div className="bg-white p-6 rounded-xl shadow border border-stone-200 space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-xl font-bold text-stone-800 flex items-center space-x-2">
              <span>🛡️</span>
              <span>Kiểm tra JwtAuthGuard (POST /orders)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Route POST /orders được bảo vệ nghiêm ngặt. Client sẽ tự động đính
              kèm Authorization: Bearer &lt;token&gt;.
            </p>
          </div>

          <p className="text-sm text-stone-600">
            Bấm nút bên dưới để gửi request <code>POST /orders</code> qua{" "}
            <code>apiClient</code>:
          </p>

          <button
            onClick={handleTestOrder}
            disabled={ordering}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition disabled:opacity-50 cursor-pointer"
          >
            {ordering
              ? "Đang gửi yêu cầu..."
              : "Thử tạo đơn hàng (POST /orders)"}
          </button>

          {orderResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 space-y-1">
              <p className="font-bold flex items-center space-x-1">
                <span>✅</span>
                <span>Tạo đơn hàng thành công!</span>
              </p>
              <p>
                Mã đơn: <strong>{orderResult.orderCode}</strong>
              </p>
              <p>Trạng thái: {orderResult.status}</p>
              <p>Tổng tiền: {Number(orderResult.total).toLocaleString()} VNĐ</p>
              <p>Điểm thưởng nhận được: +{orderResult.pointsEarned} điểm</p>
            </div>
          )}

          {orderError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 space-y-1">
              <p className="font-bold flex items-center space-x-1">
                <span>⛔</span>
                <span>Từ chối truy cập (JwtAuthGuard chặn)</span>
              </p>
              <p className="font-mono text-xs">{orderError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}