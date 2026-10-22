"use client";

import Link from "next/link";
import { logout } from "../lib/auth-api";
import { useAuth } from "../lib/use-auth";

export default function HomePage() {
  const { user: currentUser, token } = useAuth();

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

      {/* Auth Status & Account Overview Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-stone-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-bold text-stone-800 flex items-center space-x-2">
              <span>👤</span>
              <span>Trạng thái tài khoản (JWT)</span>
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
                nhận JWT Access Token và trải nghiệm dịch vụ.
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

        {/* Auth Module Overview Card */}
        <div className="bg-white p-6 rounded-xl shadow border border-stone-200 space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-xl font-bold text-stone-800 flex items-center space-x-2">
              <span>🔐</span>
              <span>Module Xác thực (Task 7)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Phân hệ quản lý người dùng, đăng ký, đăng nhập và bảo mật JWT.
            </p>
          </div>

          <div className="space-y-3 text-sm text-stone-600">
            <div className="flex items-start space-x-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <div>
                <strong className="text-stone-800">Đăng ký (POST /auth/register):</strong>{" "}
                Tạo tài khoản khách hàng mới, mã hóa mật khẩu bảo mật bằng thư viện <code>bcrypt</code>.
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <div>
                <strong className="text-stone-800">Đăng nhập (POST /auth/login):</strong>{" "}
                Kiểm tra thông tin đăng nhập và cấp <code>accessToken</code> chuẩn JWT thời hạn 7 ngày.
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <div>
                <strong className="text-stone-800">Bảo vệ API (JwtAuthGuard):</strong>{" "}
                Cung cấp Guard và Strategy để bảo vệ các endpoint yêu cầu quyền đăng nhập.
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <div>
                <strong className="text-stone-800">Client tự động gửi Token:</strong>{" "}
                Frontend lưu token vào <code>localStorage</code> và tự động gắn header{" "}
                <code>Authorization: Bearer &lt;token&gt;</code> cho mọi yêu cầu gọi API.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
