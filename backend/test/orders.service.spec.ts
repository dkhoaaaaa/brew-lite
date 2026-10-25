import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { OrdersService } from "../src/modules/orders/orders.service.js";
import type { CreateOrderDto } from "../src/modules/orders/dto/create-order.dto.js";

const money = (value: number) => ({ toNumber: () => value });

// Dữ liệu giả lập thay cho database.
function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
    user: { findFirst: vi.fn().mockResolvedValue({ id: 1n }) },
    product: {
      findMany: vi.fn()
        .mockResolvedValue([{ id: 1n, name: "Cà phê sữa", price: money(35000) }]),
    },
    productSize: {
      findMany: vi.fn().mockResolvedValue([
        { id: 2n, productId: 1n, sizeCode: "M", extraPrice: money(5000) },
      ]),
    },
    productTopping: {
      findMany: vi.fn().mockResolvedValue([
        { productId: 1n, topping: { id: 1n, name: "Trân châu", price: money(5000) } },
      ]),
    },
    order: {
      create: vi.fn().mockImplementation(async ({ data }) => ({
        id: 10n,
        orderCode: data.orderCode,
        status: data.status,
        subtotal: money(data.subtotal),
        discountAmount: money(data.discountAmount),
        total: money(data.total),
        note: data.note ?? null,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
        orderItems: data.orderItems.create.map((i: any, idx: number) => ({
          id: BigInt(idx + 1),
          productId: i.productId,
          productName: i.productName,
          sizeCode: i.sizeCode,
          sugarPercent: i.sugarPercent ?? null,
          icePercent: i.icePercent ?? null,
          note: i.note ?? null,
          quantity: i.quantity,
          unitPrice: money(i.unitPrice),
          lineTotal: money(i.lineTotal),
          toppings: i.toppings.create.map((t: any) => ({
            toppingId: t.toppingId,
            toppingName: t.toppingName,
            toppingPrice: money(t.toppingPrice),
            quantity: t.quantity,
          })),
        })),
      })),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockImplementation(async ({ data }) => ({
        id: 10n,
        orderCode: "BL20261025-ABC123",
        status: data.status,
        subtotal: money(90000),
        discountAmount: money(0),
        total: money(90000),
      })),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      delete: vi.fn().mockResolvedValue({ id: 10n }),
    },
    payment: {
      create: vi.fn().mockResolvedValue({ id: 1n }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    orderStatusHistory: {
      create: vi.fn().mockResolvedValue({ id: 1n }),
    },
    $transaction: vi.fn().mockImplementation(async (arg) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg({
        order: {
          update: vi.fn().mockResolvedValue({
            id: 10n,
            orderCode: "BL20261025-ABC123",
            status: "PAID",
            total: money(90000),
          }),
        },
        payment: {
          create: vi.fn().mockResolvedValue({ id: 1n }),
        },
        orderStatusHistory: {
          create: vi.fn().mockResolvedValue({ id: 1n }),
        },
      });
    }),
    ...overrides,
  };
}

const validDto = (): CreateOrderDto => ({
  items: [
    {
      productId: "1",
      productSizeId: "2",
      quantity: 2,
      sugarPercent: 50,
      icePercent: 70,
      toppings: [{ toppingId: "1", quantity: 1 }],
    },
  ],
});

describe("OrdersService.create", () => {
  it("tính tiền từ giá trong DB và tạo đơn PENDING", async () => {
    const prisma = buildPrisma();
    const service = new OrdersService(prisma as never);

    const result = await service.create(1n, validDto());

    expect(result.items[0].unitPrice).toBe(45000);
    expect(result.items[0].lineTotal).toBe(90000);
    expect(result.subtotal).toBe(90000);
    expect(result.total).toBe(90000);
    expect(result.status).toBe("PENDING");
    expect(result.orderCode).toMatch(/^BL\d{8}-[0-9A-F]{6}$/);

    const data = (prisma.order.create as unknown as Mock).mock.calls[0][0].data;
    expect(data.statusHistory.create).toEqual({ oldStatus: null, newStatus: "PENDING" });
  });

  it("từ chối khi size không thuộc món", async () => {
    const prisma = buildPrisma({
      productSize: {
        findMany: vi.fn().mockResolvedValue([
          { id: 2n, productId: 99n, sizeCode: "M", extraPrice: money(5000) },
        ]),
      },
    });
    const service = new OrdersService(prisma as never);

    await expect(service.create(1n, validDto())).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it("từ chối khi topping không áp dụng cho món", async () => {
    const prisma = buildPrisma({
      productTopping: { findMany: vi.fn().mockResolvedValue([]) },
    });
    const service = new OrdersService(prisma as never);

    await expect(service.create(1n, validDto())).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it("từ chối khi trùng topping trong cùng một ly", async () => {
    const service = new OrdersService(buildPrisma() as never);
    const dto = validDto();
    dto.items[0].toppings = [{ toppingId: "1" }, { toppingId: "1" }];

    await expect(service.create(1n, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("từ chối khi món không tồn tại hoặc đã ngừng bán", async () => {
    const prisma = buildPrisma({ product: { findMany: vi.fn().mockResolvedValue([]) } });
    const service = new OrdersService(prisma as never);

    await expect(service.create(1n, validDto())).rejects.toBeInstanceOf(BadRequestException);
  });

  it("từ chối khi user không tồn tại", async () => {
    const prisma = buildPrisma({ user: { findFirst: vi.fn().mockResolvedValue(null) } });
    const service = new OrdersService(prisma as never);

    await expect(service.create(1n, validDto())).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("OrdersService.findMyOrders & cleanupExpiredOrders", () => {
  it("dọn dẹp các đơn PENDING quá 2 phút và trả về danh sách đơn còn hiệu lực", async () => {
    const prisma = buildPrisma({
      order: {
        findMany: vi.fn()
          // Lần 1: cleanup tìm đơn PENDING hết hạn
          .mockResolvedValueOnce([{ id: 99n }])
          // Lần 2: cleanup tìm đơn PAYMENT_FAILED hết hạn
          .mockResolvedValueOnce([])
          // Lần 3: tìm đơn của user
          .mockResolvedValueOnce([
            {
              id: 10n,
              orderCode: "BL20261025-001",
              status: "PENDING",
              subtotal: money(90000),
              discountAmount: money(0),
              total: money(90000),
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 100000),
              orderItems: [],
              payments: [],
            },
          ]),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      orderStatusHistory: {
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 1n }),
      },
    });
    const service = new OrdersService(prisma as never);

    const result = await service.findMyOrders(1n);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("10");
    expect(result[0].status).toBe("PENDING");
    expect(prisma.order.deleteMany).toHaveBeenCalled();
  });
});

describe("OrdersService.processMockPayment", () => {
  it("khi thanh toán thành công: cập nhật status thành PAID và ghi nhận Payment", async () => {
    const prisma = buildPrisma({
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10n,
          userId: 1n,
          orderCode: "BL20261025-ABC123",
          status: "PENDING",
          total: money(90000),
          expiresAt: new Date(Date.now() + 100000),
          payments: [],
        }),
        update: vi.fn().mockResolvedValue({
          id: 10n,
          orderCode: "BL20261025-ABC123",
          status: "PAID",
          total: money(90000),
        }),
      },
    });
    const service = new OrdersService(prisma as never);

    const res = await service.processMockPayment(10n, 1n, {
      method: "E_WALLET",
      outcome: "success",
    });

    expect(res.outcome).toBe("SIMULATED_SUCCESS");
    expect(res.status).toBe("PAID");
    expect(res.paymentStatus).toBe("SUCCESS");
  });

  it("khi thanh toán thất bại: cập nhật PAYMENT_FAILED và lưu Payment FAILED", async () => {
    const prisma = buildPrisma({
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10n,
          userId: 1n,
          orderCode: "BL20261025-ABC123",
          status: "PENDING",
          total: money(90000),
          expiresAt: new Date(Date.now() + 100000),
          payments: [],
        }),
        update: vi.fn().mockResolvedValue({
          id: 10n,
          orderCode: "BL20261025-ABC123",
          status: "PAYMENT_FAILED",
          total: money(90000),
        }),
      },
      payment: {
        create: vi.fn().mockResolvedValue({ id: 1n }),
      },
      orderStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 1n }),
      },
    });
    const service = new OrdersService(prisma as never);

    const res = await service.processMockPayment(10n, 1n, {
      method: "BANK_CARD",
      outcome: "failure",
    });

    expect(res.outcome).toBe("SIMULATED_FAILURE");
    expect(res.status).toBe("PAYMENT_FAILED");
    expect(res.paymentStatus).toBe("FAILED");
  });

  it("chặn khi user khác cố gắng thanh toán đơn hàng", async () => {
    const prisma = buildPrisma({
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10n,
          userId: 2n, // Đơn thuộc user 2
          status: "PENDING",
        }),
      },
    });
    const service = new OrdersService(prisma as never);

    await expect(
      service.processMockPayment(10n, 1n, { method: "E_WALLET", outcome: "success" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("hủy đơn hàng đang PENDING hoặc PAYMENT_FAILED thành CANCELLED", async () => {
    const prisma = buildPrisma({
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10n,
          userId: 1n,
          orderCode: "BL20261025-ABC123",
          status: "PAYMENT_FAILED",
          total: money(90000),
          orderItems: [],
          payments: [],
          statusHistory: [],
        }),
        update: vi.fn().mockResolvedValue({
          id: 10n,
          orderCode: "BL20261025-ABC123",
          status: "CANCELLED",
          total: money(90000),
          orderItems: [],
          payments: [],
          statusHistory: [],
        }),
      },
      orderStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 1n }),
      },
    });
    const service = new OrdersService(prisma as never);

    const cancelled = await service.cancelOrder(10n, 1n);
    expect(cancelled.status).toBe("CANCELLED");
  });
});
