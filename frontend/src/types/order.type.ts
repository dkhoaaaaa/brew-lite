export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  userId?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'QR_CODE' | 'CASH';
  qrCodeUrl?: string; // Link ảnh QR code thanh toán (nếu có)
  createdAt: string;
}

export interface CreateOrderDto {
  items: {
    productId: string;
    quantity: number;
    note?: string;
  }[];
  paymentMethod: 'QR_CODE' | 'CASH';
}