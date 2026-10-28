import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { OrdersService } from "../src/modules/orders/orders.service.js";
import type { CreateOrderDto } from "../src/modules/orders/dto/create-order.dto.js";

const money = (value: number) => ({ toNumber: () => value });

// Dữ liệu giả lập thay cho database.
function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: 1n }),
      findUnique: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 100 }),
      update: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 200 }),
    },
    promotion: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 1n, usedCount: 1 }),
    },
    promotionUsage: {
      upsert: vi.fn().mockResolvedValue({ id: 1n }),
    },
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

describe("OrdersService.autoTransitionByTime", () => {
  const baseOrder = (status: string, paidAtDate?: Date) => ({
    id: 10n,
    userId: 1n,
    orderCode: "BL20261027-AUTO",
    status,
    total: money(50000),
    subtotal: money(50000),
    discountAmount: money(0),
    orderItems: [],
    payments: paidAtDate
      ? [
          {
            id: 1n,
            status: "SUCCESS",
            method: "E_WALLET",
            paidAt: paidAtDate,
            amount: money(50000),
          },
        ]
      : [],
    statusHistory: paidAtDate
      ? [
          {
            id: 1n,
            oldStatus: "PENDING",
            newStatus: "PAID",
            changedAt: paidAtDate,
          },
        ]
      : [],
  });

  it("1. Không tự chuyển trạng thái cho đơn PENDING", async () => {
    const prisma = buildPrisma();
    const service = new OrdersService(prisma as never);
    const order = baseOrder("PENDING");

    const result = await service.syncOrderState(order, new Date());
    expect(result.status).toBe("PENDING");
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("2. Không tự chuyển trạng thái khi thanh toán thất bại (PAYMENT_FAILED)", async () => {
    const prisma = buildPrisma();
    const service = new OrdersService(prisma as never);
    const order = baseOrder("PAYMENT_FAILED");

    const result = await service.syncOrderState(order, new Date());
    expect(result.status).toBe("PAYMENT_FAILED");
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("3. Giữ nguyên PAID khi thanh toán dưới 1 phút (ví dụ: 30 giây)", async () => {
    const prisma = buildPrisma();
    const service = new OrdersService(prisma as never);
    const now = new Date("2026-10-27T10:00:30Z");
    const paidAt = new Date("2026-10-27T10:00:00Z"); // 30s elapsed
    const order = baseOrder("PAID", paidAt);

    const result = await service.syncOrderState(order, now);
    expect(result.status).toBe("PAID");
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("4. Chuyển sang PREPARING khi đủ 1 phút đến dưới 3 phút (ví dụ: 1 phút 30 giây)", async () => {
    const now = new Date("2026-10-27T10:01:30Z");
    const paidAt = new Date("2026-10-27T10:00:00Z"); // 90s elapsed
    const prisma = buildPrisma({
      order: {
        update: vi.fn().mockImplementation(async ({ data }) => ({
          ...baseOrder(data.status, paidAt),
        })),
      },
      orderStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 2n }),
      },
    });
    const service = new OrdersService(prisma as never);
    const order = baseOrder("PAID", paidAt);

    const result = await service.syncOrderState(order, now);
    expect(result.status).toBe("PREPARING");
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10n },
        data: { status: "PREPARING" },
      }),
    );
    expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 10n,
          oldStatus: "PAID",
          newStatus: "PREPARING",
        }),
      }),
    );
  });

  it("5. Chuyển sang READY khi đủ 3 phút đến dưới 5 phút (ví dụ: 3 phút 15 giây)", async () => {
    const now = new Date("2026-10-27T10:03:15Z");
    const paidAt = new Date("2026-10-27T10:00:00Z"); // 195s elapsed
    const prisma = buildPrisma({
      order: {
        update: vi.fn().mockImplementation(async ({ data }) => ({
          ...baseOrder(data.status, paidAt),
        })),
      },
      orderStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 3n }),
      },
    });
    const service = new OrdersService(prisma as never);
    const order = baseOrder("PREPARING", paidAt);

    const result = await service.syncOrderState(order, now);
    expect(result.status).toBe("READY");
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10n },
        data: { status: "READY" },
      }),
    );
  });

  it("6. Chuyển sang COMPLETED khi từ 5 phút trở đi (ví dụ: 5 phút 10 giây)", async () => {
    const now = new Date("2026-10-27T10:05:10Z");
    const paidAt = new Date("2026-10-27T10:00:00Z"); // 310s elapsed
    const prisma = buildPrisma({
      order: {
        update: vi.fn().mockImplementation(async ({ data }) => ({
          ...baseOrder(data.status, paidAt),
        })),
      },
      orderStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 4n }),
      },
    });
    const service = new OrdersService(prisma as never);
    const order = baseOrder("READY", paidAt);

    const result = await service.syncOrderState(order, now);
    expect(result.status).toBe("COMPLETED");
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10n },
        data: { status: "COMPLETED" },
      }),
    );
  });

  it("7. Đơn đã COMPLETED tuyệt đối không bị cập nhật lại hay quay lùi", async () => {
    const prisma = buildPrisma();
    const service = new OrdersService(prisma as never);
    const now = new Date("2026-10-27T10:10:00Z");
    const paidAt = new Date("2026-10-27T10:00:00Z");
    const order = baseOrder("COMPLETED", paidAt);

    const result = await service.syncOrderState(order, now);
    expect(result.status).toBe("COMPLETED");
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("8. Mô phỏng restart: Backend tắt và bật lại sau 6 phút -> Lần query findById đầu tiên tự chuyển sang COMPLETED", async () => {
    const now = new Date("2026-10-27T10:06:00Z");
    const paidAt = new Date("2026-10-27T10:00:00Z");
    const persistedOrder = baseOrder("PAID", paidAt);

    const prisma = buildPrisma({
      order: {
        findUnique: vi.fn().mockResolvedValue(persistedOrder),
        update: vi.fn().mockImplementation(async ({ data }) => ({
          ...baseOrder(data.status, paidAt),
        })),
      },
      orderStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 5n }),
      },
    });
    // Giả lập service instance mới sau khi restart
    const service = new OrdersService(prisma as never);

    // Mock thời gian hệ thống
    vi.setSystemTime(now);
    const details = await service.findById(10n, 1n);
    vi.useRealTimers();

    expect(details.status).toBe("COMPLETED");
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10n },
        data: { status: "COMPLETED" },
      }),
    );
  });
});

describe("OrdersService.loyaltyAndVoucherIntegration", () => {
  it("cộng 100 điểm khi thanh toán thành công và không cộng lặp lại (idempotent)", async () => {
    const userUpdateMock = vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 100 });
    const prisma = buildPrisma({
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 1n }),
        findUnique: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 0 }),
        update: userUpdateMock,
      },
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10n,
          userId: 1n,
          orderCode: "BL20261027-ABC",
          status: "PENDING",
          total: money(90000),
          pointsEarned: 0, // Chưa nhận điểm
          expiresAt: new Date(Date.now() + 100000),
          payments: [],
        }),
        update: vi.fn().mockResolvedValue({
          id: 10n,
          orderCode: "BL20261027-ABC",
          status: "PAID",
          pointsEarned: 100,
          total: money(90000),
        }),
      },
    });
    const service = new OrdersService(prisma as never);

    const res1 = await service.processMockPayment(10n, 1n, { method: "E_WALLET", outcome: "success" });
    expect(res1.status).toBe("PAID");
    expect(res1.pointsEarned).toBe(100);
    expect(userUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1n },
        data: { loyaltyPoints: { increment: 100 } },
      }),
    );

    // Lần 2: Đơn đã nhận 100 điểm trước đó
    userUpdateMock.mockClear();
    const prismaAlreadyAwarded = buildPrisma({
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 1n }),
        findUnique: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 100 }),
        update: userUpdateMock,
      },
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10n,
          userId: 1n,
          orderCode: "BL20261027-ABC",
          status: "PAID",
          total: money(90000),
          pointsEarned: 100, // Đã có điểm thưởng rồi!
          expiresAt: new Date(Date.now() + 100000),
          payments: [],
        }),
        update: vi.fn().mockResolvedValue({
          id: 10n,
          orderCode: "BL20261027-ABC",
          status: "PAID",
          pointsEarned: 100,
          total: money(90000),
        }),
      },
    });
    const serviceAlreadyAwarded = new OrdersService(prismaAlreadyAwarded as never);
    const res2 = await serviceAlreadyAwarded.processMockPayment(10n, 1n, { method: "E_WALLET", outcome: "success" });

    expect(res2.pointsEarned).toBe(0);
    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  it("áp dụng voucher hợp lệ: trừ tiền và cập nhật tổng tiền đơn hàng", async () => {
    const now = new Date();
    const prisma = buildPrisma({
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10n,
          userId: 1n,
          orderCode: "BL20261027-VOUCHER",
          status: "PENDING",
          subtotal: money(50000),
          discountAmount: money(0),
          total: money(50000),
          orderItems: [],
          payments: [],
          statusHistory: [],
        }),
        update: vi.fn().mockImplementation(async ({ data }) => ({
          id: 10n,
          orderCode: "BL20261027-VOUCHER",
          status: "PENDING",
          subtotal: money(50000),
          discountAmount: money(data.discountAmount),
          total: money(data.total),
          promotionId: data.promotionId,
          orderItems: [],
          payments: [],
          statusHistory: [],
        })),
      },
      promotion: {
        findUnique: vi.fn().mockResolvedValue({
          id: 99n,
          code: "BLV200-ABC",
          ownerUserId: 1n,
          isActive: true,
          endAt: new Date(now.getTime() + 86400000),
          usedCount: 0,
          usageLimit: 1,
          minOrderAmount: money(0),
          discountValue: money(10000),
        }),
      },
    });
    const service = new OrdersService(prisma as never);

    const updated = await service.applyVoucher(10n, 1n, "BLV200-ABC");
    expect(updated.discountAmount).toBe(10000);
    expect(updated.total).toBe(40000); // 50.000 - 10.000 = 40.000
    expect(updated.promotionId).toBe("99");
  });

  it("từ chối áp dụng voucher khi voucher thuộc về người dùng khác", async () => {
    const now = new Date();
    const prisma = buildPrisma({
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10n,
          userId: 1n,
          orderCode: "BL20261027-VOUCHER",
          status: "PENDING",
          subtotal: money(50000),
        }),
      },
      promotion: {
        findUnique: vi.fn().mockResolvedValue({
          id: 99n,
          code: "BLV200-OTHER",
          ownerUserId: 2n, // Thuộc user 2
          isActive: true,
          endAt: new Date(now.getTime() + 86400000),
          usedCount: 0,
        }),
      },
    });
    const service = new OrdersService(prisma as never);

    await expect(service.applyVoucher(10n, 1n, "BLV200-OTHER")).rejects.toThrow(
      "Mã khuyến mại này không thuộc về tài khoản của bạn.",
    );
  });
});
