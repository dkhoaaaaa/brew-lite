import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { BadRequestException } from "@nestjs/common";
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
      // Trả lại đúng dữ liệu service gửi vào để kiểm tra con số tính được.
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
    },
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

    // 1 ly = 35.000 (món) + 5.000 (size M) + 5.000 (topping) = 45.000; 2 ly = 90.000
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
