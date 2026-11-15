import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { createHmac } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../../src/app.module.js";
import { JwtAuthGuard } from "../../src/modules/auth/auth.guard.js";
import { PrismaService } from "../../src/prisma/prisma.service.js";

const TEST_SECRET = "brewlite-e2e-test-hash-secret-512";
const TEST_TMN = "BREWLITE_TEST_TMN";

const money = (val: number) => ({
  toNumber: () => val,
  toString: () => val.toString(),
});

function signParams(params: Record<string, string>): string {
  const signData = Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`,
    )
    .join("&");
  return createHmac("sha512", TEST_SECRET).update(signData, "utf8").digest("hex");
}

describe("End-to-End Test (E2E): Toàn bộ luồng từ Menu -> Đặt hàng -> Thanh toán VNPay -> Xác nhận đơn", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;

  // Dữ liệu mock stateful cho E2E
  let dbUsers: any[];
  let dbProducts: any[];
  let dbSizes: any[];
  let dbToppings: any[];
  let dbIngredients: any[];
  let dbRecipes: any[];
  let dbOrders: any[];
  let dbPayments: any[];

  function resetState() {
    dbUsers = [
      { id: 1n, email: "customer@brewlite.test", fullName: "Nguyễn Văn Test", loyaltyPoints: 0, isActive: true },
    ];

    dbIngredients = [
      { id: 1n, name: "Cà phê Robusta", unit: "g", stockQuantity: 200, version: 0, isActive: true },
      { id: 2n, name: "Sữa tươi", unit: "ml", stockQuantity: 500, version: 0, isActive: true },
    ];

    dbProducts = [
      {
        id: 10n,
        name: "Cà phê Latte Đá",
        description: "Espresso và sữa tươi thơm béo",
        price: money(45000),
        imageUrl: "/latte.jpg",
        categoryId: 1n,
        stock: 50,
        version: 0,
        isActive: true,
      },
    ];

    dbSizes = [
      { id: 20n, productId: 10n, sizeCode: "M", extraPrice: money(0), isActive: true },
      { id: 21n, productId: 10n, sizeCode: "L", extraPrice: money(6000), isActive: true },
    ];

    dbToppings = [
      { id: 30n, name: "Kem Cheese", price: money(10000), stock: 30, version: 0, isActive: true },
    ];

    dbRecipes = [
      { productId: 10n, ingredientId: 1n, quantity: 20, ingredient: dbIngredients[0] },
      { productId: 10n, ingredientId: 2n, quantity: 150, ingredient: dbIngredients[1] },
    ];

    dbOrders = [];
    dbPayments = [];
  }

  beforeEach(async () => {
    resetState();

    process.env.VNPAY_PAYMENT_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    process.env.VNPAY_HASH_SECRET = TEST_SECRET;
    process.env.VNPAY_TMN_CODE = TEST_TMN;
    process.env.VNPAY_RETURN_URL = "http://localhost:3001/payments/vnpay/return";
    process.env.FRONTEND_BASE_URL = "http://localhost:3000";
    process.env.PAYMENT_TTL_MINUTES = "5";

    const mockPrisma = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      user: {
        findFirst: vi.fn().mockImplementation(async ({ where }) => {
          return dbUsers.find((u) => u.id === where.id && u.isActive) ?? null;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          return dbUsers.find((u) => u.id === where.id) ?? null;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }) => {
          const u = dbUsers.find((user) => user.id === where.id);
          if (u && data.loyaltyPoints?.increment) {
            u.loyaltyPoints += Number(data.loyaltyPoints.increment);
          }
          return u;
        }),
      },
      category: {
        findMany: vi.fn().mockResolvedValue([{ id: 1n, name: "Cà phê", isActive: true }]),
      },
      product: {
        count: vi.fn().mockImplementation(async () => dbProducts.filter((p) => p.isActive).length),
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          if (where?.id?.in) {
            return dbProducts.filter((p) => where.id.in.includes(p.id) && p.isActive);
          }
          return dbProducts.filter((p) => p.isActive);
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }) => {
          const p = dbProducts.find((item) => item.id === where.id && item.isActive);
          if (!p) return null;
          return {
            ...p,
            category: { id: 1n, name: "Cà phê" },
            productSizes: dbSizes.filter((s) => s.productId === p.id),
            productToppings: dbToppings.map((t) => ({ productId: p.id, topping: t })),
            productRecipes: dbRecipes.filter((r) => r.productId === p.id),
          };
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({}),
      },
      productSize: {
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          return dbSizes.filter((s) => where.id.in.includes(s.id) && s.isActive);
        }),
      },
      productTopping: {
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          return dbToppings
            .filter((t) => where.toppingId.in.includes(t.id))
            .map((t) => ({ productId: 10n, topping: t }));
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
          const ing = dbIngredients.find((i) => i.id === where.id);
          if (!ing) return { count: 0 };
          if (data.stockQuantity?.decrement) ing.stockQuantity -= Number(data.stockQuantity.decrement);
          return { count: 1 };
        }),
      },
      order: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const ord = {
            id: BigInt(dbOrders.length + 1),
            orderCode: data.orderCode,
            userId: data.userId,
            status: data.status,
            subtotal: money(data.subtotal),
            discountAmount: money(data.discountAmount),
            total: money(data.total),
            pointsEarned: data.pointsEarned ?? 0,
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
          dbOrders.push(ord);
          return ord;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          const ord = dbOrders.find((o) => o.id === where.id);
          if (!ord) return null;
          return {
            ...ord,
            orderItems: ord.orderItems ?? [],
            payments: dbPayments.filter((p) => p.orderId === ord.id),
            statusHistory: [{ id: 1n, oldStatus: null, newStatus: ord.status, changedAt: new Date() }],
          };
        }),
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          return dbOrders.filter((o) => o.userId === where.userId);
        }),
        update: vi.fn().mockImplementation(async ({ where, data }) => {
          const ord = dbOrders.find((o) => o.id === where.id);
          if (ord) Object.assign(ord, data);
          return ord;
        }),
      },
      payment: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const p = {
            id: BigInt(dbPayments.length + 101),
            ...data,
            createdAt: new Date(),
          };
          dbPayments.push(p);
          return p;
        }),
        findFirst: vi.fn().mockImplementation(async ({ where }) => {
          return dbPayments.find((p) => {
            if (where.orderId && p.orderId !== where.orderId) return false;
            if (where.provider && p.provider !== where.provider) return false;
            if (where.status && p.status !== where.status) return false;
            return true;
          }) ?? null;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where, include }) => {
          let p: any = null;
          if (where.id) p = dbPayments.find((item) => item.id === where.id);
          if (where.idempotencyKey) p = dbPayments.find((item) => item.idempotencyKey === where.idempotencyKey);
          if (p && include?.order) {
            const ord = dbOrders.find((o) => o.id === p.orderId);
            return { ...p, order: ord };
          }
          return p ?? null;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }) => {
          const p = dbPayments.find((item) => item.id === where.id);
          if (p) Object.assign(p, data);
          return p;
        }),
      },
      orderStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 1n }),
      },
      orderItem: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      topping: {
        update: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn().mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: "1",
            email: "customer@brewlite.test",
            fullName: "Nguyễn Văn Test",
            loyaltyPoints: dbUsers[0]?.loyaltyPoints ?? 0,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authToken = "mock_valid_token";
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("KỊCH BẢN THÀNH CÔNG: Menu -> Chi tiết món -> Tạo đơn -> Thanh toán VNPay -> IPN Webhook -> Xác nhận đơn", async () => {
    // BƯỚC 1: Khách hàng xem danh mục sản phẩm (Menu)
    const menuRes = await request(app.getHttpServer()).get("/products");
    expect(menuRes.status).toBe(200);
    expect(menuRes.body.data).toBeDefined();
    expect(menuRes.body.data.length).toBeGreaterThan(0);
    expect(menuRes.body.data[0].name).toBe("Cà phê Latte Đá");

    // BƯỚC 2: Khách hàng xem chi tiết sản phẩm và các tùy chọn (Size, Topping, Lượng nguyên liệu)
    const productDetailRes = await request(app.getHttpServer()).get("/products/10");
    expect(productDetailRes.status).toBe(200);
    expect(productDetailRes.body.id).toBe("10");
    expect(productDetailRes.body.availableQuantity).toBeGreaterThan(0); // Có đủ nguyên liệu
    expect(productDetailRes.body.sizes).toHaveLength(2); // Size M, L
    expect(productDetailRes.body.toppings).toHaveLength(1); // Kem Cheese

    // BƯỚC 3 & 4: Khách hàng thêm giỏ hàng và gửi yêu cầu tạo đơn hàng (Checkout)
    // Chọn Size L (phụ thu 6.000đ) + Topping Kem Cheese (10.000đ)
    // Đơn giá 1 ly = 45.000 + 6.000 + 10.000 = 61.000đ. Đặt 2 ly -> Tổng = 122.000đ
    const orderPayload = {
      items: [
        {
          productId: "10",
          productSizeId: "21", // Size L
          quantity: 2,
          sugarPercent: 70,
          icePercent: 50,
          note: "Giao tận tay",
          toppings: [{ toppingId: "30", quantity: 1 }],
        },
      ],
      note: "Khách hàng VIP",
      idempotencyKey: "e2e-order-key-9999",
    };

    const createOrderRes = await request(app.getHttpServer())
      .post("/orders")
      .set("x-user-id", "1")
      .send(orderPayload);

    expect(createOrderRes.status).toBe(201);
    const createdOrder = createOrderRes.body;
    expect(createdOrder.id).toBe("1");
    expect(createdOrder.status).toBe("PENDING");
    expect(createdOrder.orderCode).toBeDefined();
    expect(createdOrder.total).toBe(122000); // 61.000 * 2
    expect(createdOrder.items).toHaveLength(1);
    expect(createdOrder.items[0].productName).toBe("Cà phê Latte Đá");
    expect(createdOrder.items[0].sizeCode).toBe("L");

    // BƯỚC 5 & 6: Khởi tạo thanh toán qua cổng VNPay
    const paymentInitRes = await request(app.getHttpServer())
      .post(`/payments/orders/${createdOrder.id}/vnpay`)
      .set("Authorization", `Bearer ${authToken}`)
      .set("x-user-id", "1")
      .set("idempotency-key", "e2e-payment-key-1111");

    // BƯỚC 7 & 8: Cổng VNPay gửi webhook IPN ngầm xác nhận giao dịch thành công (ResponseCode '00')
    const vnpayUrl = new URL(paymentInitRes.body.paymentUrl);
    const paymentRecordId = vnpayUrl.searchParams.get("vnp_TxnRef")!;
    const ipnParams: Record<string, string> = {
      vnp_TmnCode: TEST_TMN,
      vnp_TxnRef: paymentRecordId,
      vnp_Amount: "12200000",
      vnp_OrderInfo: `Thanh toan don hang ${createdOrder.id}`,
      vnp_TransactionNo: "99887766",
      vnp_ResponseCode: "00",
      vnp_TransactionStatus: "00",
    };
    ipnParams.vnp_SecureHash = signParams(ipnParams);

    const ipnRes = await request(app.getHttpServer())
      .get("/payments/vnpay/ipn")
      .query(ipnParams);

    expect(ipnRes.status).toBe(200);
    expect(ipnRes.body).toEqual({ RspCode: "00", Message: "Confirm Success" });

    // Kiểm tra điểm tích lũy của khách hàng được cộng (100 điểm)
    expect(dbUsers[0].loyaltyPoints).toBe(100);

    // BƯỚC 9: Khách hàng xem xác nhận đơn hàng sau thanh toán (Order Confirmation)
    const confirmationRes = await request(app.getHttpServer())
      .get(`/orders/${createdOrder.id}`)
      .set("x-user-id", "1");

    expect(confirmationRes.status).toBe(200);
    expect(confirmationRes.body.id).toBe(createdOrder.id);
    expect(confirmationRes.body.status).toBe("PAID"); // Trạng thái đã chuyển sang PAID
    expect(confirmationRes.body.total).toBe(122000);

    // BƯỚC 10: Khách hàng kiểm tra danh sách đơn hàng đã đặt trong lịch sử
    const myOrdersRes = await request(app.getHttpServer())
      .get("/orders/my")
      .set("x-user-id", "1");

    expect(myOrdersRes.status).toBe(200);
    expect(myOrdersRes.body).toHaveLength(1);
    expect(myOrdersRes.body[0].orderCode).toBe(createdOrder.orderCode);
    expect(myOrdersRes.body[0].status).toBe("PAID");
  });

  it("KỊCH BẢN THẤT BẠI: Khách hàng hủy giao dịch tại cổng VNPay -> Trạng thái PAYMENT_FAILED", async () => {
    // 1. Tạo đơn hàng PENDING
    const orderPayload = {
      items: [
        {
          productId: "10",
          productSizeId: "20", // Size M
          quantity: 1,
        },
      ],
      idempotencyKey: "e2e-fail-flow-001",
    };

    const createRes = await request(app.getHttpServer())
      .post("/orders")
      .set("x-user-id", "1")
      .send(orderPayload);

    const orderId = createRes.body.id;

    // 2. Tạo phiên thanh toán VNPay
    const payRes = await request(app.getHttpServer())
      .post(`/payments/orders/${orderId}/vnpay`)
      .set("Authorization", `Bearer ${authToken}`)
      .set("x-user-id", "1")
      .set("idempotency-key", "e2e-fail-pay-key-222");

    expect(payRes.status).toBe(201);

    const failUrl = new URL(payRes.body.paymentUrl);
    const paymentRecordId = failUrl.searchParams.get("vnp_TxnRef")!;

    // 3. VNPay gửi IPN thông báo khách đã hủy giao dịch (Mã 24)
    const ipnParams: Record<string, string> = {
      vnp_TmnCode: TEST_TMN,
      vnp_TxnRef: paymentRecordId,
      vnp_Amount: "4500000",
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_TransactionNo: "77665544",
      vnp_ResponseCode: "24", // Hủy giao dịch
      vnp_TransactionStatus: "02",
    };
    ipnParams.vnp_SecureHash = signParams(ipnParams);

    const ipnRes = await request(app.getHttpServer())
      .get("/payments/vnpay/ipn")
      .query(ipnParams);

    expect(ipnRes.status).toBe(200);
    expect(ipnRes.body.RspCode).toBe("00");

    // Điểm thưởng không được cộng
    expect(dbUsers[0].loyaltyPoints).toBe(0);

    // Đơn hàng chuyển sang trạng thái PAYMENT_FAILED
    const orderCheck = await request(app.getHttpServer())
      .get(`/orders/${orderId}`)
      .set("x-user-id", "1");

    expect(orderCheck.body.status).toBe("PAYMENT_FAILED");
  });
});
