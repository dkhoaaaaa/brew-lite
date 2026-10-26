import { mergeCartItems, parseStoredCart, type CartLine } from "./cart-logic";

export const GUEST_CART_STORAGE_KEY = "brewlite-cart-v1";

export type CartStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function getCartStorageKey(userId: string | null): string {
  if (userId === null) return GUEST_CART_STORAGE_KEY;
  if (!userId.trim()) throw new Error("Không thể lưu giỏ hàng nếu thiếu ID tài khoản.");
  return `${GUEST_CART_STORAGE_KEY}:user:${encodeURIComponent(userId)}`;
}

export function loadCartForIdentity(
  storage: CartStorage,
  userId: string | null,
  createCartItemId: () => string,
): CartLine[] {
  const storageKey = getCartStorageKey(userId);
  const accountItems = parseStoredCart(storage.getItem(storageKey));
  if (userId === null) return accountItems;

  const guestItems = parseStoredCart(storage.getItem(GUEST_CART_STORAGE_KEY));
  if (guestItems.length === 0) return accountItems;

  const mergedItems = mergeCartItems(accountItems, guestItems, createCartItemId);
  if (mergedItems === null) {
    throw new Error("Không thể hợp nhất giỏ hàng an toàn. Giỏ khách vẫn được giữ nguyên.");
  }

  storage.setItem(storageKey, JSON.stringify(mergedItems));
  storage.removeItem(GUEST_CART_STORAGE_KEY);
  return mergedItems;
}

export function saveCartForIdentity(
  storage: CartStorage,
  userId: string | null,
  items: CartLine[],
): void {
  storage.setItem(getCartStorageKey(userId), JSON.stringify(items));
}
