import { apiClient } from "./api-client";
import {
  StoredUser,
  clearAuth,
  setAccessToken,
  setUser,
} from "./auth-token";
import { notifyAuthChange } from "./use-auth";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  access_token: string;
  user: StoredUser;
}

/**
 * Đăng ký tài khoản mới, lưu Access Token và thông tin user vào localStorage.
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const data = await apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

  const token = data.accessToken || data.access_token;
  if (token) {
    setAccessToken(token);
  }
  if (data.user) {
    setUser(data.user);
  }
  notifyAuthChange();

  return data;
}

/**
 * Đăng nhập tài khoản, lưu Access Token và thông tin user vào localStorage.
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const data = await apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  const token = data.accessToken || data.access_token;
  if (token) {
    setAccessToken(token);
  }
  if (data.user) {
    setUser(data.user);
  }
  notifyAuthChange();

  return data;
}

/**
 * Đăng xuất và xóa token khỏi localStorage.
 */
export function logout(): void {
  clearAuth();
  notifyAuthChange();
}

/**
 * Lấy thông tin user hiện tại từ backend (sẽ tự động đính kèm Authorization header).
 */
export async function getProfile(): Promise<StoredUser> {
  return apiClient<StoredUser>("/auth/me");
}
