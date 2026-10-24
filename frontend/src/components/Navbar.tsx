"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout, useAuth } from "../lib/auth";
import { useCart } from "../features/cart/cart-store";

// ─── SVG ICONS ───────────────────────────────────────────────────────────────

function CartIcon({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      aria-label={`Giỏ hàng, ${count} sản phẩm`}
      className="nav-icon-btn"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M2.5 3h1.8l2.2 8.6a1 1 0 00.97.74h6.56a1 1 0 00.96-.72L16.5 5.5H5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="17" r="1.3" fill="currentColor" />
        <circle cx="14.5" cy="17" r="1.3" fill="currentColor" />
      </svg>
      {count > 0 && (
        <span className="nav-icon-btn__badge" aria-hidden="true">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function SearchIcon() {
  return (
    <Link
      href="/menu"
      aria-label="Tìm kiếm món trong thực đơn"
      className="nav-icon-btn"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M13.5 13.5L18 18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="7.5" r="3.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.5 17.5c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {open ? (
        <path
          d="M5 5l12 12M17 5L5 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M3 6.5h16M3 11h16M3 15.5h16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────

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

        {/* Actions: icons + auth */}
        <div className="site-nav__actions">
          {/* Search icon */}
          <SearchIcon />

          {/* Cart icon – luôn hiển thị */}
          <CartIcon count={itemCount} />

          {currentUser ? (
            <>
              {/* Profile icon – ẩn trên mobile (có trong mobile menu) */}
              <Link
                href="/profile"
                aria-label={`Tài khoản của ${currentUser.fullName}`}
                className="nav-icon-btn nav-icon-btn--profile"
              >
                <ProfileIcon />
              </Link>

              {/* Đăng xuất – ẩn trên mobile */}
              <button
                onClick={handleLogout}
                className="nav-auth-btn nav-auth-btn--ghost"
                type="button"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              {/* Đăng nhập – ẩn trên mobile */}
              <Link href="/login" className="nav-auth-btn nav-auth-btn--ghost">
                Đăng nhập
              </Link>

              {/* Đăng ký – ẩn trên mobile */}
              <Link
                href="/register"
                className="nav-auth-btn nav-auth-btn--solid"
              >
                Đăng ký
              </Link>
            </>
          )}

          {/* Hamburger – chỉ hiển thị trên mobile */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            aria-controls="site-mobile-menu"
            type="button"
          >
            <HamburgerIcon open={mobileOpen} />
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
                className="site-nav__mobile-link"
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
                href="/login"
                className="site-nav__mobile-link"
                onClick={closeMobile}
                role="menuitem"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
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
