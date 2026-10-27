import { toMinorUnits } from "../../lib/money";
import type { CreateOrderPayload } from "../../lib/orders-api";
import type { ConfiguredProduct, ProductSizeOption, ToppingOption } from "../../types/product";

export type CartLine = ConfiguredProduct & {
  cartItemId: string;
};

export type CartTotals = {
  itemCount: number;
  totalMinorUnits: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSafeMinorUnits(value: unknown): number | null {
  if (typeof value !== "string") return null;
  if (value.trim().startsWith("-")) return null;
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

export function isCartLine(value: unknown): value is CartLine {
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
    isProductSizeOption(value.size) &&
    Array.isArray(value.toppings) &&
    value.toppings.every(isToppingOption) &&
    new Set(value.toppings.map((topping) => topping.id)).size === value.toppings.length
  );
}

export function getSafeCartTotals(items: CartLine[]): CartTotals | null {
  let itemCount = 0;
  let totalMinorUnits = 0;

  for (const item of items) {
    if (!isCartLine(item)) return null;
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

export function parseStoredCart(serialized: string | null): CartLine[] {
  if (!serialized) return [];

  try {
    const parsed: unknown = JSON.parse(serialized);
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

export function addCartItem(
  current: CartLine[],
  item: ConfiguredProduct,
  createCartItemId: () => string,
): CartLine[] {
  if (!isCartLine({ ...item, cartItemId: "pending" })) return current;

  const existing = current.find((line) => sameConfiguration(line, item));
  const nextItems = existing
    ? current.map((line) =>
        line.cartItemId === existing.cartItemId
          ? { ...line, quantity: line.quantity + item.quantity }
          : line,
      )
    : [...current, { ...item, cartItemId: createCartItemId() }];

  return getSafeCartTotals(nextItems) === null ? current : nextItems;
}

export function mergeCartItems(
  current: CartLine[],
  incoming: CartLine[],
  createCartItemId: () => string,
): CartLine[] | null {
  let merged = current;

  for (const item of incoming) {
    if (!isCartLine(item)) return null;

    const existing = merged.find((line) => sameConfiguration(line, item));
    const next = addCartItem(merged, item, createCartItemId);
    if (existing) {
      const updated = next.find((line) => line.cartItemId === existing.cartItemId);
      if (updated?.quantity !== existing.quantity + item.quantity) return null;
    } else if (next.length !== merged.length + 1) {
      return null;
    }
    merged = next;
  }

  return merged;
}

export function increaseCartItem(current: CartLine[], cartItemId: string): CartLine[] {
  const nextItems = current.map((line) =>
    line.cartItemId === cartItemId
      ? { ...line, quantity: line.quantity + 1 }
      : line,
  );
  return getSafeCartTotals(nextItems) === null ? current : nextItems;
}

export function decreaseCartItem(current: CartLine[], cartItemId: string): CartLine[] {
  return current.map((line) =>
    line.cartItemId === cartItemId
      ? { ...line, quantity: Math.max(1, line.quantity - 1) }
      : line,
  );
}

export function removeCartItem(current: CartLine[], cartItemId: string): CartLine[] {
  return current.filter((line) => line.cartItemId !== cartItemId);
}

export function toCreateOrderPayload(items: CartLine[]): CreateOrderPayload {
  return {
    items: items.map((item) => {
      if (!isCartLine(item) || !item.size) {
        throw new Error("Every cart item must have a valid API size before checkout.");
      }

      return {
        productId: item.productId,
        productSizeId: item.size.id,
        quantity: item.quantity,
        toppings: item.toppings.map((topping) => ({
          toppingId: topping.id,
          quantity: 1,
        })),
      };
    }),
  };
}