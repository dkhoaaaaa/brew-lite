"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ConfiguredProduct } from "../../types/product";
import {
  addCartItem,
  decreaseCartItem,
  getSafeCartTotals,
  increaseCartItem,
  removeCartItem,
  type CartLine,
} from "./cart-logic";
import {
  loadCartForIdentity,
  saveCartForIdentity,
} from "./cart-storage";
import { getAccessToken, getUser, useAuth } from "../../lib/auth";

export type { CartLine } from "./cart-logic";

type CartSession = {
  userId: string | null | undefined;
  items: CartLine[];
};

type CartContextValue = {
  items: CartLine[];
  hydrated: boolean;
  storageError: string | null;
  itemCount: number;
  totalMinorUnits: number;
  addItem: (item: ConfiguredProduct) => void;
  increaseItem: (cartItemId: string) => void;
  decreaseItem: (cartItemId: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function getCurrentUserId(): string | null | undefined {
  const token = getAccessToken();
  const user = getUser();
  if (!token) return null;
  return typeof user?.id === "string" && user.id.trim()
    ? user.id
    : undefined;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const userId = token
    ? typeof user?.id === "string" && user.id.trim()
      ? user.id
      : undefined
    : null;
  const [session, setSession] = useState<CartSession>({
    userId: undefined,
    items: [],
  });
  const sessionRef = useRef(session);
  const failedHydrationForRef = useRef<string | null | undefined>(undefined);
  const [storageIssue, setStorageIssue] = useState<{
    userId: string | null;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (userId === undefined) return;
    sessionRef.current = { userId: undefined, items: [] };
    failedHydrationForRef.current = undefined;
    let active = true;
    queueMicrotask(() => {
      if (!active || getCurrentUserId() !== userId) return;
      setStorageIssue(null);
      try {
        const items = loadCartForIdentity(
          window.localStorage,
          userId,
          () => crypto.randomUUID(),
        );
        const nextSession = { userId, items };
        sessionRef.current = nextSession;
        setSession(nextSession);
        failedHydrationForRef.current = undefined;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể khôi phục giỏ hàng từ bộ nhớ trình duyệt.";
        const nextSession = { userId, items: [] };
        sessionRef.current = nextSession;
        setSession(nextSession);
        failedHydrationForRef.current = userId;
        setStorageIssue({ userId, message });
      }
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const hydrated = userId !== undefined && session.userId === userId;
  const items = hydrated ? session.items : [];

  function updateItems(update: (current: CartLine[]) => CartLine[]) {
    if (userId === undefined || getCurrentUserId() !== userId) return;

    if (
      sessionRef.current.userId !== userId ||
      failedHydrationForRef.current === userId
    ) {
      try {
        const currentItems = loadCartForIdentity(
          window.localStorage,
          userId,
          () => crypto.randomUUID(),
        );
        const currentSession = { userId, items: currentItems };
        sessionRef.current = currentSession;
        setSession(currentSession);
        failedHydrationForRef.current = undefined;
        setStorageIssue(null);
      } catch (error) {
        failedHydrationForRef.current = userId;
        setStorageIssue({
          userId,
          message:
            error instanceof Error
              ? error.message
              : "Không thể khôi phục giỏ hàng từ bộ nhớ trình duyệt.",
        });
        return;
      }
    }

    const nextItems = update(sessionRef.current.items);
    const nextSession = { userId, items: nextItems };
    sessionRef.current = nextSession;
    setSession(nextSession);
    try {
      saveCartForIdentity(window.localStorage, userId, nextItems);
      setStorageIssue(null);
    } catch (error) {
      setStorageIssue({
        userId,
        message:
          error instanceof Error
            ? `Giỏ hàng hiện chỉ còn trong phiên này: ${error.message}`
            : "Giỏ hàng hiện chỉ còn trong phiên này vì không thể ghi bộ nhớ trình duyệt.",
      });
    }
  }

  function addItem(item: ConfiguredProduct) {
    updateItems((current) =>
      addCartItem(current, item, () => crypto.randomUUID()),
    );
  }

  function increaseItem(cartItemId: string) {
    updateItems((current) => increaseCartItem(current, cartItemId));
  }

  function decreaseItem(cartItemId: string) {
    updateItems((current) => decreaseCartItem(current, cartItemId));
  }

  function removeItem(cartItemId: string) {
    updateItems((current) => removeCartItem(current, cartItemId));
  }

  function clearCart() {
    updateItems(() => []);
  }

  const totals = getSafeCartTotals(items) ?? { itemCount: 0, totalMinorUnits: 0 };
  const { itemCount, totalMinorUnits } = totals;

  return (
    <CartContext.Provider
      value={{
        items,
        hydrated,
        storageError:
          storageIssue && storageIssue.userId === userId
            ? storageIssue.message
            : null,
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