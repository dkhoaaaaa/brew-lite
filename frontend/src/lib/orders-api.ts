import { apiClient } from "./api-client";

export interface CreateOrderItemInput {
  productId: string | number;
  productSizeId?: string | number;
  productName?: string;
  sizeCode?: string;
  sugarPercent?: number;
  icePercent?: number;
  note?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  note?: string;
  items?: CreateOrderItemInput[];
  total?: number;
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  userId: string;
  status: string;
  subtotal: string;
  total: string;
  pointsEarned: number;
  note?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
}

/**
 * Tạo đơn hàng mới (tự động đính kèm Authorization header chứa JWT token).
 * Route POST /orders được bảo vệ bởi JwtAuthGuard trên Backend.
 */
export async function createOrder(
  data: CreateOrderInput,
): Promise<OrderResponse> {
  return apiClient<OrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Lấy danh sách đơn hàng của người dùng hiện tại (tự động đính kèm Authorization header).
 */
export async function getMyOrders(): Promise<OrderResponse[]> {
  return apiClient<OrderResponse[]>("/orders/my");
}
