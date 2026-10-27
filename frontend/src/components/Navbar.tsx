"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout, useAuth } from "../lib/auth";
import { useCart } from "../features/cart/cart-store";

export default function Navbar() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="site-nav" aria-label="Điều hướng chính">
      {/* ── ROW CHÍNH ── */}
      <div className="site-nav__inner">
        {/* Logo */}
        <Link href="/" className="site-nav__brand" onClick={closeMobile}>
          Brew<span>Lite</span>
        </Link>

        {/* Điều hướng center – ẩn trên mobile */}
        <div className="site-nav__links">
          <Link href="/" className="site-nav__link">
            Trang chủ
          </Link>
          <Link href="/menu" className="site-nav__link">
            Thực đơn
          </Link>
          {currentUser && (
            <Link href="/orders" className="site-nav__link">
              Đơn hàng
            </Link>
          )}
        </div>

        {/* Actions: icon-based buttons tối giản */}
        <div className="site-nav__actions flex items-center gap-1.5 sm:gap-2">
          {/* 1. Icon Tìm kiếm */}
          <Link
            href="/menu"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#E7DECE]/85 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tìm kiếm món"
            title="Tìm kiếm món"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>

          {/* 2. Icon Giỏ hàng kèm badge số lượng */}
          <Link
            href="/cart"
            aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
            title="Giỏ hàng"
            className="relative w-9 h-9 flex items-center justify-center rounded-full text-[#E7DECE]/85 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-amber-600 text-white flex items-center justify-center shadow-xs">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {currentUser ? (
            <>
              {/* 3. Icon Thông tin cá nhân / Tài khoản */}
              <Link
                href="/profile"
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#E7DECE]/85 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Thông tin cá nhân"
                title="Thông tin cá nhân"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>

              {/* 4. Icon Đăng xuất */}
              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#E7DECE]/85 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đăng xuất"
                title="Đăng xuất"
                type="button"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 ml-1">
              {/* Icon Đăng nhập khi chưa có tài khoản */}
              <Link
                href={itemCount > 0 ? `/login?redirect=${encodeURIComponent("/cart?autoCheckout=true")}` : "/login"}
                className="h-8 px-3 rounded-full text-xs font-semibold text-[#E7DECE] hover:text-white bg-white/10 hover:bg-white/15 transition-colors flex items-center gap-1.5"
                title="Đăng nhập"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Đăng nhập</span>
              </Link>
            </div>
          )}

          {/* Hamburger toggle dạng icon trên mobile */}
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#E7DECE] hover:bg-white/10 sm:hidden transition-colors cursor-pointer"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            aria-controls="site-mobile-menu"
            type="button"
          >
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div
          className="site-nav__mobile"
          id="site-mobile-menu"
          role="menu"
          aria-label="Menu điều hướng mobile"
        >
          <Link
            href="/"
            className="site-nav__mobile-link"
            onClick={closeMobile}
            role="menuitem"
          >
            Trang chủ
          </Link>
          <Link
            href="/menu"
            className="site-nav__mobile-link"
            onClick={closeMobile}
            role="menuitem"
          >
            Thực đơn
          </Link>
          <Link
            href="/cart"
            className="site-nav__mobile-link"
            onClick={closeMobile}
            role="menuitem"
          >
            Giỏ hàng ({itemCount})
          </Link>

          {currentUser ? (
            <>
              <Link
                href="/orders"
                className="site-nav__mobile-link"
                onClick={closeMobile}
                role="menuitem"
              >
                Đơn hàng của tôi
              </Link>
              <Link
                href="/profile"
                className="site-nav__mobile-link"
                onClick={closeMobile}
                role="menuitem"
              >
                Thông tin cá nhân
              </Link>
              <button
                className="site-nav__mobile-link text-left text-rose-300 hover:text-rose-200"
                onClick={handleLogout}
                type="button"
                role="menuitem"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                href={itemCount > 0 ? `/login?redirect=${encodeURIComponent("/cart?autoCheckout=true")}` : "/login"}
                className="site-nav__mobile-link"
                onClick={closeMobile}
                role="menuitem"
              >
                Đăng nhập
              </Link>
              <Link
                href={itemCount > 0 ? `/register?redirect=${encodeURIComponent("/cart?autoCheckout=true")}` : "/register"}
                className="site-nav__mobile-link"
                onClick={closeMobile}
                role="menuitem"
              >
                Đăng ký tài khoản
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
