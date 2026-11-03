import { describe, expect, it, vi } from "vitest";
import {
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { OrdersService } from "../src/modules/orders/orders.service.js";
import type { CreateOrderDto } from "../src/modules/orders/dto/create-order.dto.js";

const money = (value: number) => ({ toNumber: () => value, toString: () => value.toString() });

describe("TASK 10 - Kiểm soát tồn kho nguyên liệu khi đặt hàng đồng thời", () => {
  /**
   * Helper tạo mock Prisma với kho nguyên liệu và công thức sản phẩm thực tế
   */
  function createPrismaMock(initialIngredients: Array<{
    id: bigint;
    name: string;
    unit: string;
    stockQuantity: number;
    version: number;
    isActive: boolean;
  }>, recipes: Array<{
    productId: bigint;
    ingredientId: bigint;
    quantity: number;
  }>) {
    // Lưu trữ state trong bộ nhớ giả lập database
    const ingredientStore = new Map(
      initialIngredients.map((ing) => [
        ing.id.toString(),
        { ...ing },
      ]),
    );

    const ordersStore: any[] = [];
    const paymentsStore: any[] = [];

    const prismaMock = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 1n, isActive: true }),
        findUnique: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 0 }),
        update: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 100 }),
      },
      product: {
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          return [
            { id: 1n, name: "Cà phê sữa", price: money(30000), stock: 99, version: 0, isActive: true },
            { id: 2n, name: "Bạc xỉu", price: money(35000), stock: 99, version: 0, isActive: true },
            { id: 3n, name: "Trà sữa", price: money(32000), stock: 99, version: 0, isActive: true },
          ].filter((p) => where?.id?.in?.includes(p.id));
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({ id: 1n }),
      },
      productSize: {
        findMany: vi.fn().mockImplementation(async () => [
          { id: 10n, productId: 1n, sizeCode: "M", extraPrice: money(0), isActive: true },
          { id: 20n, productId: 2n, sizeCode: "M", extraPrice: money(0), isActive: true },
          { id: 30n, productId: 3n, sizeCode: "M", extraPrice: money(0), isActive: true },
        ]),
      },
      productTopping: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      productRecipe: {
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          return recipes
            .filter((r) => where?.productId?.in?.includes(r.productId))
            .map((r) => {
              const ing = ingredientStore.get(r.ingredientId.toString())!;
              return {
                ...r,
                quantity: r.quantity,
                ingredient: { ...ing },
              };
            });
        }),
      },
      ingredient: {
        findMany: vi.fn().mockImplementation(async () => Array.from(ingredientStore.values())),
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          return ingredientStore.get(where.id.toString()) ?? null;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }) => {
          const ing = ingredientStore.get(where.id.toString());
          if (!ing) throw new Error("Ingredient not found");
          if (data.stockQuantity?.increment !== undefined) {
            ing.stockQuantity += Number(data.stockQuantity.increment);
          }
          if (data.version?.increment !== undefined) {
            ing.version += data.version.increment;
          }
          return { ...ing };
        }),
        // Optimistic locking updateMany
        updateMany: vi.fn().mockImplementation(async ({ where, data }) => {
          const ing = ingredientStore.get(where.id.toString());
          if (!ing) return { count: 0 };

          // Kiểm tra version và điều kiện tồn kho >= reqQty
          const minStockRequired = where.stockQuantity?.gte ?? 0;
          if (ing.version === where.version && ing.stockQuantity >= minStockRequired) {
            const dec = data.stockQuantity?.decrement ?? 0;
            ing.stockQuantity -= Number(dec);
            ing.version += data.version?.increment ?? 1;
            return { count: 1 };
          }
          return { count: 0 };
        }),
      },
      order: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const createdOrder = {
            id: BigInt(ordersStore.length + 1),
            orderCode: data.orderCode,
            userId: data.userId,
            status: data.status,
            subtotal: money(data.subtotal),
            discountAmount: money(data.discountAmount),
            total: money(data.total),
            expiresAt: data.expiresAt,
            createdAt: new Date(),
            orderItems: (data.orderItems?.create || []).map((item: any, idx: number) => ({
              id: BigInt(idx + 1),
              ...item,
              toppings: [],
            })),
            statusHistory: [],
            payments: [],
          };
          ordersStore.push(createdOrder);
          return createdOrder;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          return ordersStore.find((o) => o.id === where.id) ?? null;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }) => {
          const o = ordersStore.find((ord) => ord.id === where.id);
          if (o) {
            Object.assign(o, data);
            return o;
          }
          return null;
        }),
      },
      payment: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const p = { id: BigInt(paymentsStore.length + 1), ...data };
          paymentsStore.push(p);
          return p;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          if (where.idempotencyKey) {
            const p = paymentsStore.find((pay) => pay.idempotencyKey === where.idempotencyKey);
            if (p) {
              const order = ordersStore.find((ord) => ord.id === p.orderId);
              return { ...p, order };
            }
          }
          return null;
        }),
      },
      orderStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 1n }),
      },
      $transaction: vi.fn().mockImplementation(async (callbackOrArr: any) => {
        if (typeof callbackOrArr === "function") {
          return callbackOrArr(prismaMock);
        }
        return Promise.all(callbackOrArr);
      }),
    };

    return { prismaMock, ingredientStore, ordersStore, paymentsStore };
  }

  // ---------------------------------------------------------------------------
  // Test 1 – Đủ nguyên liệu
  // ---------------------------------------------------------------------------
  it("Test 1: Đủ nguyên liệu - kho đủ pha 3 ly, khách đặt 2 ly -> thành công và trừ đúng 2 ly", async () => {
    // 1 ly Cà phê sữa cần: 20g Bột cà phê (id: 1), 150ml Sữa (id: 2)
    // Kho hiện tại: 60g cà phê (đủ 3 ly), 450ml sữa (đủ 3 ly)
    const { prismaMock, ingredientStore } = createPrismaMock(
      [
        { id: 1n, name: "Bột cà phê", unit: "g", stockQuantity: 60, version: 0, isActive: true },
        { id: 2n, name: "Sữa", unit: "ml", stockQuantity: 450, version: 0, isActive: true },
      ],
      [
        { productId: 1n, ingredientId: 1n, quantity: 20 },
        { productId: 1n, ingredientId: 2n, quantity: 150 },
      ],
    );

    const service = new OrdersService(prismaMock as never);

    const dto: CreateOrderDto = {
      items: [{ productId: "1", productSizeId: "10", quantity: 2 }],
    };

    const order = await service.create(1n, dto);

    // Kết quả mong đợi:
    // 1. Đặt hàng thành công
    expect(order.status).toBe("PENDING");
    // 2. Trừ chính xác nguyên liệu cho 2 ly: 40g cà phê và 300ml sữa
    // 3. Tồn kho còn đúng lượng nguyên liệu tương ứng 1 ly: 20g cà phê, 150ml sữa
    const coffeeStock = ingredientStore.get("1")!.stockQuantity;
    const milkStock = ingredientStore.get("2")!.stockQuantity;
    expect(coffeeStock).toBe(20);
    expect(milkStock).toBe(150);
    // Version của nguyên liệu tăng lên 1
    expect(ingredientStore.get("1")!.version).toBe(1);
    expect(ingredientStore.get("2")!.version).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Test 2 – Không đủ nguyên liệu
  // ---------------------------------------------------------------------------
  it("Test 2: Không đủ nguyên liệu - kho chỉ đủ 1 ly, khách đặt 2 ly -> từ chối và không trừ kho", async () => {
    // Kho chỉ có 20g cà phê (đủ 1 ly) và 150ml sữa (đủ 1 ly)
    const { prismaMock, ingredientStore } = createPrismaMock(
      [
        { id: 1n, name: "Bột cà phê", unit: "g", stockQuantity: 20, version: 0, isActive: true },
        { id: 2n, name: "Sữa", unit: "ml", stockQuantity: 150, version: 0, isActive: true },
      ],
      [
        { productId: 1n, ingredientId: 1n, quantity: 20 },
        { productId: 1n, ingredientId: 2n, quantity: 150 },
      ],
    );

    const service = new OrdersService(prismaMock as never);

    const dto: CreateOrderDto = {
      items: [{ productId: "1", productSizeId: "10", quantity: 2 }],
    };

    // Kết quả mong đợi:
    // 1. Từ chối đơn hàng với BadRequestException
    await expect(service.create(1n, dto)).rejects.toThrow(BadRequestException);

    // 2. Không trừ bất kỳ nguyên liệu nào
    expect(ingredientStore.get("1")!.stockQuantity).toBe(20);
    expect(ingredientStore.get("2")!.stockQuantity).toBe(150);
    expect(ingredientStore.get("1")!.version).toBe(0);
    expect(ingredientStore.get("2")!.version).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Test 3 – Hai khách đặt đồng thời
  // ---------------------------------------------------------------------------
  it("Test 3: Hai khách đặt đồng thời khi kho chỉ đủ 1 ly -> chỉ 1 thành công, 1 thất bại, không âm kho", async () => {
    // Kho chỉ đủ pha 1 ly (20g cà phê, 150ml sữa)
    const { prismaMock, ingredientStore } = createPrismaMock(
      [
        { id: 1n, name: "Bột cà phê", unit: "g", stockQuantity: 20, version: 0, isActive: true },
        { id: 2n, name: "Sữa", unit: "ml", stockQuantity: 150, version: 0, isActive: true },
      ],
      [
        { productId: 1n, ingredientId: 1n, quantity: 20 },
        { productId: 1n, ingredientId: 2n, quantity: 150 },
      ],
    );

    const service = new OrdersService(prismaMock as never);

    const dto1: CreateOrderDto = { items: [{ productId: "1", productSizeId: "10", quantity: 1 }] };
    const dto2: CreateOrderDto = { items: [{ productId: "1", productSizeId: "10", quantity: 1 }] };

    // Request 1 đến và hoàn tất trước
    const order1 = await service.create(1n, dto1);
    expect(order1.status).toBe("PENDING");
    expect(ingredientStore.get("1")!.stockQuantity).toBe(0);
    expect(ingredientStore.get("2")!.stockQuantity).toBe(0);

    // Request 2 gửi đến sau khi kho đã về 0 -> Bị từ chối
    await expect(service.create(2n, dto2)).rejects.toThrow();

    // Tồn kho không được âm
    expect(ingredientStore.get("1")!.stockQuantity).toBeGreaterThanOrEqual(0);
    expect(ingredientStore.get("2")!.stockQuantity).toBeGreaterThanOrEqual(0);
  });

  // ---------------------------------------------------------------------------
  // Test 4 – Đơn hàng nhiều sản phẩm dùng chung nguyên liệu
  // ---------------------------------------------------------------------------
  it("Test 4: Đơn hàng nhiều sản phẩm - tính tổng lượng sữa tiêu thụ của cả 2 món", async () => {
    // Cà phê sữa (product 1) cần: 150ml Sữa
    // Bạc xỉu (product 2) cần: 200ml Sữa
    // Tổng nhu cầu sữa cho 1 đơn gồm [1 Cà phê sữa + 1 Bạc xỉu] là: 350ml Sữa
    // Kho chỉ có 300ml Sữa (đủ cho từng món riêng lẻ nhưng KHÔNG đủ cho cả 2)
    const { prismaMock, ingredientStore } = createPrismaMock(
      [
        { id: 1n, name: "Bột cà phê", unit: "g", stockQuantity: 100, version: 0, isActive: true },
        { id: 2n, name: "Sữa", unit: "ml", stockQuantity: 300, version: 0, isActive: true },
      ],
      [
        { productId: 1n, ingredientId: 1n, quantity: 20 },
        { productId: 1n, ingredientId: 2n, quantity: 150 },
        { productId: 2n, ingredientId: 1n, quantity: 10 },
        { productId: 2n, ingredientId: 2n, quantity: 200 },
      ],
    );

    const service = new OrdersService(prismaMock as never);

    const dto: CreateOrderDto = {
      items: [
        { productId: "1", productSizeId: "10", quantity: 1 },
        { productId: "2", productSizeId: "20", quantity: 1 },
      ],
    };

    // Đơn hàng phải bị từ chối do tổng nhu cầu (350ml) > tồn kho (300ml)
    await expect(service.create(1n, dto)).rejects.toThrow(BadRequestException);

    // Đảm bảo không trừ tồn kho của bất kỳ nguyên liệu nào
    expect(ingredientStore.get("1")!.stockQuantity).toBe(100);
    expect(ingredientStore.get("2")!.stockQuantity).toBe(300);
  });

  // ---------------------------------------------------------------------------
  // Test 5 – Transaction rollback khi 1 nguyên liệu thất bại
  // ---------------------------------------------------------------------------
  it("Test 5: Transaction rollback - đơn dùng 3 nguyên liệu, nguyên liệu cuối cùng không đủ -> rollback toàn bộ", async () => {
    // Trà sữa (product 3) cần: 15g Trà (id: 10), 100ml Sữa (id: 11), 30g Đường (id: 12)
    // Kho có: 50g Trà (đủ), 200ml Sữa (đủ), nhưng chỉ có 10g Đường (thiếu)
    const { prismaMock, ingredientStore } = createPrismaMock(
      [
        { id: 10n, name: "Trà", unit: "g", stockQuantity: 50, version: 0, isActive: true },
        { id: 11n, name: "Sữa", unit: "ml", stockQuantity: 200, version: 0, isActive: true },
        { id: 12n, name: "Đường", unit: "g", stockQuantity: 10, version: 0, isActive: true },
      ],
      [
        { productId: 3n, ingredientId: 10n, quantity: 15 },
        { productId: 3n, ingredientId: 11n, quantity: 100 },
        { productId: 3n, ingredientId: 12n, quantity: 30 },
      ],
    );

    const service = new OrdersService(prismaMock as never);

    const dto: CreateOrderDto = {
      items: [{ productId: "3", productSizeId: "30", quantity: 1 }],
    };

    // Transaction thất bại và ném lỗi
    await expect(service.create(1n, dto)).rejects.toThrow(BadRequestException);

    // Toàn bộ nguyên liệu giữ nguyên số lượng ban đầu, không bị trừ một phần
    expect(ingredientStore.get("10")!.stockQuantity).toBe(50);
    expect(ingredientStore.get("11")!.stockQuantity).toBe(200);
    expect(ingredientStore.get("12")!.stockQuantity).toBe(10);
  });

  // ---------------------------------------------------------------------------
  // Test 6 – Yêu cầu tạo đơn trùng lặp (Idempotent)
  // ---------------------------------------------------------------------------
  it("Test 6: Gửi 2 lần cùng Idempotency-Key -> không tạo đơn trùng, không trừ nguyên liệu 2 lần", async () => {
    const { prismaMock, ingredientStore } = createPrismaMock(
      [
        { id: 1n, name: "Bột cà phê", unit: "g", stockQuantity: 100, version: 0, isActive: true },
        { id: 2n, name: "Sữa", unit: "ml", stockQuantity: 500, version: 0, isActive: true },
      ],
      [
        { productId: 1n, ingredientId: 1n, quantity: 20 },
        { productId: 1n, ingredientId: 2n, quantity: 150 },
      ],
    );

    const service = new OrdersService(prismaMock as never);
    const idempotencyKey = "PAY-IDEMP-TASK10-UNIQUE";

    const dto: CreateOrderDto = {
      items: [{ productId: "1", productSizeId: "10", quantity: 1 }],
      idempotencyKey,
    };

    // 1. Tạo đơn lần 1 với Idempotency-Key
    const order1 = await service.create(1n, dto, idempotencyKey);
    expect(order1.status).toBe("PENDING");

    // Tồn kho đã trừ cho 1 ly: còn 80g cà phê và 350ml sữa
    expect(ingredientStore.get("1")!.stockQuantity).toBe(80);
    expect(ingredientStore.get("2")!.stockQuantity).toBe(350);

    // 2. Gửi lại lần 2 với cùng Idempotency-Key
    const order2 = await service.create(1n, dto, idempotencyKey);
    expect(order2.id).toBe(order1.id);

    // 3. Đảm bảo nguyên liệu không bị trừ thêm lần nào nữa
    expect(ingredientStore.get("1")!.stockQuantity).toBe(80);
    expect(ingredientStore.get("2")!.stockQuantity).toBe(350);
  });
});

