"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ConfiguredProduct } from "../../types/product";
import {
  addCartItem,
  decreaseCartItem,
  getSafeCartTotals,
  increaseCartItem,
  parseStoredCart,
  removeCartItem,
  type CartLine,
} from "./cart-logic";

export type { CartLine } from "./cart-logic";

const STORAGE_KEY = "brewlite-cart-v1";

type CartContextValue = {
  items: CartLine[];
  hydrated: boolean;
  itemCount: number;
  totalMinorUnits: number;
  addItem: (item: ConfiguredProduct) => void;
  increaseItem: (cartItemId: string) => void;
  decreaseItem: (cartItemId: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartLine[] {
  try {
    return parseStoredCart(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setItems(readStoredCart());
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Keep the in-memory cart usable when browser storage is unavailable.
    }
  }, [hydrated, items]);

  function addItem(item: ConfiguredProduct) {
    setItems((current) =>
      addCartItem(current, item, () => crypto.randomUUID()),
    );
  }

  function increaseItem(cartItemId: string) {
    setItems((current) => increaseCartItem(current, cartItemId));
  }

  function decreaseItem(cartItemId: string) {
    setItems((current) => decreaseCartItem(current, cartItemId));
  }

  function removeItem(cartItemId: string) {
    setItems((current) => removeCartItem(current, cartItemId));
  }

  function clearCart() {
    setItems([]);
  }

  const totals = getSafeCartTotals(items) ?? { itemCount: 0, totalMinorUnits: 0 };
  const { itemCount, totalMinorUnits } = totals;

  return (
    <CartContext.Provider
      value={{
        items,
        hydrated,
        itemCount,
        totalMinorUnits,
        addItem,
        increaseItem,
        decreaseItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider.");
  return value;
}