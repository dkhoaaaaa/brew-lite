"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "../lib/auth-api";
import { useAuth } from "../lib/use-auth";

export default function Navbar() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="bg-amber-950 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold tracking-wide">
          <span className="text-amber-400 text-2xl">☕</span>
          <span className="hover:text-amber-200 transition">BrewLite</span>
        </Link>

        <div className="flex items-center space-x-6">
          <Link href="/" className="hover:text-amber-300 text-sm font-medium transition">
            Trang chủ
          </Link>

          {currentUser ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-amber-200">
                Xin chào, <strong className="text-white">{currentUser.fullName}</strong>
              </span>
              {typeof currentUser.loyaltyPoints === "number" && (
                <span className="bg-amber-800 text-amber-200 text-xs px-2.5 py-1 rounded-full border border-amber-600">
                  ⭐️ {currentUser.loyaltyPoints} điểm
                </span>
              )}
              <button
                onClick={handleLogout}
                className="bg-amber-800 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded transition cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm hover:text-amber-200 px-3 py-1.5 rounded transition"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="text-sm bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-md font-medium transition"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
