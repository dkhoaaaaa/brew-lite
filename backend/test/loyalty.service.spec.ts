import { describe, expect, it, vi } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { LoyaltyService, REWARD_TIERS } from "../src/modules/loyalty/loyalty.service.js";

function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
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
  it("trả về danh sách 3 mức quy đổi voucher chuẩn xác", () => {
    const prisma = buildPrisma();
    const service = new LoyaltyService(prisma as never);
    const tiers = service.getRewardTiers();

    expect(tiers).toHaveLength(3);
    expect(tiers[0]).toEqual(expect.objectContaining({ id: "TIER_200", pointsCost: 200, discountValue: 10000 }));
    expect(tiers[1]).toEqual(expect.objectContaining({ id: "TIER_500", pointsCost: 500, discountValue: 30000 }));
    expect(tiers[2]).toEqual(expect.objectContaining({ id: "TIER_1000", pointsCost: 1000, discountValue: 70000 }));
  });

  it("từ chối đổi voucher khi mức quy đổi không hợp lệ", async () => {
    const prisma = buildPrisma();
    const service = new LoyaltyService(prisma as never);

    await expect(service.redeemVoucher(1n, "TIER_INVALID")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("từ chối đổi voucher khi không đủ điểm thành viên", async () => {
    const prisma = buildPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 150 }), // Chỉ có 150đ, cần 200đ
      },
    });
    const service = new LoyaltyService(prisma as never);

    await expect(service.redeemVoucher(1n, "TIER_200")).rejects.toThrow(
      "Bạn chưa đủ điểm để đổi mã khuyến mại này.",
    );
  });

  it("đổi voucher thành công khi đủ điểm: trừ điểm và tạo Promotion", async () => {
    const mockCreatedPromotion = {
      id: 99n,
      code: "BLV200-ABCDEF",
      name: "Giảm 10.000 VNĐ",
      discountValue: 10000,
      minOrderAmount: 0,
      startAt: new Date(),
      endAt: new Date(Date.now() + 30 * 86400000),
    };

    const prisma = buildPrisma({
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 250 }),
        update: vi.fn().mockResolvedValue({ id: 1n, loyaltyPoints: 50 }),
      },
      promotion: {
        create: vi.fn().mockResolvedValue(mockCreatedPromotion),
      },
      $transaction: vi.fn().mockResolvedValue([
        { id: 1n, loyaltyPoints: 50 },
        mockCreatedPromotion,
      ]),
    });
    const service = new LoyaltyService(prisma as never);

    const result = await service.redeemVoucher(1n, "TIER_200");
    expect(result.success).toBe(true);
    expect(result.remainingPoints).toBe(50);
    expect(result.voucher.code).toBe("BLV200-ABCDEF");
  });

  it("lấy danh sách voucher thuộc quyền sở hữu của người dùng", async () => {
    const now = new Date();
    const mockVouchers = [
      {
        id: 1n,
        code: "BLV200-001",
        name: "Giảm 10.000 VNĐ",
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
});

