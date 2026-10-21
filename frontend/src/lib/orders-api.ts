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

export interface CreatedOrderResponse {
  id: string;
  orderCode: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  note?: string;
  expiresAt: string;
  createdAt: string;
  items: CreatedOrderItem[];
}

export async function createOrder(
  payload: CreateOrderPayload,
  userId: string = "1"
): Promise<CreatedOrderResponse> {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId, 
    },
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
    }
    throw new Error(errorMessage);
  }

  return response.json();
}