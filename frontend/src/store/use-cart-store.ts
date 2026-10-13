import { create } from 'zustand';
import { Product } from '@/types/product.type';

export interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, note?: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (product, quantity = 1, note) =>
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += quantity;
        return { items: newItems };
      }
      return { items: [...state.items, { product, quantity, note }] };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),
  clearCart: () => set({ items: [] }),
}));