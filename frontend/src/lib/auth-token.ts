const TOKEN_KEY = "brewlite_access_token";
const USER_KEY = "brewlite_user";

export interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  loyaltyPoints?: number;
}

let cachedUserRaw: string | null = null;
let cachedUser: StoredUser | null = null;

let cachedToken: string | null = null;

/**
 * Lấy Access Token đã lưu trong localStorage (hoặc null nếu chạy trên server / chưa có).
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token !== cachedToken) {
    cachedToken = token;
  }
  return cachedToken;
}

/**
 * Lưu Access Token vào localStorage.
 */
export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  cachedToken = token;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Xóa Access Token khỏi localStorage.
 */
export function removeAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  cachedToken = null;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Lấy thông tin user đã lưu trong localStorage (có cache reference để tương thích với useSyncExternalStore).
 */
export function getUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const data = localStorage.getItem(USER_KEY);
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

/**
 * Lưu thông tin user vào localStorage.
 */
export function setUser(user: StoredUser): void {
  if (typeof window === "undefined") {
    return;
  }
  const str = JSON.stringify(user);
  cachedUserRaw = str;
  cachedUser = user;
  localStorage.setItem(USER_KEY, str);
}

/**
 * Xóa thông tin user khỏi localStorage.
 */
export function removeUser(): void {
  if (typeof window === "undefined") {
    return;
  }
  cachedUserRaw = null;
  cachedUser = null;
  localStorage.removeItem(USER_KEY);
}

/**
 * Đăng xuất và xóa sạch thông tin xác thực.
 */
export function clearAuth(): void {
  removeAccessToken();
  removeUser();
}
