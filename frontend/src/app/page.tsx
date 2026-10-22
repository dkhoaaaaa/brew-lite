"use client";

import Link from "next/link";
import { logout, useAuth } from "../lib/auth";

export default function HomePage() {
  const { user: currentUser } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
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

      {/* Account Info Card */}
      <div className="bg-white p-6 rounded-xl shadow border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-bold text-stone-800 flex items-center space-x-2">
            <span>👤</span>
            <span>Thông tin tài khoản</span>
          </h2>
          {currentUser && (
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Đã đăng nhập
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="space-y-4 text-sm text-stone-700">
            <div className="p-4 bg-stone-50 rounded-lg space-y-2 border border-stone-200">
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

            <div className="pt-2">
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
              Bạn chưa đăng nhập. Hãy đăng ký tài khoản mới hoặc đăng nhập để trải
              nghiệm dịch vụ.
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
    </div>
  );
}
