import { GUARDS_METADATA } from "@nestjs/common/constants.js";
import { describe, expect, it, vi } from "vitest";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";

describe("OrdersController", () => {
  it("should have JwtAuthGuard applied to POST /orders route", () => {
    const createMethod = (OrdersController.prototype as Record<string, any>)["create"];
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      createMethod,
    );

    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
  });

  it("should call ordersService.create with current user id and dto", async () => {
    const mockOrdersService = {
      create: vi.fn().mockResolvedValue({
        id: "1",
        orderCode: "ORD123456",
        total: "50000",
      }),
      findMyOrders: vi.fn(),
    };

    const controller = new OrdersController(
      mockOrdersService as unknown as OrdersService,
    );

    const user = {
      id: "99",
      email: "user@example.com",
      fullName: "Test User",
      loyaltyPoints: 10,
    };

    const dto = {
      note: "Giao trước 12h",
      total: 50000,
    };

    const result = await controller.create(user, dto);

    expect(mockOrdersService.create).toHaveBeenCalledWith("99", dto);
    expect(result.orderCode).toBe("ORD123456");
  });
});
