"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatErrorMessage } from "../../lib/api-client";
import { getProfile, updateProfile, useAuth } from "../../lib/auth";
import { getMyOrders, type CreatedOrderResponse } from "../../lib/orders-api";
import {
  getLoyaltyRewards,
  getMyVouchers,
  getLoyaltyHistory,
  redeemVoucher,
  type RewardTier,
  type UserVoucher,
  type LoyaltyHistoryItem,
} from "../../lib/loyalty-api";
import { formatPrice } from "../../lib/money";

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // Danh sách đơn hàng gần đây của tài khoản
  const [recentOrders, setRecentOrders] = useState<CreatedOrderResponse[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Trạng thái Loyalty & Voucher
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyHistoryItem[]>([]);
  const [showRedeemPanel, setShowRedeemPanel] = useState(false);
  const [redeemingTierId, setRedeemingTierId] = useState<string | null>(null);
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState<string | null>(null);
  const [redeemErrorMsg, setRedeemErrorMsg] = useState<string | null>(null);

  // Trạng thái cập nhật thông tin cá nhân
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  const renderOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            Chờ thanh toán
          </span>
        );
      case "PAYMENT_FAILED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
            Thanh toán lỗi
          </span>
        );
      case "PAID":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
            Đã thanh toán
          </span>
        );
      case "PREPARING":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#E0F2FE] text-[#075985] border border-[#BAE6FD]">
            Đang chuẩn bị
          </span>
        );
      case "READY":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#CCFBF1] text-[#115E59] border border-[#99F6E4]">
            Đã sẵn sàng
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#F5F5F4] text-[#44403C] border border-[#E7E5E4]">
            Hoàn thành
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#F5F5F4] text-[#78716C] border border-[#E7E5E4]">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#F5F5F4] text-[#44403C] border border-[#E7E5E4]">
            {status}
          </span>
        );
    }
  };

  // Trạng thái đổi mật khẩu
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Đồng bộ thông tin từ backend khi vào trang
  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingProfile(false);
      return;
    }

    let active = true;
    setLoadingProfile(true);
    setLoadingOrders(true);

    getProfile()
      .then((data) => {
        if (!active) return;
        setFullName(data.fullName || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setLoyaltyPoints(data.loyaltyPoints ?? 0);
        if (data.createdAt) {
          setCreatedAt(new Date(data.createdAt).toLocaleDateString("vi-VN"));
        }
      })
      .catch(() => {
        if (!active) return;
        if (user) {
          setFullName(user.fullName || "");
          setPhone(user.phone || "");
          setEmail(user.email || "");
          setLoyaltyPoints(user.loyaltyPoints ?? 0);
        }
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });

    getMyOrders()
      .then((orders) => {
        if (!active) return;
        setRecentOrders(orders.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingOrders(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id]);

  const handleRedeem = async (tier: RewardTier) => {
    if (loyaltyPoints < tier.pointsCost) {
      setRedeemErrorMsg("Bạn chưa đủ điểm để đổi mã khuyến mại này.");
      return;
    }
    setRedeemingTierId(tier.id);
    setRedeemErrorMsg(null);
    setRedeemSuccessMsg(null);
    try {
      const res = await redeemVoucher(tier.id);
      setLoyaltyPoints(res.remainingPoints);
      setRedeemSuccessMsg(res.message);
      // Cập nhật lại danh sách voucher và lịch sử
      const [updatedVouchers, updatedHistory] = await Promise.all([
        getMyVouchers(),
        getLoyaltyHistory(),
      ]);
      setUserVouchers(updatedVouchers);
      setLoyaltyHistory(updatedHistory.slice(0, 10));
    } catch (err: any) {
      setRedeemErrorMsg(err.message || "Không thể đổi mã khuyến mại lúc này.");
    } finally {
      setRedeemingTierId(null);
    }
  };

  // Xử lý lưu thông tin cá nhân (Họ tên, SĐT)
  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError(null);
    setInfoSuccess(null);

    if (fullName.trim().length < 2) {
      setInfoError("Họ và tên phải có ít nhất 2 ký tự.");
      return;
    }

    setInfoLoading(true);
    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });

      setInfoSuccess("Thông tin cá nhân đã được cập nhật thành công!");
      if (res.user) {
        setFullName(res.user.fullName);
        setPhone(res.user.phone || "");
        setLoyaltyPoints(res.user.loyaltyPoints ?? loyaltyPoints);
      }
    } catch (err) {
      setInfoError(formatErrorMessage(err));
    } finally {
      setInfoLoading(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPassword) {
      setPassError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setPassLoading(true);
    try {
      await updateProfile({
        currentPassword,
        newPassword,
      });

      setPassSuccess("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordChange(false);
    } catch (err) {
      setPassError(formatErrorMessage(err));
    } finally {
      setPassLoading(false);
    }
  };

  // Màn hình khi chưa đăng nhập
  if (!isAuthenticated && !loadingProfile) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F5F1]">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-[#D8CFC2] text-center space-y-6">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#76513B] mb-2">
              BrewLite Coffee
            </p>
            <h1
              className="text-2xl font-bold text-[#30251D]"
              style={{ fontFamily: "var(--font-heading, serif)" }}
            >
              Vui lòng đăng nhập
            </h1>
            <p className="mt-2 text-sm text-[#76513B]/80">
              Bạn cần đăng nhập tài khoản BrewLite để quản lý thông tin cá nhân và điểm thưởng.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 px-4 rounded-lg bg-[#38291E] hover:bg-[#251A13] text-[#FFF9F0] font-bold text-xs uppercase tracking-wider shadow-sm transition"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F1] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* TIÊU ĐỀ TRANG & THÔNG TIN TỔNG QUAN */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#D8CFC2] p-6 sm:p-8 flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#76513B] mb-1">
              BrewLite Coffee · Khách hàng
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1
                className="text-2xl sm:text-3xl font-bold text-[#30251D]"
                style={{ fontFamily: "var(--font-heading, serif)" }}
              >
                {fullName || "Khách hàng BrewLite"}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAE1D2] text-[#5B3E2D] border border-[#D8CFC2]">
                Khách hàng thân thiết
              </span>
            </div>
            <p className="text-sm text-[#76513B]">{email}</p>
            {createdAt && (
              <p className="text-xs text-[#76513B]/70">
                Thành viên từ: {createdAt}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/orders"
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D8CFC2] text-[#30251D] hover:bg-[#FAF8F5] transition"
            >
              Lịch sử đơn hàng
            </Link>
          </div>
        </div>

        {/* ── MỤC ĐIỂM THƯỞNG CỦA NGƯỜI DÙNG (LOYALTY POINTS) ── */}
        <div
          className="text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-[#D8CFC2]/20"
          style={{
            background: "linear-gradient(135deg, #241810 0%, #38291E 50%, #1A110A 100%)",
          }}
        >
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DECE]/20 pb-5">
              <div>
                <span className="text-xs font-bold tracking-[0.18em] uppercase text-[#E7DECE]">
                  Chương trình tích điểm
                </span>
                <h2
                  className="text-xl sm:text-2xl font-bold mt-1 text-[#FFF9F0]"
                  style={{ fontFamily: "var(--font-heading, serif)" }}
                >
                  Điểm thưởng khả dụng
                </h2>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#E7DECE]">
                  {loyaltyPoints.toLocaleString("vi-VN")}
                </span>
                <span className="text-base text-[#E7DECE]/80 font-medium">điểm</span>
              </div>
            </div>

            {/* Thông tin quy đổi điểm */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="bg-white/5 backdrop-blur-xs rounded-xl p-4 border border-[#E7DECE]/15">
                <div className="text-[#E7DECE] font-bold text-sm mb-1">
                  Tích lũy tự động
                </div>
                <p className="text-xs text-[#F5EFEB]/85 leading-relaxed">
                  Mỗi đơn hàng thành công sẽ tự động tích điểm thưởng vào tài khoản theo giá trị thanh toán.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-xs rounded-xl p-4 border border-[#E7DECE]/15">
                <div className="text-[#E7DECE] font-bold text-sm mb-1">
                  Đổi ưu đãi đặc biệt
                </div>
                <p className="text-xs text-[#F5EFEB]/85 leading-relaxed">
                  Sử dụng điểm thưởng để giảm trực tiếp trên đơn hàng tiếp theo hoặc đổi đồ uống yêu thích.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-xs rounded-xl p-4 border border-[#E7DECE]/15">
                <div className="text-[#E7DECE] font-bold text-sm mb-1">
                  Hạng thành viên
                </div>
                <p className="text-xs text-[#F5EFEB]/85 leading-relaxed">
                  Điểm thưởng được duy trì trọn đời, mở khóa thêm nhiều mã giảm giá và đặc quyền riêng.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-xs text-[#E7DECE]/80">
                Đặt thêm món ngay hôm nay để nhận thêm điểm thưởng!
              </p>
              <Link
                href="/menu"
                className="px-5 py-2.5 bg-[#E7DECE] hover:bg-white text-[#30251D] rounded-full font-bold text-xs uppercase tracking-wider transition shadow-sm"
              >
                Đặt đồ uống ngay
              </Link>
            </div>
          </div>
        </div>

        {/* ── MỤC ĐƠN HÀNG GẦN ĐÂY CỦA TÀI KHOẢN ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#D8CFC2] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8CFC2]/60 pb-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#76513B] mb-1">
                Lịch sử đặt món
              </p>
              <h2
                className="text-xl font-bold text-[#30251D]"
                style={{ fontFamily: "var(--font-heading, serif)" }}
              >
                Đơn hàng của bạn
              </h2>
              <p className="text-sm text-[#76513B] mt-0.5">
                Theo dõi trạng thái các món đã đặt và tiếp tục thanh toán.
              </p>
            </div>
            <Link
              href="/orders"
              className="text-sm font-semibold text-[#76513B] hover:text-[#30251D] hover:underline"
            >
              Xem tất cả đơn hàng
            </Link>
          </div>

          {loadingOrders ? (
            <div className="py-8 text-center text-[#76513B]/70 text-sm">
              Đang tải danh sách đơn hàng...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-[#76513B] text-sm">
                Bạn chưa có đơn hàng nào trong tài khoản.
              </p>
              <Link
                href="/menu"
                className="inline-block px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#30251D] bg-[#EAE1D2] hover:bg-[#D8CFC2] rounded-lg transition"
              >
                Khám phá thực đơn ngay
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#D8CFC2]/40">
              {recentOrders.map((order) => {
                const isPending = order.status === "PENDING" || order.status === "PAYMENT_FAILED";
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <div
                    key={order.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-[#30251D] text-base">
                          Đơn #{order.orderCode}
                        </span>
                        {renderOrderStatusBadge(order.status)}
                        <span className="text-xs text-[#76513B]/70">
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="text-sm text-[#665345] line-clamp-1">
                        {order.items
                          .map(
                            (i) =>
                              `${i.quantity}x ${i.productName} (${i.sizeCode})`
                          )
                          .join(", ")}
                      </div>
                      <div className="text-xs text-[#76513B]">
                        Tổng số lượng: {itemCount} món · Tổng tiền:{" "}
                        <strong className="text-[#30251D] font-bold">
                          {formatPrice(String(order.total))}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <Link
                          href={`/checkout?orderId=${order.id}`}
                          className="px-4 py-2 bg-[#38291E] hover:bg-[#251A13] text-[#FFF9F0] rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm"
                        >
                          Thanh toán ngay
                        </Link>
                      ) : (
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#EAE1D2] text-[#30251D] border border-[#D8CFC2] rounded-lg text-xs font-semibold transition"
                        >
                          Chi tiết
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MỤC CHỈNH SỬA THÔNG TIN CÁ NHÂN ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#D8CFC2] p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#D8CFC2]/60 pb-4">
            <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#76513B] mb-1">
              Tài khoản
            </p>
            <h2
              className="text-xl font-bold text-[#30251D]"
              style={{ fontFamily: "var(--font-heading, serif)" }}
            >
              Thông tin tài khoản
            </h2>
            <p className="text-sm text-[#76513B] mt-0.5">
              Cập nhật tên hiển thị và số điện thoại liên hệ để nhận thông báo đơn hàng.
            </p>
          </div>

          {infoError && (
            <div className="bg-[#FDF2F2] border-l-4 border-[#C84B31] p-3.5 rounded-lg text-sm text-[#9B2C1C]">
              {infoError}
            </div>
          )}

          {infoSuccess && (
            <div className="bg-[#F0FDF4] border-l-4 border-[#16A34A] p-3.5 rounded-lg text-sm text-[#166534]">
              {infoSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateInfo} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Họ và tên */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-semibold text-[#30251D] mb-1.5"
                >
                  Họ và tên <span className="text-[#C84B31]">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CFC2] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-[#30251D] mb-1.5"
                >
                  Số điện thoại liên hệ
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CFC2] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
                />
              </div>

              {/* Email (Read-only) */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-[#30251D] mb-1.5"
                >
                  Địa chỉ Email (Định danh tài khoản)
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CFC2]/70 bg-[#EAE1D2]/30 text-[#76513B] text-sm cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-xs bg-[#EAE1D2] text-[#5B3E2D] px-2 py-0.5 rounded font-medium">
                    Không thể đổi
                  </span>
                </div>
                <p className="text-xs text-[#76513B]/70 mt-1">
                  Email dùng để đăng nhập và bảo mật tài khoản.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={infoLoading}
                className="px-6 py-2.5 bg-[#38291E] hover:bg-[#251A13] text-[#FFF9F0] font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {infoLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>

        {/* ── MỤC ĐỔI MẬT KHẨU BẢO MẬT ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#D8CFC2] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#D8CFC2]/60 pb-4">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#76513B] mb-1">
                Bảo mật
              </p>
              <h2
                className="text-xl font-bold text-[#30251D]"
                style={{ fontFamily: "var(--font-heading, serif)" }}
              >
                Bảo mật & Mật khẩu
              </h2>
              <p className="text-sm text-[#76513B] mt-0.5">
                Thay đổi mật khẩu đăng nhập để bảo vệ tài khoản của bạn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPasswordChange(!showPasswordChange);
                setPassError(null);
                setPassSuccess(null);
              }}
              className="text-sm font-bold text-[#76513B] hover:text-[#30251D] hover:underline cursor-pointer"
            >
              {showPasswordChange ? "Thu gọn" : "Đổi mật khẩu"}
            </button>
          </div>

          {passError && (
            <div className="bg-[#FDF2F2] border-l-4 border-[#C84B31] p-3.5 rounded-lg text-sm text-[#9B2C1C]">
              {passError}
            </div>
          )}

          {passSuccess && (
            <div className="bg-[#F0FDF4] border-l-4 border-[#16A34A] p-3.5 rounded-lg text-sm text-[#166534]">
              {passSuccess}
            </div>
          )}

          {showPasswordChange && (
            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-semibold text-[#30251D] mb-1.5"
                >
                  Mật khẩu hiện tại <span className="text-[#C84B31]">*</span>
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CFC2] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-semibold text-[#30251D] mb-1.5"
                  >
                    Mật khẩu mới <span className="text-[#C84B31]">*</span>
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CFC2] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-[#30251D] mb-1.5"
                  >
                    Xác nhận mật khẩu mới <span className="text-[#C84B31]">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8CFC2] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#76513B] focus:bg-white text-[#30251D] text-sm transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="px-4 py-2 border border-[#D8CFC2] text-[#30251D] hover:bg-[#FAF8F5] rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-5 py-2 bg-[#38291E] hover:bg-[#251A13] text-[#FFF9F0] font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {passLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
