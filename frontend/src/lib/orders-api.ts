import { getAccessToken, getUser } from "./auth";
import { ApiError } from "./api-client";

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
  note?: string | null;
  toppings?: OrderItemToppingPayload[];
}

export interface CreateOrderPayload {
  items: OrderItemPayload[];
  note?: string | null;
}

export interface CreatedOrderItem {
  id: string;
  productId: string;
  productName: string;
  sizeCode: string | null;
  sugarPercent?: number | null;
  icePercent?: number | null;
  note?: string | null;
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
  note?: string | null;
  expiresAt: string | null;
  createdAt: string;
  items: CreatedOrderItem[];
  payments?: OrderPayment[];
  statusHistory?: OrderStatusHistoryItem[];
}

export interface CreateVnpayPaymentPayload {
  orderId: string;
  idempotencyKey: string;
  paymentChannel: VnpayPaymentChannel;
}

export type VnpayPaymentChannel = "VNBANK" | "INTCARD" | "VNPAYQR";

export interface VnpayPaymentResponse {
  orderId: string;
  checkoutUrl: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCreatedOrderResponse(value: unknown): value is CreatedOrderResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.orderCode === "string" &&
    typeof value.status === "string" &&
    typeof value.subtotal === "number" &&
    Number.isFinite(value.subtotal) &&
    typeof value.discountAmount === "number" &&
    Number.isFinite(value.discountAmount) &&
    typeof value.total === "number" &&
    Number.isFinite(value.total) &&
    (value.expiresAt === null ||
      (typeof value.expiresAt === "string" && Number.isFinite(Date.parse(value.expiresAt)))) &&
    typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    Array.isArray(value.items) &&
    value.items.every(isCreatedOrderItem) &&
    (value.payments === undefined ||
      (Array.isArray(value.payments) && value.payments.every(isOrderPayment)))
  );
}

function isOrderPayment(value: unknown): value is OrderPayment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.method === "string" &&
    typeof value.status === "string" &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount)
  );
}

function isCreatedOrderItem(value: unknown): value is CreatedOrderItem {
  if (!isRecord(value)) return false;
  const percentValues = [0, 30, 50, 70, 100];
  return (
    typeof value.id === "string" &&
    typeof value.productId === "string" &&
    typeof value.productName === "string" &&
    (typeof value.sizeCode === "string" || value.sizeCode === null) &&
    (value.sugarPercent === undefined ||
      value.sugarPercent === null ||
      (typeof value.sugarPercent === "number" && percentValues.includes(value.sugarPercent))) &&
    (value.icePercent === undefined ||
      value.icePercent === null ||
      (typeof value.icePercent === "number" && percentValues.includes(value.icePercent))) &&
    typeof value.quantity === "number" &&
    Number.isSafeInteger(value.quantity) &&
    typeof value.unitPrice === "number" &&
    Number.isFinite(value.unitPrice) &&
    typeof value.lineTotal === "number" &&
    Number.isFinite(value.lineTotal) &&
    Array.isArray(value.toppings) &&
    value.toppings.every(
      (topping) =>
        isRecord(topping) &&
        typeof topping.toppingId === "string" &&
        typeof topping.name === "string" &&
        typeof topping.price === "number" &&
        Number.isFinite(topping.price) &&
        typeof topping.quantity === "number" &&
        Number.isSafeInteger(topping.quantity),
    )
  );
}

function parseCreatedOrderResponse(value: unknown): CreatedOrderResponse {
  if (!isCreatedOrderResponse(value)) {
    throw new Error("Backend trả về thông tin đơn hàng không hợp lệ.");
  }
  return value;
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

  return parseCreatedOrderResponse(await response.json());
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

  const result: unknown = await response.json();
  if (!Array.isArray(result)) {
    throw new Error("Backend trả về danh sách đơn hàng không hợp lệ.");
  }
  return result.map(parseCreatedOrderResponse);
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
    if (response.status === 404) throw new ApiError(errorMessage, response.status);
    throw new Error(errorMessage);
  }

  return parseCreatedOrderResponse(await response.json());
}

export async function createVnpayPayment(
  payload: CreateVnpayPaymentPayload,
): Promise<VnpayPaymentResponse> {
  const response = await fetch(`${API_URL}/payments/vnpay`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Lỗi khởi tạo thanh toán VNPay (${response.status})`;
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

  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    !("orderId" in result) ||
    result.orderId !== payload.orderId ||
    !("checkoutUrl" in result) ||
    typeof result.checkoutUrl !== "string"
  ) {
    throw new Error("Backend trả về thông tin thanh toán VNPay không hợp lệ.");
  }
  const checkoutUrl = new URL(result.checkoutUrl);
  if (
    checkoutUrl.protocol !== "https:" ||
    checkoutUrl.hostname !== "sandbox.vnpayment.vn"
  ) {
    throw new Error("Backend trả về địa chỉ cổng thanh toán không an toàn.");
  }
  return { orderId: result.orderId, checkoutUrl: checkoutUrl.toString() };
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
