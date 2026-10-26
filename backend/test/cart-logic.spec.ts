import { describe, expect, it } from "vitest";
import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateOrderDto } from "../src/modules/orders/dto/create-order.dto.js";
import {
  addCartItem,
  decreaseCartItem,
  getSafeCartTotals,
  increaseCartItem,
  isCartLine,
  mergeCartItems,
  parseStoredCart,
  removeCartItem,
  toCreateOrderPayload,
  type CartLine,
} from "../../frontend/src/features/cart/cart-logic.js";
import {
  GUEST_CART_STORAGE_KEY,
  getCartStorageKey,
  loadCartForIdentity,
  saveCartForIdentity,
  type CartStorage,
} from "../../frontend/src/features/cart/cart-storage.js";
import type { ConfiguredProduct } from "../../frontend/src/types/product.js";

const baseItem: ConfiguredProduct = {
  productId: "product-1",
  productName: "Test item",
  productImageUrl: null,
  size: { id: "size-1", sizeCode: "M", extraPrice: "5.00" },
  toppings: [{ id: "topping-1", name: "Topping", price: "1.25" }],
  unitPrice: "6.25",
  quantity: 1,
};

function cartLine(overrides: Partial<CartLine> = {}): CartLine {
  return { ...baseItem, cartItemId: "line-1", ...overrides };
}

class MemoryCartStorage implements CartStorage {
  private readonly values = new Map<string, string>();
  failWrites = false;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error("Storage write failed");
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("Task 5 cart logic", () => {
  it("restores valid lines and skips invalid lines independently", () => {
    const valid = cartLine();
    const invalid = cartLine({ cartItemId: "bad", quantity: 0 });

    expect(parseStoredCart(JSON.stringify([valid, invalid]))).toEqual([valid]);
  });

  it("returns an empty cart for malformed or non-array JSON", () => {
    expect(parseStoredCart("{" )).toEqual([]);
    expect(parseStoredCart(JSON.stringify({ item: cartLine() }))).toEqual([]);
    expect(parseStoredCart(null)).toEqual([]);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "2", Number.NaN])(
    "rejects invalid quantity %s",
    (quantity) => {
      expect(isCartLine(cartLine({ quantity: quantity as number }))).toBe(false);
    },
  );

  it.each(["-0.01", "1.001", "Infinity", "not-money", "90071992547409.92"])(
    "rejects unsafe price %s",
    (unitPrice) => {
      expect(isCartLine(cartLine({ unitPrice }))).toBe(false);
    },
  );
  it("rejects negative zero prices", () => {
    expect(isCartLine(cartLine({ unitPrice: "-0.00" }))).toBe(false);
  });

  it("rejects invalid nested size and topping values", () => {
    expect(isCartLine(cartLine({ size: null }))).toBe(false);
    expect(isCartLine(cartLine({ size: { ...baseItem.size!, id: "" } }))).toBe(false);
    expect(isCartLine(cartLine({ toppings: [null] as never }))).toBe(false);
    expect(isCartLine(cartLine({ toppings: [{ id: "t", name: "T", price: "-1" }] }))).toBe(false);
  });

  it("merges equal product, size, and topping IDs independent of topping order", () => {
    const first = cartLine({
      toppings: [
        { id: "a", name: "A", price: "1.00" },
        { id: "b", name: "B", price: "2.00" },
      ],
    });
    const next = {
      ...baseItem,
      toppings: [
        { id: "b", name: "B", price: "2.00" },
        { id: "a", name: "A", price: "1.00" },
      ],
    };

    expect(addCartItem([first], next, () => "unused")).toEqual([
      { ...first, quantity: 2 },
    ]);
  });

  it("keeps differing product, size, or topping configurations separate", () => {
    const first = cartLine();
    const differentProduct = { ...baseItem, productId: "product-2" };
    const differentSize = {
      ...baseItem,
      size: { id: "size-2", sizeCode: "L", extraPrice: "7.00" },
    };
    const differentTopping = {
      ...baseItem,
      toppings: [{ id: "topping-2", name: "Other", price: "1.00" }],
    };

    const result = [differentProduct, differentSize, differentTopping].reduce(
      (items, item, index) => addCartItem(items, item, () => `line-${index + 2}`),
      [first],
    );
    expect(result).toHaveLength(4);
  });

  it("merges duplicate configurations but keeps different sizes and toppings separate", () => {
    const accountLine = cartLine({ quantity: 2 });
    const sameConfiguration = { ...baseItem, quantity: 3 };
    const differentSize = {
      ...baseItem,
      size: { id: "size-2", sizeCode: "L", extraPrice: "7.00" },
    };
    const differentToppings = {
      ...baseItem,
      toppings: [{ id: "topping-2", name: "Other", price: "1.00" }],
    };
    let id = 0;

    const result = mergeCartItems(
      [accountLine],
      [
        { ...sameConfiguration, cartItemId: "guest-same" },
        { ...differentSize, cartItemId: "guest-size" },
        { ...differentToppings, cartItemId: "guest-topping" },
      ],
      () => `merged-${++id}`,
    );
    expect(result).toEqual([
      { ...accountLine, quantity: 5 },
      { ...differentSize, cartItemId: "merged-1" },
      { ...differentToppings, cartItemId: "merged-2" },
    ]);
  });

  it("persists a guest cart and restores it after a fresh load", () => {
    const storage = new MemoryCartStorage();
    const guestCart = addCartItem([], baseItem, () => "guest-line");
    saveCartForIdentity(storage, null, guestCart);

    expect(loadCartForIdentity(storage, null, () => "unused")).toEqual(guestCart);
    expect(loadCartForIdentity(storage, null, () => "unused")).toEqual(guestCart);
  });

  it("merges the guest cart into an account only after writing the merged cart", () => {
    const storage = new MemoryCartStorage();
    const guestLine = cartLine({ quantity: 2 });
    const accountLine = cartLine({ quantity: 3 });
    saveCartForIdentity(storage, null, [guestLine]);
    saveCartForIdentity(storage, "account-a", [accountLine]);

    expect(loadCartForIdentity(storage, "account-a", () => "unused")).toEqual([
      { ...accountLine, quantity: 5 },
    ]);
    expect(storage.getItem(GUEST_CART_STORAGE_KEY)).toBeNull();
  });

  it("isolates account carts from one another and keeps guest items through logout", () => {
    const storage = new MemoryCartStorage();
    const accountALine = cartLine({ productId: "account-a-product" });
    const accountBLine = cartLine({ productId: "account-b-product" });
    const guestLine = cartLine({ productId: "guest-product" });
    saveCartForIdentity(storage, "account-a", [accountALine]);
    saveCartForIdentity(storage, "account-b", [accountBLine]);
    saveCartForIdentity(storage, null, [guestLine]);

    expect(getCartStorageKey("account-a")).not.toBe(getCartStorageKey("account-b"));
    expect(loadCartForIdentity(storage, "account-b", () => "merged-guest")).toEqual([
      accountBLine,
      { ...guestLine, cartItemId: "merged-guest" },
    ]);
    expect(loadCartForIdentity(storage, null, () => "unused")).toEqual([]);
    expect(loadCartForIdentity(storage, "account-b", () => "unused")).toEqual([
      accountBLine,
      { ...guestLine, cartItemId: "merged-guest" },
    ]);
    expect(loadCartForIdentity(storage, "account-a", () => "unused")).toEqual([
      accountALine,
    ]);
  });

  it("does not remove guest data when writing the merged account cart fails", () => {
    const storage = new MemoryCartStorage();
    saveCartForIdentity(storage, null, [cartLine()]);
    storage.failWrites = true;

    expect(() =>
      loadCartForIdentity(storage, "account-a", () => "account-line"),
    ).toThrow("Storage write failed");
    expect(storage.getItem(GUEST_CART_STORAGE_KEY)).not.toBeNull();
  });

  it("maps the selected API size ID to productSizeId without inferring from its label", () => {
    const line = cartLine({
      productId: "12",
      size: { id: "987", sizeCode: "L", extraPrice: "7.00" },
      toppings: [{ id: "45", name: "Topping", price: "1.25" }],
    });

    expect(toCreateOrderPayload([line])).toEqual({
      items: [
        {
          productId: "12",
          productSizeId: "987",
          quantity: 1,
          toppings: [{ toppingId: "45", quantity: 1 }],
        },
      ],
    });
  });

  it("produces a payload accepted by the current CreateOrderDto", async () => {
    const line = cartLine({
      productId: "12",
      size: { id: "987", sizeCode: "L", extraPrice: "7.00" },
      toppings: [{ id: "45", name: "Topping", price: "1.25" }],
    });
    const payload = toCreateOrderPayload([line]);

    expect(await validate(plainToInstance(CreateOrderDto, payload))).toHaveLength(0);
  });

  it("does not build an order item when the selected size is missing", () => {
    expect(() => toCreateOrderPayload([cartLine({ size: null })])).toThrow(
      "Every cart item must have a valid API size before checkout.",
    );
  });

  it("increments, clamps decrements to one, and removes lines", () => {
    const first = cartLine();
    expect(increaseCartItem([first], first.cartItemId)[0].quantity).toBe(2);
    expect(decreaseCartItem([first], first.cartItemId)[0].quantity).toBe(1);
    expect(decreaseCartItem([{ ...first, quantity: 2 }], first.cartItemId)[0].quantity).toBe(1);
    expect(removeCartItem([first], first.cartItemId)).toEqual([]);
  });

  it("rejects additions and increases that overflow safe aggregate totals", () => {
    const expensive = cartLine({ unitPrice: "90071992547409.91" });
    expect(getSafeCartTotals([expensive])).not.toBeNull();
    expect(getSafeCartTotals([{ ...expensive, quantity: 2 }])).toBeNull();
    expect(addCartItem([], { ...baseItem, ...expensive, quantity: 2 }, () => "new")).toEqual([]);
    expect(increaseCartItem([expensive], expensive.cartItemId)).toEqual([expensive]);

    const safeLine = cartLine({ unitPrice: "50000000000000.00" });
    expect(getSafeCartTotals([safeLine, { ...safeLine, cartItemId: "line-2" }])).toBeNull();
  });
});