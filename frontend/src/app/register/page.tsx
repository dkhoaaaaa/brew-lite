"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { register } from "../../lib/auth";
import { formatErrorMessage } from "../../lib/api-client";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-[#F7F5F1]">
          <p className="text-[#76513B] text-sm">Đang tải...</p>
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

  // Dọn dẹp form sạch sẽ khi component mount / khi vào trang đăng ký
  useEffect(() => {
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setLoading(false);
    setSuccess(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Kiểm tra Họ và tên (chỉ được là chữ cái, không được là số, ít nhất 2 ký tự, ngăn cách bởi khoảng trắng)
    const trimmedFullName = fullName.trim();
    if (/\d/.test(trimmedFullName)) {
      setError("Họ và tên phải là chữ cái không được là số");
      return;
    }

    if (!/^[\p{L}\s]+$/u.test(trimmedFullName)) {
      setError("Họ và tên chỉ được chứa chữ cái và khoảng trắng");
      return;
    }

    const nameParts = trimmedFullName.split(/\s+/).filter(Boolean);
    if (trimmedFullName.length < 2 || nameParts.length < 2) {
      setError(
        "Họ và tên yêu cầu có ít nhất 2 Chữ cái",
      );
      return;
    }

    // 2. Kiểm tra Email (phải có đuôi @gmail.com)
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Vui lòng nhập gmail của bạn");
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(trimmedEmail)) {
      setError("Gmail phải có định dạng @gmail.com");
      return;
    }

    // 3. Kiểm tra Số điện thoại (phải có đúng 10 chữ số)
    const trimmedPhone = phone.trim();
    if (!/^[0-9]{10}$/.test(trimmedPhone)) {
      setError("Số điện thoại phải có đúng 10 chữ số");
      return;
    }

    // 4. Kiểm tra Mật khẩu (phải có ít nhất 6 chữ số)
    const digitCount = (password.match(/[0-9]/g) || []).length;
    if (password.length < 6 || digitCount < 6) {
      setError("Mật khẩu phải có ít nhất 6 chữ số");
      return;
    }

    // 5. Kiểm tra Xác nhận mật khẩu
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName: trimmedFullName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password,
      });

      // Dọn dẹp form đăng ký sau khi đăng ký thành công
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setSuccess(true);

      // Chuyển qua giao diện đăng nhập (giữ param redirect nếu có)
      const targetLogin =
        redirectUrl && redirectUrl !== "/"
          ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
          : "/login";

      setTimeout(() => {
        router.push(targetLogin);
      }, 1000);
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
            Tạo tài khoản mới
          </h1>
          <p className="mt-2 text-sm text-[#76513B]/80">
            Đăng ký để tích lũy điểm thưởng và nhận nhiều đặc quyền
          </p>
        </div>

        {error && (
          <div className="bg-[#FDF2F2] border-l-4 border-[#C84B31] p-3.5 rounded-lg text-sm text-[#9B2C1C]">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[#F0FDF4] border-l-4 border-[#16A34A] p-3.5 rounded-lg text-sm text-[#166534]">
            Đăng ký thành công! Đang chuyển hướng sang trang đăng nhập...
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-semibold text-[#30251D] mb-1.5"
            >
              Họ và tên <span className="text-[#C84B31]">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#D8CFC2] bg-[#FAF8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-[#30251D] mb-1.5"
            >
              Địa chỉ Email <span className="text-[#C84B31]">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#D8CFC2] bg-[#FAF8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
              placeholder="vidu@gmail.com"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-[#30251D] mb-1.5"
            >
              Số điện thoại <span className="text-[#C84B31]">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#D8CFC2] bg-[#FAF8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
              placeholder="0901234567"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[#30251D] mb-1.5"
            >
              Mật khẩu (tối thiểu 6 chữ số) <span className="text-[#C84B31]">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#D8CFC2] bg-[#FAF8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-[#30251D] mb-1.5"
            >
              Xác nhận mật khẩu <span className="text-[#C84B31]">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#D8CFC2] bg-[#FAF8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-bold uppercase tracking-wider text-[#FFF9F0] bg-[#38291E] hover:bg-[#251A13] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#76513B] disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
            </button>
          </div>

          <div className="text-center text-sm text-[#76513B] pt-1">
            Đã có tài khoản?{" "}
            <Link
              href={loginHref}
              className="font-bold text-[#30251D] hover:underline"
            >
              Đăng nhập tại đây
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
