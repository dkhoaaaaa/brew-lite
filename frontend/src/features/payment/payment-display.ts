import type { CreatedOrderResponse } from "../../lib/orders-api";

export function getOrderStatusLabel(status: unknown): string {
  switch (status) {
    case "PENDING": return "Chờ thanh toán";
    case "PAID": return "Thành công";
    case "PAYMENT_FAILED": return "Thất bại";
    case "CANCELLED": return "Đã hủy";
    default: return "Chưa xác định";
  }
}

export function getPaymentStatusLabel(order: CreatedOrderResponse): string {
  if (order.status === "PAID") return "Thành công";
  if (order.status === "PAYMENT_FAILED") return "Thất bại";
  if (order.status === "CANCELLED") return "Đã hủy";

  const status = order.payments?.[0]?.status;
  if (status === "PENDING") return "Chờ VNPay xác nhận";
  if (status === "SUCCESS") return "Thành công";
  if (status === "FAILED") return "Thất bại";
  if (status === "CANCELLED") return "Đã hủy";
  return "Chờ thanh toán";
}

export function getDisplayText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  if (!normalized || normalized === "null" || normalized === "undefined") {
    return fallback;
  }
  return normalized;
}

export function shouldClearCartAfterPayment(status: unknown): boolean {
  return status === "PAID";
}
