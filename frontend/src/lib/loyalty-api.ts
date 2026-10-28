import { getAccessToken, getUser } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface RewardTier {
  id: string;
  pointsCost: number;
  discountValue: number;
  name: string;
  description: string;
  minOrderAmount: number;
}

export interface UserVoucher {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  startAt: string;
  endAt: string;
  isUsed: boolean;
  isExpired: boolean;
  canApply: boolean;
}

export interface LoyaltyHistoryItem {
  id: string;
  type: "EARN" | "REDEEM";
  points: number;
  title: string;
  description: string;
  date: string;
}

export interface RedeemVoucherResponse {
  success: boolean;
  message: string;
  remainingPoints: number;
  voucher: {
    id: string;
    code: string;
    name: string;
    discountValue: number;
    minOrderAmount: number;
    startAt: string;
    endAt: string;
    isUsed: boolean;
  };
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const user = getUser();
  if (user?.id) {
    headers["x-user-id"] = user.id;
  }
  return headers;
}

/**
 * Lấy danh sách các mức quy đổi voucher
 */
export async function getLoyaltyRewards(): Promise<RewardTier[]> {
  const res = await fetch(`${API_URL}/loyalty/rewards`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error("Không thể tải danh sách ưu đãi đổi điểm.");
  }
  return res.json();
}

/**
 * Đổi điểm thành viên lấy mã voucher
 */
export async function redeemVoucher(tierId: string): Promise<RedeemVoucherResponse> {
  const res = await fetch(`${API_URL}/loyalty/redeem`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ tierId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Không thể đổi mã khuyến mại.");
  }
  return data;
}

/**
 * Lấy danh sách voucher thuộc tài khoản đang đăng nhập
 */
export async function getMyVouchers(): Promise<UserVoucher[]> {
  const res = await fetch(`${API_URL}/loyalty/my-vouchers`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error("Không thể tải danh sách mã khuyến mại của bạn.");
  }
  return res.json();
}

/**
 * Lấy lịch sử biến động điểm thưởng
 */
export async function getLoyaltyHistory(): Promise<LoyaltyHistoryItem[]> {
  const res = await fetch(`${API_URL}/loyalty/history`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error("Không thể tải lịch sử điểm thưởng.");
  }
  return res.json();
}

