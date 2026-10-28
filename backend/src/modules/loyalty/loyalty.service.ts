import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface RewardTier {
  id: string;
  pointsCost: number;
  discountValue: number;
  name: string;
  description: string;
  minOrderAmount: number;
}

export const REWARD_TIERS: RewardTier[] = [
  {
    id: "TIER_200",
    pointsCost: 200,
    discountValue: 10000,
    name: "Giảm 10.000 VNĐ",
    description: "Áp dụng cho mọi đơn hàng tại BrewLite.",
    minOrderAmount: 0,
  },
  {
    id: "TIER_500",
    pointsCost: 500,
    discountValue: 30000,
    name: "Giảm 30.000 VNĐ",
    description: "Áp dụng cho mọi đơn hàng tại BrewLite.",
    minOrderAmount: 0,
  },
  {
    id: "TIER_1000",
    pointsCost: 1000,
    discountValue: 70000,
    name: "Giảm 70.000 VNĐ",
    description: "Áp dụng cho mọi đơn hàng tại BrewLite.",
    minOrderAmount: 0,
  },
];

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách các mức quy đổi voucher có thể đổi bằng điểm thưởng.
   */
  getRewardTiers(): RewardTier[] {
    return REWARD_TIERS;
  }

  /**
   * Đổi điểm thành viên lấy mã voucher cá nhân.
   * Chạy trong Transaction: kiểm tra điểm, trừ điểm và tạo bản ghi Promotion thuộc về user.
   */
  async redeemVoucher(userId: bigint, tierId: string) {
    const tier = REWARD_TIERS.find((t) => t.id === tierId);
    if (!tier) {
      throw new BadRequestException("Mức quy đổi không hợp lệ.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, loyaltyPoints: true },
    });

    if (!user) {
      throw new NotFoundException("Người dùng không tồn tại.");
    }

    if (user.loyaltyPoints < tier.pointsCost) {
      throw new BadRequestException("Bạn chưa đủ điểm để đổi mã khuyến mại này.");
    }

    const code = `BLV${tier.pointsCost}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const startAt = new Date();
    const endAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Có hạn trong 30 ngày

    const [updatedUser, promotion] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { decrement: tier.pointsCost } },
        select: { id: true, loyaltyPoints: true },
      }),
      this.prisma.promotion.create({
        data: {
          code,
          name: tier.name,
          description: `Đổi từ ${tier.pointsCost} điểm thành viên.`,
          discountType: "FIXED",
          discountValue: tier.discountValue,
          minOrderAmount: tier.minOrderAmount,
          maxDiscountAmount: tier.discountValue,
          startAt,
          endAt,
          usageLimit: 1,
          usageLimitPerUser: 1,
          usedCount: 0,
          isActive: true,
          ownerUserId: userId,
        },
      }),
    ]);

    return {
      success: true,
      message: `Đổi thành công mã giảm ${tier.name}!`,
      remainingPoints: updatedUser.loyaltyPoints,
      voucher: {
        id: promotion.id.toString(),
        code: promotion.code,
        name: promotion.name,
        discountValue: Number(promotion.discountValue),
        minOrderAmount: Number(promotion.minOrderAmount),
        startAt: promotion.startAt.toISOString(),
        endAt: promotion.endAt.toISOString(),
        isUsed: false,
      },
    };
  }

  /**
   * Lấy danh sách voucher thuộc quyền sở hữu của người dùng.
   */
  async getMyVouchers(userId: bigint) {
    const vouchers = await this.prisma.promotion.findMany({
      where: { ownerUserId: userId },
      orderBy: { id: "desc" },
    });

    const now = new Date();

    return vouchers.map((v) => {
      const isUsed = v.usedCount >= (v.usageLimit ?? 1);
      const isExpired = v.endAt < now;
      return {
        id: v.id.toString(),
        code: v.code,
        name: v.name,
        description: v.description,
        discountType: v.discountType,
        discountValue: Number(v.discountValue),
        minOrderAmount: Number(v.minOrderAmount),
        startAt: v.startAt.toISOString(),
        endAt: v.endAt.toISOString(),
        isUsed,
        isExpired,
        canApply: !isUsed && !isExpired && v.isActive,
      };
    });
  }

  /**
   * Lấy lịch sử biến động điểm thưởng:
   * - Tích điểm (+100 điểm) từ các đơn hàng thanh toán thành công.
   * - Tiêu điểm (-200, -500, -1000 điểm) từ các giao dịch đổi voucher.
   */
  async getLoyaltyHistory(userId: bigint) {
    const [earnedOrders, redeemedVouchers] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          userId,
          pointsEarned: { gt: 0 },
        },
        include: {
          payments: {
            where: { status: "SUCCESS" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.promotion.findMany({
        where: { ownerUserId: userId },
        orderBy: { id: "desc" },
      }),
    ]);

    const historyItems: Array<{
      id: string;
      type: "EARN" | "REDEEM";
      points: number;
      title: string;
      description: string;
      date: string;
    }> = [];

    // Cộng điểm từ đơn hàng
    for (const order of earnedOrders) {
      const paidDate = order.payments?.[0]?.paidAt || order.createdAt;
      historyItems.push({
        id: `earn-${order.id}`,
        type: "EARN",
        points: order.pointsEarned,
        title: `Tích điểm từ đơn hàng #${order.orderCode}`,
        description: "Thanh toán đơn hàng thành công tại BrewLite",
        date: new Date(paidDate).toISOString(),
      });
    }

    // Tiêu điểm từ đổi voucher
    for (const voucher of redeemedVouchers) {
      // Tìm số điểm tương ứng từ giá trị giảm
      const tier = REWARD_TIERS.find((t) => t.discountValue === Number(voucher.discountValue));
      const pointsCost = tier ? tier.pointsCost : 200;

      historyItems.push({
        id: `redeem-${voucher.id}`,
        type: "REDEEM",
        points: -pointsCost,
        title: `Đổi mã ưu đãi ${voucher.name}`,
        description: `Mã: ${voucher.code}`,
        date: voucher.startAt.toISOString(),
      });
    }

    // Sắp xếp theo ngày giảm dần
    historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return historyItems;
  }
}

