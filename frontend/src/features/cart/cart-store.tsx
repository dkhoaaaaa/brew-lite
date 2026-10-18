"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toMinorUnits } from "../../lib/money";
import type {
  ConfiguredProduct,
  ProductSizeOption,
  ToppingOption,
} from "../../types/product";

const STORAGE_KEY = "brewlite-cart-v1";

export type CartLine = ConfiguredProduct & {
  cartItemId: string;
};

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSafeMinorUnits(value: unknown): number | null {
  if (typeof value !== "string") return null;
  try {
    const minorUnits = toMinorUnits(value);
    return Number.isSafeInteger(minorUnits) && minorUnits >= 0
      ? minorUnits
      : null;
  } catch {
    return null;
  }
}

function isValidStoredPrice(value: unknown): value is string {
  return getSafeMinorUnits(value) !== null;
}

function isProductSizeOption(value: unknown): value is ProductSizeOption {
  return (
    isRecord(value) &&
    typeof value.id === "string" && value.id.trim().length > 0 &&
    typeof value.sizeCode === "string" && value.sizeCode.trim().length > 0 &&
    isValidStoredPrice(value.extraPrice)
  );
}

function isToppingOption(value: unknown): value is ToppingOption {
  return (
    isRecord(value) &&
    typeof value.id === "string" && value.id.trim().length > 0 &&
    typeof value.name === "string" && value.name.trim().length > 0 &&
    isValidStoredPrice(value.price)
  );
}

function isCartLine(value: unknown): value is CartLine {
  if (!isRecord(value)) return false;
  return (
    typeof value.cartItemId === "string" && value.cartItemId.trim().length > 0 &&
    typeof value.productId === "string" && value.productId.trim().length > 0 &&
    typeof value.productName === "string" && value.productName.trim().length > 0 &&
    (typeof value.productImageUrl === "string" || value.productImageUrl === null) &&
    isValidStoredPrice(value.unitPrice) &&
    typeof value.quantity === "number" &&
    Number.isSafeInteger(value.quantity) &&
    value.quantity > 0 &&
    (value.size === null || isProductSizeOption(value.size)) &&
    Array.isArray(value.toppings) &&
    value.toppings.every(isToppingOption)
  );
}

function getSafeCartTotals(
  items: CartLine[],
): { itemCount: number; totalMinorUnits: number } | null {
  let itemCount = 0;
  let totalMinorUnits = 0;

  for (const item of items) {
    const unitPriceMinorUnits = getSafeMinorUnits(item.unitPrice);
    if (unitPriceMinorUnits === null) return null;

    const lineTotal = unitPriceMinorUnits * item.quantity;
    if (!Number.isSafeInteger(lineTotal)) return null;

    itemCount += item.quantity;
    totalMinorUnits += lineTotal;
    if (!Number.isSafeInteger(itemCount) || !Number.isSafeInteger(totalMinorUnits)) {
      return null;
    }
  }

  return { itemCount, totalMinorUnits };
}

function readStoredCart(): CartLine[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    const validItems: CartLine[] = [];
    for (const item of parsed) {
      if (!isCartLine(item)) continue;
      const nextItems = [...validItems, item];
      if (getSafeCartTotals(nextItems) !== null) validItems.push(item);
    }
    return validItems;
  } catch {
    return [];
  }
}

function sameConfiguration(first: CartLine, second: ConfiguredProduct): boolean {
  if (first.productId !== second.productId || first.size?.id !== second.size?.id) {
    return false;
  }
  const firstToppings = first.toppings.map((topping) => topping.id).sort();
  const secondToppings = second.toppings.map((topping) => topping.id).sort();
  return (
    firstToppings.length === secondToppings.length &&
    firstToppings.every((id, index) => id === secondToppings[index])
  );
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
    setItems((current) => {
      if (!isCartLine({ ...item, cartItemId: "pending" })) return current;

      const existing = current.find((line) => sameConfiguration(line, item));
      let nextItems: CartLine[];
      if (existing) {
        nextItems = current.map((line) =>
          line.cartItemId === existing.cartItemId
            ? { ...line, quantity: line.quantity + item.quantity }
            : line,
        );
      } else {
        nextItems = [...current, { ...item, cartItemId: crypto.randomUUID() }];
      }
      return getSafeCartTotals(nextItems) === null ? current : nextItems;
    });
  }

  function increaseItem(cartItemId: string) {
    setItems((current) => {
      const nextItems = current.map((line) =>
        line.cartItemId === cartItemId
          ? { ...line, quantity: line.quantity + 1 }
          : line,
      );
      return getSafeCartTotals(nextItems) === null ? current : nextItems;
    });
  }

  function decreaseItem(cartItemId: string) {
    setItems((current) =>
      current.map((line) =>
        line.cartItemId === cartItemId
          ? { ...line, quantity: Math.max(1, line.quantity - 1) }
          : line,
      ),
    );
  }

  function removeItem(cartItemId: string) {
    setItems((current) => current.filter((line) => line.cartItemId !== cartItemId));
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