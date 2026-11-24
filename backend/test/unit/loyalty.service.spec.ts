import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { LoyaltyService } from "../../src/modules/loyalty/loyalty.service.js";

function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
    loyaltyReward: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 1n,
          name: "Giảm 10.000đ",
          description: "Đổi 100 điểm",
          pointsCost: 100,
          discountValue: 10000,
          minOrderAmount: 30000,
        },
        {
          id: 2n,
          name: "Giảm 30.000đ",
          description: "Đổi 250 điểm",
          pointsCost: 250,
          discountValue: 30000,
          minOrderAmount: 50000,
        },
        {
          id: 3n,
          name: "Giảm 70.000đ",
          description: "Đổi 500 điểm",
          pointsCost: 500,
          discountValue: 70000,
          minOrderAmount: 100000,
        },
      ]),
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.id === 1n) {
          return {
            id: 1n,
            name: "Giảm 10.000đ",
            pointsCost: 100,
            discountValue: 10000,
            minOrderAmount: 30000,
            isActive: true,
          };
        }
        return null;
      }),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    promotion: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation(async (arg) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg;
    }),
    ...overrides,
  };
}

describe("LoyaltyService", () => {
  it("trả về danh sách reward tiers lấy trực tiếp từ database", async () => {
    const prisma = buildPrisma();
    const service = new LoyaltyService(prisma as never);
    const tiers = await service.getRewardTiers();

    expect(tiers).toHaveLength(3);
    expect(tiers[0]).toEqual(expect.objectContaining({ id: "1", pointsCost: 100, discountValue: 10000 }));
    expect(tiers[1]).toEqual(expect.objectContaining({ id: "2", pointsCost: 250, discountValue: 30000 }));
    expect(tiers[2]).toEqual(expect.objectContaining({ id: "3", pointsCost: 500, discountValue: 70000 }));
  });

  it("từ chối đổi voucher khi mức quy đổi không hợp lệ hoặc không tồn tại trong database", async () => {
    const prisma = buildPrisma();
    const service = new LoyaltyService(prisma as never);

    await expect(service.redeemVoucher(1n, "999")).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.redeemVoucher(1n, "INVALID_ID")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("từ chối đổi voucher khi không đủ điểm thành viên", async () => {
    const prisma = buildPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 50 }), // Chỉ có 50đ, cần 100đ
      },
    });
    const service = new LoyaltyService(prisma as never);

    await expect(service.redeemVoucher(1n, "1")).rejects.toThrow(
      "Bạn chưa đủ điểm để đổi mã khuyến mại này.",
    );
  });

  it("đổi voucher thành công khi đủ điểm: trừ điểm và tạo Promotion", async () => {
    const mockCreatedPromotion = {
      id: 99n,
      code: "BLV100-ABCDEF",
      name: "Giảm 10.000đ",
      discountValue: 10000,
      minOrderAmount: 30000,
      startAt: new Date(),
      endAt: new Date(Date.now() + 30 * 86400000),
    };

    const prisma = buildPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 250 }),
        update: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 150 }),
      },
      promotion: {
        create: vi.fn().mockResolvedValue(mockCreatedPromotion),
      },
      $transaction: vi.fn().mockResolvedValue([
        { id: 1n, loyaltyPoints: 150 },
        mockCreatedPromotion,
      ]),
    });
    const service = new LoyaltyService(prisma as never);

    const result = await service.redeemVoucher(1n, "1");
    expect(result.success).toBe(true);
    expect(result.remainingPoints).toBe(150);
    expect(result.voucher.code).toBe("BLV100-ABCDEF");
  });

  it("lấy danh sách voucher thuộc quyền sở hữu của người dùng", async () => {
    const now = new Date();
    const mockVouchers = [
      {
        id: 1n,
        code: "BLV100-001",
        name: "Giảm 10.000đ",
        description: "Ưu đãi",
        discountType: "FIXED",
        discountValue: 10000,
        minOrderAmount: 0,
        startAt: now,
        endAt: new Date(now.getTime() + 86400000),
        usedCount: 0,
        usageLimit: 1,
        isActive: true,
      },
    ];

    const prisma = buildPrisma({
      promotion: {
        findMany: vi.fn().mockResolvedValue(mockVouchers),
      },
    });
    const service = new LoyaltyService(prisma as never);

    const vouchers = await service.getMyVouchers(1n);
    expect(vouchers).toHaveLength(1);
    expect(vouchers[0].canApply).toBe(true);
    expect(vouchers[0].isUsed).toBe(false);
  });

  it("chặn âm điểm khi xảy ra xung đột đồng thời trong redeemVoucher (concurrency updateMany count = 0)", async () => {
    const prisma = buildPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 200 }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      promotion: {
        create: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation(async (arg) => {
        if (Array.isArray(arg)) {
          return [{ count: 0 }, {}];
        }
        return arg;
      }),
    });
    const service = new LoyaltyService(prisma as never);

    await expect(service.redeemVoucher(1n, "1")).rejects.toThrow(
      "Bạn chưa đủ điểm để đổi mã khuyến mại này hoặc điểm đã thay đổi.",
    );
  });
});
