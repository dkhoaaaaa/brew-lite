"use client";

import { useSyncExternalStore } from "react";
import { apiClient } from "./api-client";

// =====================================================================
// 1. KIỂU DỮ LIỆU (TYPES / INTERFACES)
// =====================================================================
export interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  loyaltyPoints?: number;
  createdAt?: string;
}

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

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  access_token: string;
  user: StoredUser;
}

// =====================================================================
// 2. LƯU TRỮ VÀ CACHE TOKEN / USER (SESSIONSTORAGE)
// Lưu phiên trong sessionStorage để tự động đăng xuất khi tắt tab/trình duyệt
// =====================================================================
const TOKEN_KEY = "brewlite_access_token";
const USER_KEY = "brewlite_user";

let cachedUserRaw: string | null = null;
let cachedUser: StoredUser | null = null;
let cachedToken: string | null = null;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token !== cachedToken) {
    cachedToken = token;
  }
  return cachedToken;
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  cachedToken = token;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function removeAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  cachedToken = null;
  sessionStorage.removeItem(TOKEN_KEY);
  // Đồng thời dọn dẹp localStorage cũ nếu có
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore
  }
}

export function getUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const data = sessionStorage.getItem(USER_KEY);
  if (data === cachedUserRaw) {
    return cachedUser;
  }

  cachedUserRaw = data;
  if (!data) {
    cachedUser = null;
    return null;
  }

  try {
    cachedUser = JSON.parse(data) as StoredUser;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

export function setUser(user: StoredUser): void {
  if (typeof window === "undefined") {
    return;
  }
  const str = JSON.stringify(user);
  cachedUserRaw = str;
  cachedUser = user;
  sessionStorage.setItem(USER_KEY, str);
}

export function removeUser(): void {
  if (typeof window === "undefined") {
    return;
  }
  cachedUserRaw = null;
  cachedUser = null;
  sessionStorage.removeItem(USER_KEY);
  // Đồng thời dọn dẹp localStorage cũ nếu có
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore
  }
}

export function clearAuth(): void {
  removeAccessToken();
  removeUser();
}

// =====================================================================
// 3. REACT HOOK THEO DÕI TRẠNG THÁI ĐĂNG NHẬP (USEAUTH)
// =====================================================================
const listeners = new Set<() => void>();

export function notifyAuthChange(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

export function useAuth() {
  const user = useSyncExternalStore<StoredUser | null>(
    subscribe,
    getUser,
    () => null,
  );

  const token = useSyncExternalStore<string | null>(
    subscribe,
    getAccessToken,
    () => null,
  );

  return {
    user,
    token,
    isAuthenticated: Boolean(token && user),
  };
}

// =====================================================================
// 4. CÁC HÀM GỌI API AUTH (REGISTER, LOGIN, LOGOUT, PROFILE)
// =====================================================================
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const data = await apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

  // Không tự động đăng nhập khi đăng ký thành công, để người dùng tự đăng nhập ở trang login
  return data;
}

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

export function logout(): void {
  clearAuth();
  notifyAuthChange();
}

export async function getProfile(): Promise<StoredUser> {
  const user = await apiClient<StoredUser>("/auth/me");
  if (user) {
    setUser(user);
    notifyAuthChange();
  }
  return user;
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ message: string; user: StoredUser }> {
  const data = await apiClient<{ message: string; user: StoredUser }>(
    "/auth/profile",
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );

  if (data?.user) {
    setUser(data.user);
    notifyAuthChange();
  }

  return data;
}
