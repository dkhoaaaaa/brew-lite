import { BadRequestException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrdersController } from "../../src/modules/orders/orders.controller.js";
import { OrdersService } from "../../src/modules/orders/orders.service.js";
import { PrismaService } from "../../src/prisma/prisma.service.js";

// Helper chuyển số thành Decimal mock
const money = (val: number) => ({
  toNumber: () => val,
  toString: () => val.toString(),
});

describe("Integration Test: Tạo đơn hàng (Orders Integration)", () => {
  let ordersController: OrdersController;
  let ordersService: OrdersService;
  let mockPrisma: any;
  let jwtService: JwtService;

  // Dữ liệu database giả lập có stateful và transaction snapshot
  let dbUsers: any[];
  let dbProducts: any[];
  let dbSizes: any[];
  let dbToppings: any[];
  let dbIngredients: any[];
  let dbRecipes: any[];
  let dbOrders: any[];
  let dbOrderItems: any[];
  let dbPayments: any[];

  function resetDatabase() {
    dbUsers = [
      { id: 1n, email: "user@test.com", fullName: "Test User", loyaltyPoints: 0, isActive: true },
    ];

    dbProducts = [
      { id: 101n, name: "Cà phê sữa đá", price: money(35000), stock: 10, version: 0, isActive: true },
      { id: 102n, name: "Trà đào cam sả", price: money(40000), stock: 5, version: 0, isActive: true },
    ];

    dbSizes = [
      { id: 201n, productId: 101n, sizeCode: "M", extraPrice: money(0), isActive: true },
      { id: 202n, productId: 101n, sizeCode: "L", extraPrice: money(6000), isActive: true },
      { id: 203n, productId: 102n, sizeCode: "M", extraPrice: money(0), isActive: true },
    ];

    dbToppings = [
      { id: 301n, name: "Trân châu đen", price: money(5000), stock: 20, version: 0, isActive: true },
    ];

    // Kho nguyên liệu: đủ pha 3 ly cà phê sữa đá (mỗi ly cần 20g cà phê, 30ml sữa)
    dbIngredients = [
      { id: 401n, name: "Cà phê hạt", unit: "g", stockQuantity: 60, version: 0, isActive: true },
      { id: 402n, name: "Sữa đặc", unit: "ml", stockQuantity: 90, version: 0, isActive: true },
    ];

    dbRecipes = [
      { productId: 101n, ingredientId: 401n, quantity: 20, ingredient: dbIngredients[0] },
      { productId: 101n, ingredientId: 402n, quantity: 30, ingredient: dbIngredients[1] },
    ];

    dbOrders = [];
    dbOrderItems = [];
    dbPayments = [];
  }

  beforeEach(() => {
    resetDatabase();

    mockPrisma = {
      user: {
        findFirst: vi.fn().mockImplementation(async ({ where }) => {
          return dbUsers.find((u) => u.id === where.id && (where.isActive === undefined || u.isActive === where.isActive)) ?? null;
        }),
      },
      product: {
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          return dbProducts.filter((p) => where.id.in.includes(p.id) && (where.isActive === undefined || p.isActive === where.isActive));
        }),
        updateMany: vi.fn().mockImplementation(async ({ where, data }) => {
          const p = dbProducts.find((item) => item.id === where.id && item.version === where.version);
          if (!p || (where.stock?.gte !== undefined && p.stock < where.stock.gte)) return { count: 0 };
          if (data.stock?.decrement) p.stock -= data.stock.decrement;
          if (data.version?.increment) p.version += data.version.increment;
          return { count: 1 };
        }),
      },
      productSize: {
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          return dbSizes.filter((s) => where.id.in.includes(s.id) && (where.isActive === undefined || s.isActive === where.isActive));
        }),
      },
      productTopping: {
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          return dbToppings
            .filter((t) => where.toppingId.in.includes(t.id))
            .map((t) => ({ productId: 101n, topping: t }));
        }),
      },
      productRecipe: {
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          return dbRecipes
            .filter((r) => where.productId.in.includes(r.productId))
            .map((r) => ({
              ...r,
              ingredient: dbIngredients.find((ing) => ing.id === r.ingredientId),
            }));
        }),
      },
      ingredient: {
        findMany: vi.fn().mockImplementation(async () => dbIngredients),
        updateMany: vi.fn().mockImplementation(async ({ where, data }) => {
          const ing = dbIngredients.find((i) => i.id === where.id && i.version === where.version);
          if (!ing || (where.stockQuantity?.gte !== undefined && ing.stockQuantity < where.stockQuantity.gte)) {
            return { count: 0 };
          }
          if (data.stockQuantity?.decrement) ing.stockQuantity -= Number(data.stockQuantity.decrement);
          if (data.version?.increment) ing.version += data.version.increment;
          return { count: 1 };
        }),
      },
      order: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const newOrder = {
            id: BigInt(dbOrders.length + 1),
            orderCode: data.orderCode,
            userId: data.userId,
            status: data.status,
            subtotal: money(data.subtotal),
            discountAmount: money(data.discountAmount),
            total: money(data.total),
            note: data.note,
            expiresAt: data.expiresAt,
            createdAt: new Date(),
            orderItems: data.orderItems.create.map((item: any, idx: number) => ({
              id: BigInt(idx + 1),
              ...item,
              unitPrice: money(item.unitPrice),
              lineTotal: money(item.lineTotal),
              toppings: (item.toppings?.create ?? []).map((t: any) => ({
                id: BigInt(1),
                ...t,
                toppingPrice: money(t.toppingPrice),
              })),
            })),
          };
          dbOrders.push(newOrder);
          return newOrder;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          return dbOrders.find((o) => o.id === where.id) ?? null;
        }),
      },
      payment: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const newPayment = { id: BigInt(dbPayments.length + 1), ...data };
          dbPayments.push(newPayment);
          return newPayment;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          if (where.idempotencyKey) {
            const p = dbPayments.find((item) => item.idempotencyKey === where.idempotencyKey);
            if (!p) return null;
            const o = dbOrders.find((ord) => ord.id === p.orderId);
            return { ...p, order: o };
          }
          return null;
        }),
      },
      orderStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 1n }),
      },
      $transaction: vi.fn().mockImplementation(async (callback: any) => {
        // Snapshot dữ liệu để hỗ trợ rollback khi callback ném Exception
        const snapshot = {
          products: dbProducts.map((p) => ({ ...p })),
          ingredients: dbIngredients.map((i) => ({ ...i })),
          orders: [...dbOrders],
          payments: [...dbPayments],
        };
        try {
          return await callback(mockPrisma);
        } catch (error) {
          // Rollback dữ liệu
          dbProducts = snapshot.products;
          dbIngredients = snapshot.ingredients;
          dbOrders = snapshot.orders;
          dbPayments = snapshot.payments;
          throw error;
        }
      }),
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    };

    jwtService = {
      verify: vi.fn().mockReturnValue({ sub: "1" }),
      sign: vi.fn().mockReturnValue("mock_token"),
    } as unknown as JwtService;

    ordersService = new OrdersService(mockPrisma as unknown as PrismaService);
    ordersController = new OrdersController(ordersService, jwtService);
  });

  // 1. Tạo đơn hàng với dữ liệu hợp lệ
  it("1. Tạo đơn hàng thành công với đầy đủ sản phẩm, size, topping và tùy chọn đường đá", async () => {
    const payload = {
      items: [
        {
          productId: "101",
          productSizeId: "202", // Size L (+6.000đ)
          quantity: 2,
          sugarPercent: 70,
          icePercent: 50,
          note: "Ít ngọt",
          toppings: [{ toppingId: "301", quantity: 1 }], // Trân châu (+5.000đ)
        },
      ],
      note: "Giao trước 12h",
      idempotencyKey: "test-idem-001",
    };

    const result = await ordersController.create(
      "Bearer mock_token",
      undefined,
      undefined,
      payload,
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBe("PENDING");
    expect(result.orderCode).toBeDefined();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productName).toBe("Cà phê sữa đá");
    expect(result.items[0].sizeCode).toBe("L");
    expect(result.items[0].sugarPercent).toBe(70);
    expect(result.items[0].icePercent).toBe(50);
  });

  // 2. Không cho phép tạo đơn với sản phẩm không tồn tại
  it("2. Từ chối tạo đơn khi sản phẩm không tồn tại trong hệ thống (HTTP 400)", async () => {
    const payload = {
      items: [
        {
          productId: "9999", // Không tồn tại
          productSizeId: "201",
          quantity: 1,
        },
      ],
    };

    await expect(
      ordersController.create("Bearer mock_token", undefined, undefined, payload),
    ).rejects.toThrow(BadRequestException);
  });

  // 3. Không cho phép số lượng không hợp lệ hoặc size không thuộc sản phẩm
  it("3. Từ chối tạo đơn khi size không khớp với sản phẩm", async () => {
    const payload = {
      items: [
        {
          productId: "101",
          productSizeId: "203", // Size của sản phẩm 102
          quantity: 1,
        },
      ],
    };

    await expect(
      ordersController.create("Bearer mock_token", undefined, undefined, payload),
    ).rejects.toThrow("size does not belong to this product");
  });

  // 4. Xử lý khi không đủ nguyên liệu
  it("4. Từ chối tạo đơn khi kho nguyên liệu không đủ để pha chế", async () => {
    // Kho hiện có 60g cà phê và 90ml sữa, đủ tối đa 3 ly cà phê sữa (mỗi ly 20g/30ml)
    // Đặt 4 ly sẽ vượt quá tồn kho nguyên liệu (cần 80g cà phê, 120ml sữa)
    const payload = {
      items: [
        {
          productId: "101",
          productSizeId: "201",
          quantity: 4,
        },
      ],
    };

    await expect(
      ordersController.create("Bearer mock_token", undefined, undefined, payload),
    ).rejects.toThrow("không đủ số lượng tồn kho");
  });

  // 5. Kiểm tra đơn hàng được lưu trong database
  it("5. Xác minh đơn hàng được lưu thực sự vào database sau khi tạo", async () => {
    const payload = {
      items: [
        {
          productId: "101",
          productSizeId: "201",
          quantity: 1,
        },
      ],
      note: "Kiểm tra lưu DB",
    };

    const created = await ordersController.create("Bearer mock_token", undefined, undefined, payload);
    expect(dbOrders).toHaveLength(1);
    expect(dbOrders[0].id.toString()).toBe(created.id);
    expect(dbOrders[0].status).toBe("PENDING");
    expect(dbOrders[0].note).toBe("Kiểm tra lưu DB");
  });

  // 6. Kiểm tra chi tiết đơn hàng được lưu chính xác
  it("6. Xác minh chi tiết đơn hàng (OrderItems, Toppings) được lưu chính xác", async () => {
    const payload = {
      items: [
        {
          productId: "101",
          productSizeId: "202",
          quantity: 2,
          toppings: [{ toppingId: "301", quantity: 1 }],
        },
      ],
    };

    const created = await ordersController.create("Bearer mock_token", undefined, undefined, payload);
    const item = created.items[0];

    expect(item.quantity).toBe(2);
    expect(item.sizeCode).toBe("L");
    expect(item.toppings).toHaveLength(1);
    expect(item.toppings[0].name).toBe("Trân châu đen");
  });

  // 7. Kiểm tra tổng tiền được tính đúng theo giá database
  it("7. Tổng tiền đơn hàng được tính chính xác từ database (Đơn giá = Giá gốc + Phụ thu size + Topping)", async () => {
    // Giá gốc 101: 35.000đ
    // Phụ thu size L (202): 6.000đ
    // Topping Trân châu (301): 5.000đ
    // Đơn giá 1 ly = 35.000 + 6.000 + 5.000 = 46.000đ
    // Số lượng: 2 ly -> Tổng tiền = 92.000đ
    const payload = {
      items: [
        {
          productId: "101",
          productSizeId: "202",
          quantity: 2,
          toppings: [{ toppingId: "301", quantity: 1 }],
        },
      ],
    };

    const created = await ordersController.create("Bearer mock_token", undefined, undefined, payload);
    expect(created.subtotal).toBe(92000);
    expect(created.total).toBe(92000);
  });

  // 8. Kiểm tra transaction và rollback nếu xảy ra lỗi giữa chừng
  it("8. Đảm bảo tính toàn vẹn Transaction: rollback toàn bộ nếu có lỗi trong quá trình tạo đơn", async () => {
    // Ép lỗi khi gọi order.create
    mockPrisma.order.create.mockRejectedValueOnce(new Error("Database write disk error"));

    const payload = {
      items: [
        {
          productId: "101",
          productSizeId: "201",
          quantity: 1,
        },
      ],
    };

    const initialIngStock = dbIngredients[0].stockQuantity;

    await expect(
      ordersController.create("Bearer mock_token", undefined, undefined, payload),
    ).rejects.toThrow("Database write disk error");

    // Dữ liệu đơn hàng không được thêm vào
    expect(dbOrders).toHaveLength(0);
    // Tồn kho nguyên liệu phải được hoàn trả về trạng thái ban đầu do rollback
    expect(dbIngredients[0].stockQuantity).toBe(initialIngStock);
  });
});
