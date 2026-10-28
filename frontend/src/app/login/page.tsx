"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { login } from "../../lib/auth";
import { formatErrorMessage } from "../../lib/api-client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-[#F7F5F1]">
          <p className="text-[#76513B] text-sm">Đang tải...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const isLoggedOutParam = searchParams.get("loggedOut") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loggedOutToast, setLoggedOutToast] = useState(isLoggedOutParam);

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset form sạch sẽ khi component mount hoặc khi vào trang login
  useEffect(() => {
    setEmail("");
    setPassword("");
    setError(null);
    setLoading(false);
    setSuccess(false);

    if (isLoggedOutParam) {
      setLoggedOutToast(true);
      // Dọn cờ query khỏi URL sau khi đã nhận diện
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("loggedOut");
        window.history.replaceState({}, "", url.toString());
      }
      const timer = setTimeout(() => {
        setLoggedOutToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedOutParam]);

  // Dọn dẹp timer redirect khi unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoggedOutToast(false);
    setLoading(true);

    try {
      await login({ email, password });
      setSuccess(true);
      redirectTimerRef.current = setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const registerHref =
    redirectUrl && redirectUrl !== "/"
      ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
      : "/register";

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F5F1]">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-[#D8CFC2]">
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#76513B] mb-2">
            BrewLite Coffee
          </p>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[#30251D]"
            style={{ fontFamily: "var(--font-heading, serif)" }}
          >
            Đăng nhập tài khoản
          </h1>
          <p className="mt-2 text-sm text-[#76513B]/80">
            Ứng dụng đặt đồ uống và thanh toán không dùng tiền mặt
          </p>
        </div>

        {loggedOutToast && (
          <div className="bg-[#FAF8F5] border-l-4 border-[#76513B] p-3.5 rounded-lg text-sm text-[#38291E] flex items-center justify-between shadow-2xs">
            <span>Đăng xuất thành công.</span>
            <button
              type="button"
              onClick={() => setLoggedOutToast(false)}
              className="text-xs text-[#76513B] hover:text-[#38291E] font-bold ml-2 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="bg-[#FDF2F2] border-l-4 border-[#C84B31] p-3.5 rounded-lg text-sm text-[#9B2C1C]">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[#F0FDF4] border-l-4 border-[#16A34A] p-3.5 rounded-lg text-sm text-[#166534]">
            Đăng nhập thành công! Đang chuyển hướng...
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#30251D] mb-1.5"
              >
                Địa chỉ Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (loggedOutToast) setLoggedOutToast(false);
                }}
                className="w-full px-3.5 py-2.5 border border-[#D8CFC2] bg-[#FAF8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
                placeholder="vidu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#30251D] mb-1.5"
              >
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (loggedOutToast) setLoggedOutToast(false);
                }}
                className="w-full px-3.5 py-2.5 border border-[#D8CFC2] bg-[#FAF8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-bold uppercase tracking-wider text-[#FFF9F0] bg-[#38291E] hover:bg-[#251A13] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#76513B] disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </div>

          <div className="text-center text-sm text-[#76513B]">
            Chưa có tài khoản?{" "}
            <Link
              href={registerHref}
              className="font-bold text-[#30251D] hover:underline"
            >
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
