import { getAccessToken, getUser } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface OrderItemToppingPayload {
  toppingId: string;
  quantity?: number;
}

export interface OrderItemPayload {
  productId: string;
  productSizeId: string;
  quantity: number;
  sugarPercent?: number;
  icePercent?: number;
  note?: string;
  toppings?: OrderItemToppingPayload[];
}

export interface CreateOrderPayload {
  items: OrderItemPayload[];
  note?: string;
}

export interface CreatedOrderItem {
  id: string;
  productId: string;
  productName: string;
  sizeCode: string;
  sugarPercent?: number;
  icePercent?: number;
  note?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  toppings: Array<{
    toppingId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface OrderPayment {
  id: string;
  method: string;
  status: string;
  amount: number;
  transactionCode?: string | null;
  paidAt?: string | null;
}

export interface OrderStatusHistoryItem {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedAt: string | null;
  note: string | null;
}

export interface CreatedOrderResponse {
  id: string;
  orderCode: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  pointsEarned?: number;
  promotionId?: string | null;
  note?: string;
  expiresAt: string | null;
  createdAt: string;
  items: CreatedOrderItem[];
  payments?: OrderPayment[];
  statusHistory?: OrderStatusHistoryItem[];
}

export interface MockPaymentPayload {
  method: "E_WALLET" | "BANK_CARD";
  outcome: "success" | "failure";
  idempotencyKey?: string;
}

export interface MockPaymentApiResponse {
  outcome: "SIMULATED_SUCCESS" | "SIMULATED_FAILURE";
  orderId: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  message: string;
  pointsEarned?: number;
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

export async function createOrder(
  payload: CreateOrderPayload,
  userId?: string,
): Promise<CreatedOrderResponse> {
  const headers = getAuthHeaders() as Record<string, string>;
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Lỗi tạo đơn hàng (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.message) {
        errorMessage = Array.isArray(errorBody.message)
          ? errorBody.message.join("; ")
          : errorBody.message;
      }
    } catch {
      // Ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getMyOrders(status?: string): Promise<CreatedOrderResponse[]> {
  const query = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`${API_URL}/orders/my${query}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMessage = `Lỗi tải danh sách đơn hàng (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.message) {
        errorMessage = Array.isArray(errorBody.message)
          ? errorBody.message.join("; ")
          : errorBody.message;
      }
    } catch {
      // Ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getOrderById(orderId: string): Promise<CreatedOrderResponse> {
  const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMessage = `Lỗi tải thông tin đơn hàng (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.message) {
        errorMessage = Array.isArray(errorBody.message)
          ? errorBody.message.join("; ")
          : errorBody.message;
      }
    } catch {
      // Ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function executeMockPayment(
  orderId: string,
  payload: MockPaymentPayload,
): Promise<MockPaymentApiResponse> {
  const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}/mock-payment`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Lỗi thanh toán mô phỏng (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.message) {
        errorMessage = Array.isArray(errorBody.message)
          ? errorBody.message.join("; ")
          : errorBody.message;
      }
    } catch {
      // Ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function cancelOrder(orderId: string): Promise<CreatedOrderResponse> {
  const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMessage = `Lỗi hủy đơn hàng (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.message) {
        errorMessage = Array.isArray(errorBody.message)
          ? errorBody.message.join("; ")
          : errorBody.message;
      }
    } catch {
      // Ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function applyVoucherToOrder(orderId: string, code: string): Promise<CreatedOrderResponse> {
  const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}/apply-voucher`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    let errorMessage = "Không thể áp dụng mã khuyến mại.";
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.message) {
        errorMessage = Array.isArray(errorBody.message)
          ? errorBody.message.join("; ")
          : errorBody.message;
      }
    } catch {
      // Ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function removeVoucherFromOrder(orderId: string): Promise<CreatedOrderResponse> {
  const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}/remove-voucher`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let errorMessage = "Không thể hủy áp dụng mã khuyến mại.";
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.message) {
        errorMessage = Array.isArray(errorBody.message)
          ? errorBody.message.join("; ")
          : errorBody.message;
      }
    } catch {
      // Ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
