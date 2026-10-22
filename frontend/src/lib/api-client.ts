import { getAccessToken } from "./auth";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status?: number;
  code?: string;
  url?: string;

  constructor(message: string, status?: number, code?: string, url?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.url = url;
  }
}

/**
 * Hàm hỗ trợ trích xuất thông điệp lỗi rõ ràng từ bất kỳ đối tượng lỗi nào.
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("fetch failed") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Network request failed") ||
      error instanceof TypeError
    ) {
      return `Không thể kết nối đến máy chủ backend tại ${API_URL}. Vui lòng kiểm tra xem server backend đã được khởi động chưa (cổng 3001) hoặc kiểm tra kết nối mạng.`;
    }
    return error.message;
  }
  return typeof error === "string" ? error : "Đã xảy ra lỗi không xác định.";
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const targetUrl = `${API_URL}${path}`;

  // Khởi tạo Headers và tự động đính kèm Header Authorization nếu đã có token
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Tự động đính kèm Header Authorization nếu có token và chưa được cấu hình thủ công
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(targetUrl, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const originalMessage = err instanceof Error ? err.message : String(err);

    // Bắt lỗi không kết nối được mạng hoặc backend chưa bật thay vì báo generic "Failed to fetch"
    if (
      originalMessage.includes("Failed to fetch") ||
      originalMessage.includes("fetch failed") ||
      originalMessage.includes("NetworkError") ||
      originalMessage.includes("Network request failed") ||
      err instanceof TypeError
    ) {
      throw new ApiError(
        `Không thể kết nối đến máy chủ backend tại ${API_URL}. Vui lòng kiểm tra xem server backend đã được khởi động chưa (cổng 3001) hoặc kiểm tra kết nối mạng.`,
        0,
        "NETWORK_ERROR",
        targetUrl,
      );
    }

    throw new ApiError(
      `Lỗi kết nối khi gửi yêu cầu tới ${targetUrl}: ${originalMessage}`,
      0,
      "FETCH_ERROR",
      targetUrl,
    );
  }

  if (!response.ok) {
    let errorMessage = "";
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.message)) {
        errorMessage = errorData.message.join(", ");
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Body không phải định dạng JSON
    }

    if (!errorMessage) {
      switch (response.status) {
        case 400:
          errorMessage = "Dữ liệu yêu cầu không hợp lệ (400 Bad Request)";
          break;
        case 401:
          errorMessage =
            "Chưa xác thực hoặc token không hợp lệ / đã hết hạn (401 Unauthorized)";
          break;
        case 403:
          errorMessage =
            "Bạn không có quyền truy cập tài nguyên này (403 Forbidden)";
          break;
        case 404:
          errorMessage = `Không tìm thấy tài nguyên yêu cầu tại ${path} (404 Not Found)`;
          break;
        case 409:
          errorMessage = "Dữ liệu bị trùng lặp hoặc xung đột (409 Conflict)";
          break;
        case 500:
          errorMessage =
            "Lỗi xử lý nội bộ từ máy chủ backend (500 Internal Server Error)";
          break;
        case 502:
          errorMessage = "Cổng kết nối backend gặp sự cố (502 Bad Gateway)";
          break;
        case 503:
          errorMessage =
            "Dịch vụ backend hiện đang tạm ngưng phục vụ (503 Service Unavailable)";
          break;
        default:
          errorMessage = `Máy chủ backend phản hồi lỗi HTTP ${response.status} (${response.statusText || "Lỗi không xác định"})`;
      }
    }

    throw new ApiError(
      errorMessage,
      response.status,
      `HTTP_${response.status}`,
      targetUrl,
    );
  }

  return response.json() as Promise<T>;
}