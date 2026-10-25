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

        {/* Actions: text-based buttons */}
        <div className="site-nav__actions flex items-center gap-3">
          {/* Tìm kiếm */}
          <Link
            href="/menu"
            className="nav-auth-btn nav-auth-btn--ghost text-xs"
          >
            Tìm kiếm
          </Link>

          {/* Giỏ hàng */}
          <Link
            href="/cart"
            aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
            className="nav-auth-btn nav-auth-btn--ghost text-xs relative"
          >
            Giỏ hàng
            {itemCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-600 text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {currentUser ? (
            <>
              {/* Tài khoản */}
              <Link
                href="/profile"
                className="nav-auth-btn nav-auth-btn--ghost text-xs"
              >
                Tài khoản
              </Link>

              {/* Đăng xuất */}
              <button
                onClick={handleLogout}
                className="nav-auth-btn nav-auth-btn--ghost text-xs"
                type="button"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              {/* Đăng nhập */}
              <Link
                href={itemCount > 0 ? `/login?redirect=${encodeURIComponent("/cart?autoCheckout=true")}` : "/login"}
                className="nav-auth-btn nav-auth-btn--ghost text-xs"
              >
                Đăng nhập
              </Link>

              {/* Đăng ký */}
              <Link
                href={itemCount > 0 ? `/register?redirect=${encodeURIComponent("/cart?autoCheckout=true")}` : "/register"}
                className="nav-auth-btn nav-auth-btn--solid text-xs"
              >
                Đăng ký
              </Link>
            </>
          )}

          {/* Hamburger toggle dạng text trên mobile */}
          <button
            className="nav-hamburger text-xs font-bold px-2 py-1 border border-stone-600 rounded text-stone-200 sm:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            aria-controls="site-mobile-menu"
            type="button"
          >
            {mobileOpen ? "Đóng" : "Menu"}
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
                Đơn hàng
              </Link>
              <Link
                href="/profile"
                className="site-nav__mobile-link"
                onClick={closeMobile}
                role="menuitem"
              >
                Tài khoản
              </Link>
              <button
                className="site-nav__mobile-link text-left"
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
                Đăng ký
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
