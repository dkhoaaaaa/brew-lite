"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { register } from "../../lib/auth";
import { formatErrorMessage } from "../../lib/api-client";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <p className="text-stone-500">Đang tải...</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName,
        email,
        phone: phone.trim() ? phone.trim() : undefined,
        password,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loginHref =
    redirectUrl && redirectUrl !== "/"
      ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
      : "/login";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-amber-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-stone-900">
            Tạo tài khoản mới
          </h2>
          <p className="mt-2 text-center text-sm text-stone-600">
            Đăng ký để tích lũy điểm thưởng và đặt hàng nhanh chóng
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded text-sm text-emerald-700">
            Đăng ký thành công! Đang chuyển hướng...
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Họ và tên
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-stone-700 mb-1"
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
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
              placeholder="vidu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Số điện thoại (tùy chọn)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
              placeholder="0901234567"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Xác nhận mật khẩu
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
            </button>
          </div>

          <div className="text-center text-sm text-stone-600">
            Đã có tài khoản?{" "}
            <Link
              href={loginHref}
              className="font-medium text-amber-700 hover:text-amber-800 hover:underline"
            >
              Đăng nhập tại đây
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
